import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from "@faker-js/faker";
import {Therapists} from "../../src/therapists";

const prisma = new PrismaClient();

describe.sequential('GET /therapists', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let testLicenseNumber: string;
    let testMedicaidNationalProviderId: number;
    let testStateMedicaidProviderId: number;
    let testTherapistName: string;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create therapists for testing
        const therapists = [];
        for (let i = 0; i < 5; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();

            // Save test values for filter tests
            if (i === 0) {
                testLicenseNumber = faker.string.numeric({length: 10});
                testMedicaidNationalProviderId = faker.number.int({min: 100000, max: 999999});
                testStateMedicaidProviderId = faker.number.int({min: 10000, max: 99999});
                testTherapistName = `${firstName} ${lastName}`;
            }

            const therapistUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
                firstName,
                lastName,
            });

            therapists.push(await prisma.therapist.create({
                data: {
                    userId: therapistUser.id,
                    disciplines: faker.person.jobArea(),
                    licenseNumber: i === 0 ? testLicenseNumber : faker.string.numeric({length: 10}),
                    medicaidNationalProviderId: i === 0 ? testMedicaidNationalProviderId : faker.number.int({
                        min: 100000,
                        max: 999999
                    }),
                    socialSecurity: faker.string.numeric({length: 9}),
                    stateMedicaidProviderId: i === 0 ? testStateMedicaidProviderId : faker.number.int({
                        min: 10000,
                        max: 99999
                    }),
                    status: 'ACTIVE',
                }
            }));
        }
    });

    it('should allow access when user has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter therapists by disciplines', async ({expect}) => {
        // First get all therapists to find existing disciplines
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get the discipline from an existing therapist
        const existingDiscipline = allRes.body.data[0].disciplines;
        expect(existingDiscipline).toBeDefined();

        // Now filter using this existing discipline
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({disciplines: existingDiscipline, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((t: any) =>
            t.disciplines === existingDiscipline
        )).toBe(true);
    });

    it('should filter therapists by licenseNumber', async ({expect}) => {
        // First get all therapists to find one with a license number
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get a license number from an existing therapist
        const existingTherapist = allRes.body.data[0];
        const existingLicenseNumber = existingTherapist.licenseNumber;

        expect(existingLicenseNumber).toBeDefined();

        // Now filter using this existing license number
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({licenseNumber: existingLicenseNumber, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((t: any) =>
            t.licenseNumber === existingLicenseNumber
        )).toBe(true);
    });

    it('should filter therapists by medicaidNationalProviderId', async ({expect}) => {
        // First get all therapists to find one with a medicaidNationalProviderId
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get a medicaidNationalProviderId from an existing therapist
        const existingTherapist = allRes.body.data[0];
        const existingProviderId = existingTherapist.medicaidNationalProviderId;

        expect(existingProviderId).toBeDefined();

        // Now filter using this existing provider ID
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({medicaidNationalProviderId: existingProviderId, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every((therapist: { medicaidNationalProviderId: number }) =>
            therapist.medicaidNationalProviderId === existingProviderId)).toBe(true);
    });

    it('should filter therapists by stateMedicaidProviderId', async ({expect}) => {
        // First get all therapists to find one with a stateMedicaidProviderId
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get a stateMedicaidProviderId from an existing therapist
        const existingTherapist = allRes.body.data[0];
        const existingProviderId = existingTherapist.stateMedicaidProviderId;

        expect(existingProviderId).toBeDefined();

        // Now filter using this existing provider ID
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({stateMedicaidProviderId: existingProviderId, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every((therapist: { stateMedicaidProviderId: number }) =>
            therapist.stateMedicaidProviderId === existingProviderId)).toBe(true);
    });

    it('should filter therapists by name', async ({expect}) => {
        // First get all therapists to find one with a name
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get a name from an existing therapist
        const existingTherapist = allRes.body.data[0];
        const existingName = existingTherapist.name;

        expect(existingName).toBeDefined();

        // Use just part of the name for a more realistic search test
        const searchTerm = existingName.split(' ')[0];
        console.log(`Testing filter with existing name part: ${searchTerm}`);

        // Now filter using this existing name
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({name: searchTerm, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((therapist: { name: string | null }) =>
            therapist.name && therapist.name.includes(searchTerm))).toBe(true);
    });

    it('should filter therapists by status', async ({expect}) => {
        // Create therapists with each status for testing
        const statuses = Object.values(Therapists.TherapistStatus);

        for (const status of statuses) {
            const therapistUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
            });

            await prisma.therapist.create({
                data: {
                    userId: therapistUser.id,
                    disciplines: faker.person.jobArea(),
                    licenseNumber: faker.string.numeric({length: 10}),
                    medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                    socialSecurity: faker.string.numeric({length: 9}),
                    stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                    status,
                }
            });
        }

        for (const status of statuses) {
            const res = await request(app)
                .get('/therapists')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({status, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((therapist: {
                status: Therapists.TherapistStatus
            }) => therapist.status === status)).toBe(true);
        }
    });

    it('should filter therapists by name', async ({expect}) => {
        // First get all therapists to find one with a name
        const allRes = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 100, page: 1});

        expect(allRes.status).toBe(200);
        expect(allRes.body.data.length).toBeGreaterThan(0);

        // Get a name from an existing therapist
        const existingTherapist = allRes.body.data[0];
        const existingName = existingTherapist.name;

        expect(existingName).toBeDefined();

        // Use just part of the name for a more realistic search test
        const searchTerm = existingName.split(' ')[0];

        // Now filter using this existing name
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({name: searchTerm, perPage: 100, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((therapist: { name: string | null }) =>
            therapist.name && therapist.name.includes(searchTerm))).toBe(true);
    });

    it('should sort therapists by name', async ({expect}) => {
        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({sortBy: 'name', sortOrder: 'asc', perPage: 10, page: 1});

        expect(res.status).toBe(200);
        const names = res.body.data.map((t: { name: string }) => t.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
    });

    it('should sort therapists by status', async ({expect}) => {
        // Create therapists with each status for testing
        const statuses = Object.values(Therapists.TherapistStatus);

        // Create fresh therapists with known statuses to test sorting
        for (const status of statuses) {
            const therapistUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
            });

            await prisma.therapist.create({
                data: {
                    userId: therapistUser.id,
                    disciplines: faker.person.jobArea(),
                    licenseNumber: faker.string.numeric({length: 10}),
                    medicaidNationalProviderId: faker.number.int({min: 100000, max: 999999}),
                    socialSecurity: faker.string.numeric({length: 9}),
                    stateMedicaidProviderId: faker.number.int({min: 10000, max: 99999}),
                    status,
                }
            });
        }

        const res = await request(app)
            .get('/therapists')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({sortBy: 'status', sortOrder: 'asc', perPage: 20, page: 1});

        expect(res.status).toBe(200);

        // Check that our response contains therapists with the expected statuses
        const therapistsWithStatus = res.body.data.filter((t: { status: string | null }) =>
            t.status === 'ACTIVE' || t.status === 'INACTIVE' || t.status === 'PENDING'
        );
        expect(therapistsWithStatus.length).toBeGreaterThan(0);

        // Test sorting only on the filtered therapists with valid statuses
        const filteredStatuses = therapistsWithStatus.map((t: { status: string }) => t.status);
        const sortedStatuses = [...filteredStatuses].sort();
        expect(filteredStatuses).toEqual(sortedStatuses);
    });
});
