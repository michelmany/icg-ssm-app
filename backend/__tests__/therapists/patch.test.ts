import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

describe.sequential('PATCH /therapists/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let therapistToUpdate: any;
    let therapistUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        therapistUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
        });

        // Create therapist to update in tests
        therapistToUpdate = await prisma.therapist.create({
            data: {
                userId: therapistUser.id,
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
            }
        });
    });

    it('should update therapist when requester has MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            disciplines: "Updated Disciplines",
            status: "INACTIVE",
        };

        const res = await request(app)
            .patch(`/therapists/${therapistToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the therapist was updated
        const updatedTherapist = await prisma.therapist.findUnique({
            where: {id: therapistToUpdate.id}
        });

        expect(updatedTherapist).not.toBeNull();
        expect(updatedTherapist?.disciplines).toBe(updateData.disciplines);
        expect(updatedTherapist?.status).toBe(updateData.status);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            disciplines: 'Should Not Update'
        };

        const res = await request(app)
            .patch(`/therapists/${therapistToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when therapist ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(`/therapists/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({disciplines: 'NonExistent'});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Therapist not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        const anotherTherapistUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
        });

        const anotherTherapist = await prisma.therapist.create({
            data: {
                userId: anotherTherapistUser.id,
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
            }
        });

        const originalTherapist = await prisma.therapist.findUnique({
            where: {id: anotherTherapist.id}
        });

        const updateData = {
            disciplines: "Updated Disciplines Only"
            // Only updating disciplines
        };

        const res = await request(app)
            .patch(`/therapists/${anotherTherapist.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only disciplines was updated
        const updatedTherapist = await prisma.therapist.findUnique({
            where: {id: anotherTherapist.id}
        });

        expect(updatedTherapist).not.toBeNull();
        expect(updatedTherapist?.disciplines).toBe(updateData.disciplines);
        expect(updatedTherapist?.status).toBe(originalTherapist?.status);
        expect(updatedTherapist?.licenseNumber).toBe(originalTherapist?.licenseNumber);
        expect(updatedTherapist?.medicaidNationalProviderId).toBe(originalTherapist?.medicaidNationalProviderId);
        expect(updatedTherapist?.socialSecurity).toBe(originalTherapist?.socialSecurity);
        expect(updatedTherapist?.stateMedicaidProviderId).toBe(originalTherapist?.stateMedicaidProviderId);
    });

    it('should record an activity log entry when therapist is updated', async ({expect}) => {
        const therapistActivityUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
        });

        const therapistForActivity = await prisma.therapist.create({
            data: {
                userId: therapistActivityUser.id,
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: "INACTIVE",
            }
        });

        await request(app)
            .patch(`/therapists/${therapistForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({disciplines: 'Updated for activity log'});

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 1000; // 1 second
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_THERAPIST',
                    subjectId: therapistForActivity.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // If found already, break out of the loop
            if (activityLog) {
                break;
            }

            // Wait 100ms before trying again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        expect(activityLog).not.toBeNull();
        expect(activityLog?.subjectId).toBe(therapistForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
