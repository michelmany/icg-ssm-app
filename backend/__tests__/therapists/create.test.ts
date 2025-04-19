import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser, TestDataRegistry} from '../utils/helpers';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

describe.concurrent('POST /therapists', () => {
    let adminUser: TestUser;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission with unique email suffix
        const uniqueSuffix = Date.now().toString();
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            emailSuffix: `admin-${uniqueSuffix}`
        });
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should create a new therapist when user has MANAGE_USERS permission', async ({expect}) => {
        const newTherapist = {
            userId: adminUser.id,
            disciplines: "testing disciplines",
            licenseNumber: faker.string.numeric(10),
            medicaidNationalProviderId: faker.number.int({min: 10000, max: 99999}),
            socialSecurity: faker.string.numeric(9),
            stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
            status: "ACTIVE",
        };

        const res = await request(app)
            .post('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newTherapist);

        expect(res.status).toBe(201);

        expect(res.body).toHaveProperty('id');

        const createdTherapist = await prisma.therapist.findFirst({
            where: {id: res.body.id}
        });

        expect(createdTherapist).not.toBeNull();
        expect(createdTherapist?.licenseNumber).toBe(newTherapist.licenseNumber);
        expect(createdTherapist?.disciplines).toBe(newTherapist.disciplines);
        expect(createdTherapist?.medicaidNationalProviderId).toBe(newTherapist.medicaidNationalProviderId);
        expect(createdTherapist?.socialSecurity).toBe(newTherapist.socialSecurity);
        expect(createdTherapist?.stateMedicaidProviderId).toBe(newTherapist.stateMedicaidProviderId);
        expect(createdTherapist?.status).toBe(newTherapist.status);
    });

    it('should return an error when user lacks MANAGE_USER permission', async ({expect}) => {
        // Create user with unique email
        const uniqueSuffix = Date.now().toString() + faker.string.alphanumeric(5);
        const regularUser = await createTestUserWithPermissions([], {
            emailSuffix: `regular-${uniqueSuffix}`
        });

        const newTherapist = {
            id: faker.string.uuid(),
            disciplines: "testing disciplines",
            licenseNumber: faker.string.numeric(10),
            medicaidNationalProviderId: faker.number.int({min: 10000, max: 99999}),
            socialSecurity: faker.string.numeric(9),
            stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
            status: "ACTIVE",
        };

        const res = await request(app)
            .post('/therapists')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newTherapist);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid request.');
        expect(res.body).toHaveProperty('errors');

        // Check for specific required field errors
        const requiredFields = [
            'disciplines',
            'licenseNumber',
            'medicaidNationalProviderId',
            'socialSecurity',
            'stateMedicaidProviderId',
            'userId'
        ];

        // Ensure all required fields are reported as missing
        requiredFields.forEach(field => {
            expect(res.body.errors).toContain(`${field}: Required`);
        });
    });
});
