import request from 'supertest';
import { describe, it, beforeAll } from 'vitest';
import app from '../../src/api/app';
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser, createTestRole, createTestSchool } from '../utils/helpers';

const prisma = new PrismaClient();

describe.concurrent('POST /users', () => {
    let adminUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);
    });

    it('should create a new user when user has MANAGE_USERS permission', async ({expect}) => {
        const role = await createTestRole('Test Role');
        const school = await createTestSchool('Test School');

        const newUser = {
            firstName: 'New',
            lastName: 'User',
            email: `newuser-${Date.now()}@example.com`,
            securityLevel: 'FULL_ACCESS',
            schoolId: school.id,
            roleId: role.id,
            phoneNumber: '+1234567890',
            status: 'ACTIVE',
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newUser);

        expect(res.status).toBe(204);

        const createdUser = await prisma.user.findUnique({
            where: { email: newUser.email },
            include: { school: true, role: true },
        });

        expect(createdUser).not.toBeNull();
        expect(createdUser?.firstName).toBe(newUser.firstName);
        expect(createdUser?.lastName).toBe(newUser.lastName);
        expect(createdUser?.email).toBe(newUser.email);
        expect(createdUser?.securityLevel).toBe(newUser.securityLevel);
        expect(createdUser?.phoneNumber).toBe(newUser.phoneNumber);
        expect(createdUser?.school?.id).toBe(newUser.schoolId);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const role = await createTestRole('Test Role');
        const school = await createTestSchool('Test School');

        const newUser = {
            firstName: 'New',
            lastName: 'User',
            email: `newuser-${Date.now()}@example.com`,
            securityLevel: 'FULL_ACCESS',
            schoolId: school.id,
            roleId: role.id,
            phoneNumber: '+1234567890',
            status: 'ACTIVE',
        };

        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newUser);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('length');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });
});
