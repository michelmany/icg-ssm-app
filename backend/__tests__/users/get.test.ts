import request from 'supertest';
import { describe, it, beforeAll } from 'vitest';
import app from '../../src/api/app';
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser, createTestUser } from '../utils/helpers';
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

describe.concurrent('GET /users/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let testUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create a test user to find
        testUser = await createTestUser({
            firstName: 'Find',
            lastName: 'Me',
            email: `find-${Date.now()}@example.com`,
            roleId: regularUser.roleId,
        });
    });

    it('should find a user by ID when user has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get(`/users/${testUser.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id', testUser.id);
        expect(res.body.data).toHaveProperty('firstName', testUser.firstName);
        expect(res.body.data).toHaveProperty('lastName', testUser.lastName);
        expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get(`/users/${testUser.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when user ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .get(`/users/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'User not found.');
    });
});
