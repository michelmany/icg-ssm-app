import request from 'supertest';
import { describe, it, beforeAll } from 'vitest';
import app from '../../src/api/app';
import { PrismaClient, SecurityLevel, UserStatus } from '@prisma/client';
import { createTestUserWithPermissions, TestUser, createTestUser, createTestSchool } from '../utils/helpers';
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

describe.concurrent('PATCH /users/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let userToUpdate: TestUser;
    let newSchool: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create a user to update in tests
        userToUpdate = await createTestUser({
            firstName: 'Update',
            lastName: 'Me',
            email: `update-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });

        // Create a new school for updating user's school
        newSchool = await createTestSchool('New School');
    });

	it('should update a user when requester has MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            firstName: 'Updated',
            lastName: 'User',
            email: `updated-${Date.now()}@example.com`,
            securityLevel: SecurityLevel.LIMITED,
            status: UserStatus.INACTIVE,
            phoneNumber: '+1987654321',
            schoolId: newSchool.id,
        };

        const res = await request(app)
            .patch(`/users/${userToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the user was updated
        const updatedUser = await prisma.user.findUnique({
            where: { id: userToUpdate.id },
            include: { school: true }
        });

        expect(updatedUser).not.toBeNull();
        expect(updatedUser?.firstName).toBe(updateData.firstName);
        expect(updatedUser?.lastName).toBe(updateData.lastName);
        expect(updatedUser?.email).toBe(updateData.email);
        expect(updatedUser?.securityLevel).toBe(updateData.securityLevel);
        expect(updatedUser?.status).toBe(updateData.status);
        expect(updatedUser?.phoneNumber).toBe(updateData.phoneNumber);
        expect(updatedUser?.schoolId).toBe(updateData.schoolId);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            firstName: 'Should',
            lastName: 'NotUpdate',
        };

        const res = await request(app)
            .patch(`/users/${userToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when user ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(`/users/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ firstName: 'NonExistent' });

        expect(res.body).toHaveProperty('message', 'User not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        const anotherUser = await createTestUser({
            firstName: 'Partial',
            lastName: 'Update',
            email: `partial-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });

        const originalUser = await prisma.user.findUnique({
            where: { id: anotherUser.id }
        });

        const updateData = {
            firstName: 'NewFirst',
            // Only updating firstName
        };

        const res = await request(app)
            .patch(`/users/${anotherUser.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only firstName was updated
        const updatedUser = await prisma.user.findUnique({
            where: { id: anotherUser.id }
        });

        expect(updatedUser).not.toBeNull();
        expect(updatedUser?.firstName).toBe(updateData.firstName);
        expect(updatedUser?.lastName).toBe(originalUser?.lastName);
        expect(updatedUser?.email).toBe(originalUser?.email);
        expect(updatedUser?.securityLevel).toBe(originalUser?.securityLevel);
        expect(updatedUser?.status).toBe(originalUser?.status);
    });

    it('should record an activity log entry when a user is updated', async ({expect}) => {
        const userForActivity = await createTestUser({
            firstName: 'Activity',
            lastName: 'Log',
            email: `activity-update-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });

        await request(app)
            .patch(`/users/${userForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ firstName: 'UpdatedActivity' });

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_USER',
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
