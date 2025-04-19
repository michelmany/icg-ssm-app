import request from 'supertest';
import {describe, expect, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser, createTestTherapyService} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {TherapyServices} from '../../src/therapy-services';

const prisma = new PrismaClient();

describe.concurrent('PATCH /therapy-services/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let therapyServiceToUpdate: any;

    // Set up test data
    beforeAll(async () => {
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);
        regularUser = await createTestUserWithPermissions([]);

        // Find existing student and provider
        const student = await prisma.student.findFirst({
            where: { status: 'ACTIVE' }
        });

        const provider = await prisma.provider.findFirst({
            where: { status: 'ACTIVE' }
        });

        expect(student).toBeDefined();
        expect(provider).toBeDefined();

        // Create therapy service using existing student and provider
        therapyServiceToUpdate = await prisma.therapyService.create({
            data: {
                studentId: student!.id,
                providerId: provider!.id,
                serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
                status: faker.helpers.enumValue(TherapyServices.TherapyStatus),
                sessionDate: faker.date.recent(),
                sessionNotes: faker.lorem.paragraph(),
                deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
                serviceBeginDate: faker.date.past(),
            }
        });
    });

    it('should update therapy service when requester has MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            status: TherapyServices.TherapyStatus.COMPLETED,
            sessionNotes: faker.lorem.paragraph(),
        };

        const res = await request(app)
            .patch(`/therapy-services/${therapyServiceToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the therapy service was updated
        const updatedTherapyService = await prisma.therapyService.findUnique({
            where: {id: therapyServiceToUpdate.id}
        });

        expect(updatedTherapyService).not.toBeNull();
        expect(updatedTherapyService?.status).toBe(updateData.status);
        expect(updatedTherapyService?.sessionNotes).toBe(updateData.sessionNotes);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            sessionNotes: 'Should Not Update'
        };

        const res = await request(app)
            .patch(`/therapy-services/${therapyServiceToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when therapy service ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(`/therapy-services/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({sessionNotes: 'NonExistent'});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Therapy service not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        // Find existing student and provider
        const student = await prisma.student.findFirst({
            where: { status: 'ACTIVE' }
        });

        const provider = await prisma.provider.findFirst({
            where: { status: 'ACTIVE' }
        });

        expect(student).toBeDefined();
        expect(provider).toBeDefined();

        // Create therapy service using existing student and provider
        const anotherTherapyService = await prisma.therapyService.create({
            data: {
                studentId: student!.id,
                providerId: provider!.id,
                serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
                status: TherapyServices.TherapyStatus.SCHEDULED,
                sessionDate: faker.date.recent(),
                sessionNotes: 'Original session notes',
                deliveryMode: TherapyServices.TherapyDeliveryMode.IN_PERSON,
                serviceBeginDate: faker.date.past(),
            }
        });

        const originalTherapyService = await prisma.therapyService.findUnique({
            where: {id: anotherTherapyService.id}
        });

        const updateData = {
            status: TherapyServices.TherapyStatus.COMPLETED,
            // Only updating status
        };

        const res = await request(app)
            .patch(`/therapy-services/${anotherTherapyService.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only status was updated
        const updatedTherapyService = await prisma.therapyService.findUnique({
            where: {id: anotherTherapyService.id}
        });

        expect(updatedTherapyService).not.toBeNull();
        expect(updatedTherapyService?.status).toBe(updateData.status);
        expect(updatedTherapyService?.sessionNotes).toBe(originalTherapyService?.sessionNotes);
        expect(updatedTherapyService?.serviceType).toBe(originalTherapyService?.serviceType);
        expect(updatedTherapyService?.deliveryMode).toBe(originalTherapyService?.deliveryMode);
    });

    it('should record an activity log entry when therapy service is updated', async ({expect}) => {
        // Find existing student and provider
        const student = await prisma.student.findFirst({
            where: { status: 'ACTIVE' }
        });

        const provider = await prisma.provider.findFirst({
            where: { status: 'ACTIVE' }
        });

        expect(student).toBeDefined();
        expect(provider).toBeDefined();

        const therapyServiceForActivity = await prisma.therapyService.create({
            data: {
                studentId: student!.id,
                providerId: provider!.id,
                serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
                status: TherapyServices.TherapyStatus.SCHEDULED,
                sessionDate: faker.date.recent(),
                sessionNotes: faker.lorem.paragraph(),
                deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
                serviceBeginDate: faker.date.past(), // Add required field
            }
        });

        await request(app)
            .patch(`/therapy-services/${therapyServiceForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({sessionNotes: 'Updated for activity log'});

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 1000; // 1 second
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_THERAPY_SERVICE',
                    subjectId: therapyServiceForActivity.id,
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
        expect(activityLog?.subjectId).toBe(therapyServiceForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
