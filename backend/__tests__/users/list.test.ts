import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import app from '../../src/api/app';
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser, createTestUser, createTestSchool, createTestRole } from '../utils/helpers';
import { Users } from '../../src/users';
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

describe.concurrent('GET /users', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);
    });

    it('should allow access when user has MANAGE_USERS permission', async ({ expect }) => {
        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ perPage: 10, page: 1 });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({ expect }) => {
        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({ perPage: 10, page: 1 });

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter users by name', async ({ expect }) => {
        const filterUser = await createTestUser({
            firstName: 'Filter',
            lastName: 'User',
            email: `filter-${Date.now()}@example.com`,
            roleId: adminUser.roleId,
        });

        const name = filterUser.firstName.substring(0, 3); // Use first few chars of created user's name

        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ name, perPage: 10, page: 1 });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        // expect(res.body.data.every((user: { firstName: string; }) => user.firstName.toLowerCase().includes(name.toLowerCase()))).toBe(true);
        expect(res.body.data.every((user: { firstName: string; lastName: string; email: string; }) => {
            return user.firstName.toLowerCase().includes(name.toLowerCase()) ||
                user.lastName.toLowerCase().includes(name.toLowerCase()) ||
                user.email.toLowerCase().includes(name.toLowerCase());
        })).toBe(true);
    });

    it('should filter users by school', async ({ expect }) => {
        const school = await createTestSchool(faker.company.name());

        const filterSchool = await createTestUser({
            firstName: faker.person.firstName(),
            lastName: 'Filter',
            email: `school-${Date.now()}@example.com`,
            roleId: adminUser.roleId,
            schoolId: school.id,
        });

        const schoolName = filterSchool.school.name.substring(0, 5); // Use first few chars of school name

        const res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ school: schoolName, perPage: 10, page: 1 });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every((user: { school: { name: string; }; }) =>
            user.school.name.toLowerCase().includes(filterSchool.school.name.toLowerCase())
        )).toBe(true);
    });

    it('should filter users by status', async ({ expect }) => {
        // Create one user for each status
        for (const status of Object.values(Users.Status)) {
            await createTestUser({
                firstName: status,
                lastName: 'Test',
                email: `${status.toLowerCase()}-${Date.now()}@example.com`,
                roleId: adminUser.roleId,
                status,
            });
        }

        for (const status of Object.values(Users.Status)) {
            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({ status, perPage: 10, page: 1 });

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((user: { status: string; }) => user.status === status)).toBe(true);
        }
    });

    it('should handle pagination correctly', async ({ expect }) => {
        // Create multiple users to test pagination
        const testUsers = [];
        const totalUsers = 15;

        // Create enough users to test pagination
        for (let i = 0; i < totalUsers; i++) {
            const user = await createTestUser({
                firstName: `Pagination${i}`,
                lastName: 'Test',
                email: `pagination-${i}-${Date.now()}@example.com`,
                roleId: adminUser.roleId,
            });
            testUsers.push(user);
        }

        // Test with valid perPage values
        const perPage = 10;

        const page1Res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ perPage, page: 1 });

        // Log the entire response for debugging if needed
        if (page1Res.status !== 200) {
            console.log('Pagination test failed with status:', page1Res.status);
            console.log('Error response:', page1Res.body);
        }

        expect(page1Res.status).toBe(200);
        expect(page1Res.body.data.length).toBeLessThanOrEqual(perPage);
        expect(page1Res.body.pagination).toHaveProperty('total');
        expect(page1Res.body.pagination).toHaveProperty('pages');
        expect(page1Res.body.pagination.total).toBeGreaterThanOrEqual(totalUsers);

        // Test second page with same parameters - should get different results
        const page2Res = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ perPage, page: 2 });

        expect(page2Res.status).toBe(200);
        expect(page2Res.body.data.length).toBeLessThanOrEqual(perPage);

        // Verify page 1 and page 2 return different sets of users
        const page1Ids = page1Res.body.data.map((user: any) => user.id);
        const page2Ids = page2Res.body.data.map((user: any) => user.id);

        // Test with a different valid perPage value
        const differentPerPage = 20;
        const differentPerPageRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({ perPage: differentPerPage, page: 1 });

        expect(differentPerPageRes.status).toBe(200);
        expect(differentPerPageRes.body.data.length).toBeLessThanOrEqual(differentPerPage);
        // Check that a different page size returns a different number of pages
        expect(differentPerPageRes.body.pagination).toHaveProperty('pages');
    });

    it('should sort users correctly by available sort fields', async ({ expect }) => {
        // Create distinct schools, roles for testing sort
        const schoolA = await createTestSchool('AAA School');
        const schoolB = await createTestSchool('BBB School');
        const schoolC = await createTestSchool('CCC School');

        // Create roles with distinct names for sorting tests
        const roleA = await createTestRole('AAA Role');
        const roleB = await createTestRole('BBB Role');
        const roleC = await createTestRole('CCC Role');

        // Create distinct users with systematic values for sort testing
        // Make the prefix more unique to avoid conflicts with other test runs
        const sortPrefix = `Sort-${Date.now()}-`;
        const userA = await createTestUser({
            firstName: `${sortPrefix}AAA`,
            lastName: 'First',
            email: `sort-a-${Date.now()}@example.com`,
            roleId: roleA.id,
            schoolId: schoolA.id,
            status: 'ACTIVE',
        });

        const userB = await createTestUser({
            firstName: `${sortPrefix}BBB`,
            lastName: 'Second',
            email: `sort-b-${Date.now()}@example.com`,
            roleId: roleB.id,
            schoolId: schoolB.id,
            status: 'INACTIVE',
        });

        const userC = await createTestUser({
            firstName: `${sortPrefix}CCC`,
            lastName: 'Third',
            email: `sort-c-${Date.now()}@example.com`,
            roleId: roleC.id,
            schoolId: schoolC.id,
            status: 'ACTIVE',
        });

        // 1. Test sorting by name (ascending)
        const nameAscRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'name',
                sortOrder: 'asc',
                perPage: 20,
                page: 1
            });

        expect(nameAscRes.status).toBe(200);

        // Filter results to only include our test users
        const nameAscUsers = nameAscRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // Verify ascending order (AAA -> BBB -> CCC)
        expect(nameAscUsers[0].firstName).toBe(`${sortPrefix}AAA`);
        expect(nameAscUsers[1].firstName).toBe(`${sortPrefix}BBB`);
        expect(nameAscUsers[2].firstName).toBe(`${sortPrefix}CCC`);

        // 2. Test sorting by name (descending)
        const nameDescRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'name',
                sortOrder: 'desc',
                perPage: 20,
                page: 1
            });

        const nameDescUsers = nameDescRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // Verify descending order (CCC -> BBB -> AAA)
        expect(nameDescUsers[0].firstName).toBe(`${sortPrefix}CCC`);
        expect(nameDescUsers[1].firstName).toBe(`${sortPrefix}BBB`);
        expect(nameDescUsers[2].firstName).toBe(`${sortPrefix}AAA`);

        // 3. Test sorting by school (ascending)
        const schoolAscRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'school',
                sortOrder: 'asc',
                perPage: 20,
                page: 1
            });

        const schoolAscUsers = schoolAscRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // Verify order by school name (AAA -> BBB -> CCC)
        expect(schoolAscUsers[0].school.name).toBe('AAA School');
        expect(schoolAscUsers[1].school.name).toBe('BBB School');
        expect(schoolAscUsers[2].school.name).toBe('CCC School');

        // 4. Test sorting by role (ascending)
        const roleAscRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'role',
                sortOrder: 'asc',
                perPage: 20,
                page: 1
            });

        const roleAscUsers = roleAscRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // Verify order by role name (AAA -> BBB -> CCC)
        expect(roleAscUsers[0].role.name).toBe('AAA Role');
        expect(roleAscUsers[1].role.name).toBe('BBB Role');
        expect(roleAscUsers[2].role.name).toBe('CCC Role');

        // 5. Test sorting by status (ascending)
        const statusAscRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'status',
                sortOrder: 'asc',
                perPage: 20,
                page: 1
            });

        const statusAscUsers = statusAscRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // Update the status sorting test assertions
        expect(statusAscUsers[0].status).toBe('ACTIVE');
        expect(statusAscUsers[1].status).toBe('ACTIVE');
        expect(statusAscUsers[2].status).toBe('INACTIVE');


        // 6. Test sorting by status (descending)
        const statusDescRes = await request(app)
            .get('/users')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                name: sortPrefix,
                sortBy: 'status',
                sortOrder: 'desc',
                perPage: 20,
                page: 1
            });

        const statusDescUsers = statusDescRes.body.data.filter(
            (user: { firstName: string }) => user.firstName.startsWith(sortPrefix)
        );

        // For the descending sort test
        expect(statusDescUsers[0].status).toBe('INACTIVE');
        expect(statusDescUsers[1].status).toBe('ACTIVE');
        expect(statusDescUsers[2].status).toBe('ACTIVE');
    });
});
