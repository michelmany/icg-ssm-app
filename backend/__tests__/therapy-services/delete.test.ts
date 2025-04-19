import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser, createTestTherapyService} from '../utils/helpers';
import {faker} from "@faker-js/faker";
import {TherapyServices} from '../../src/therapy-services';

const prisma = new PrismaClient();

describe.concurrent('DELETE /therapy-services/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let therapyServiceToDelete: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USER permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create therapy service to be deleted in tests
        therapyServiceToDelete = await createTestTherapyService({
            serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
            status: faker.helpers.enumValue(TherapyServices.TherapyStatus),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
        });
    });

    it('should delete therapy service when requester has MANAGE_USER permission', async ({expect}) => {
        const res = await request(app)
            .delete(`/therapy-services/${therapyServiceToDelete.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(204);

        // Verify the therapy service was soft deleted
        const deletedTherapyService = await prisma.therapyService.findUnique({
            where: {id: therapyServiceToDelete.id}
        });

        expect(deletedTherapyService).not.toBeNull();
        expect(deletedTherapyService?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks MANAGE_USER permission', async ({expect}) => {
        // Create another therapy service to attempt to delete
        const anotherTherapyService = await createTestTherapyService({
            serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
            status: faker.helpers.enumValue(TherapyServices.TherapyStatus),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
        });

        const res = await request(app)
            .delete(`/therapy-services/${anotherTherapyService.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify therapy service wasn't deleted
        const therapyService = await prisma.therapyService.findUnique({
            where: {id: anotherTherapyService.id}
        });

        expect(therapyService).not.toBeNull();
        expect(therapyService?.deletedAt).toBeNull();
    });

    it('should return an error when therapy service ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(`/therapy-services/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('message', 'Therapy service not found.');
    });

    it('should record an activity log entry when therapy service is deleted', async ({expect}) => {
        // Create therapy service to delete
        const therapyServiceForActivity = await createTestTherapyService({
            serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
            status: faker.helpers.enumValue(TherapyServices.TherapyStatus),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
        });

        await request(app)
            .delete(`/therapy-services/${therapyServiceForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_THERAPY_SERVICE',
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
