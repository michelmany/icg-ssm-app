import request from 'supertest';
import { describe, it, beforeAll } from 'vitest';
import app from '../../src/api/app';
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser, createTestUser } from '../utils/helpers';
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

describe.concurrent('DELETE /users/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let userToDelete: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create a user to be deleted in tests
        userToDelete = await createTestUser({
            firstName: 'Delete',
            lastName: 'Me',
            email: `delete-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });
    });

    it('should delete a user when requester has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .delete(`/users/${userToDelete.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(204);

        // Verify the user was soft deleted
        const deletedUser = await prisma.user.findUnique({
            where: { id: userToDelete.id }
        });

        expect(deletedUser).not.toBeNull();
        expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        // Create another user to attempt to delete
        const anotherUser = await createTestUser({
            firstName: 'Another',
            lastName: 'User',
            email: `another-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });

        const res = await request(app)
            .delete(`/users/${anotherUser.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify user wasn't deleted
        const user = await prisma.user.findUnique({
            where: { id: anotherUser.id }
        });

        expect(user).not.toBeNull();
        expect(user?.deletedAt).toBeNull();
    });

    it('should return an error when user ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(`/users/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('message', 'User not found.');
    });

    it('should record an activity log entry when a user is deleted', async ({expect}) => {
        // Create a user to delete
        const userForActivity = await createTestUser({
            firstName: 'Activity',
            lastName: 'Log',
            email: `activity-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });

        await request(app)
            .delete(`/users/${userForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_USER',
                    subjectId: userForActivity.id,
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
        expect(activityLog?.subjectId).toBe(userForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
