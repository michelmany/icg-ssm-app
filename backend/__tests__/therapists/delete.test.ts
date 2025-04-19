import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from "@faker-js/faker";

const prisma = new PrismaClient();

describe.sequential('DELETE /therapists/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let therapistToDelete: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        const therapistUser = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: faker.internet.email(),
                passwordHash: faker.internet.password(),
                status: 'ACTIVE',
                securityLevel: 'FULL_ACCESS',
                schoolId: null,
                roleId: null,
            }
        });

        // Create therapist to be deleted in tests
        therapistToDelete = await prisma.therapist.create({
            data: {
                id: faker.string.uuid(),
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
                user: {
                    connect: {
                        id: therapistUser.id
                    }
                }
            }
        });
    });

    it('should delete therapist when requester has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .delete(`/therapists/${therapistToDelete.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(204);

        // Verify the therapist was soft deleted
        const deletedTherapist = await prisma.therapist.findUnique({
            where: {id: therapistToDelete.id}
        });

        expect(deletedTherapist).not.toBeNull();
        expect(deletedTherapist?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const anotherTherapistUser = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: faker.internet.email(),
                passwordHash: faker.internet.password(),
                status: 'ACTIVE',
                securityLevel: 'FULL_ACCESS',
                schoolId: null,
                roleId: null,
            }
        });

        // Create another therapist to attempt to delete
        const anotherTherapist = await prisma.therapist.create({
            data: {
                id: faker.string.uuid(),
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
                user: {
                    connect: {
                        id: anotherTherapistUser.id
                    }
                }
            }
        });

        const res = await request(app)
            .delete(`/therapists/${anotherTherapist.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify therapist wasn't deleted
        const therapist = await prisma.therapist.findUnique({
            where: {id: anotherTherapist.id}
        });

        expect(therapist).not.toBeNull();
        expect(therapist?.deletedAt).toBeNull();
    });

    it('should return an error when therapist ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(`/therapists/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('message', 'Therapist not found.');
    });

    it('should record an activity log entry when therapist is deleted', async ({expect}) => {
        const activityTherapistUser = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: faker.internet.email(),
                passwordHash: faker.internet.password(),
                status: 'ACTIVE',
                securityLevel: 'FULL_ACCESS',
                schoolId: null,
                roleId: null,
            }
        });

        // Create therapist to delete
        const therapistForActivity = await prisma.therapist.create({
            data: {
                id: faker.string.uuid(),
                disciplines: faker.person.jobArea(),
                licenseNumber: faker.string.numeric({length: 10}),
                medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                socialSecurity: faker.string.numeric({length: 9}),
                stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE", "PENDING"]),
                user: {
                    connect: {
                        id: activityTherapistUser.id
                    }
                }
            }
        });

        await request(app)
            .delete(`/therapists/${therapistForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_THERAPIST',
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
