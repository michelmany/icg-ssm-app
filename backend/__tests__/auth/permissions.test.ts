import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import app from "../../src/api/app";
import { PrismaClient } from '@prisma/client';
import { createTestUserWithPermissions, TestUser } from '../utils/helpers';

const prisma = new PrismaClient();

describe("Permission Middleware Integration Test", () => {
    // We'll test a subset of permissions against real endpoints
    const permissionsToTest = [
        { permission: 'MANAGE_USERS', endpoint: '/users' },
        { permission: 'MANAGE_USERS', endpoint: '/schools' },
        { permission: 'MANAGE_USERS', endpoint: '/roles' },
    ];
    
    let testUsers: Record<string, TestUser> = {};
    
    beforeAll(async () => {
        // Create a user with each permission we want to test
        for (const { permission } of permissionsToTest) {
            testUsers[permission] = await createTestUserWithPermissions([permission]);
        }
        
        // Create a user with no permissions for negative testing
        testUsers.NO_PERMISSIONS = await createTestUserWithPermissions([]);
    });
    
    // Test each permission against its corresponding endpoint
    permissionsToTest.forEach(({ permission, endpoint }) => {
        describe(`Testing permission: ${permission} with endpoint ${endpoint}`, () => {
            it("should allow access when user has the required permission", async () => {
                const res = await request(app)
                    .get(endpoint)
                    .set("Authorization", `Bearer ${testUsers[permission]?.token || ''}`)
                    .query({ perPage: 10, page: 1 });
                
                expect(res.status).toBe(200);
            });
            
            it("should block access when user doesn't have the required permission", async () => {
                const res = await request(app)
                    .get(endpoint)
                    .set("Authorization", `Bearer ${testUsers.NO_PERMISSIONS?.token || ''}`)
                    .query({ perPage: 10, page: 1 });
                
                expect(res.status).toBe(403);
                expect(res.body).toHaveProperty('message');
            });
        });
    });
});