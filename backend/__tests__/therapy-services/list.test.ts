import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {
    createTestUserWithPermissions,
    TestUser,
    TestSchool,
    createTestSchool,
    createTestTherapyService,
    TestDataRegistry,
} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {TherapyServices} from '../../src/therapy-services';

const prisma = new PrismaClient();

describe.sequential('GET /therapy-services', () => {
    let adminUser: TestUser;
    let providerUser: TestUser;
    let parentUser: TestUser;
    let school: TestSchool;

    // Set up test data
    beforeAll(async () => {
        // Create unique email suffixes for this test suite
        const uniqueSuffix = Date.now().toString();

        // Create users with different permissions and guaranteed unique emails
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            emailSuffix: `admin-${uniqueSuffix}`
        });

        providerUser = await createTestUserWithPermissions([], {
            emailSuffix: `provider-${uniqueSuffix}`
        });

        parentUser = await createTestUserWithPermissions([], {
            emailSuffix: `parent-${uniqueSuffix}`
        });

        school = await createTestSchool('Test School');
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should allow access when user has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const res = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter therapy services by student name', async ({expect}) => {
        // Create a student with a unique name we can filter by
        const uniqueLastName = "Student" + faker.string.alphanumeric(5);

        // Create a new student with the unique last name
        const student = await prisma.student.create({
            data: {
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: uniqueLastName,
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED'
            }
        });

        // Create therapy service with this student
        const therapy = await createTestTherapyService({
            studentId: student.id
        });

        // Call the API endpoint with student name filter
        const res = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({student: uniqueLastName, perPage: 10, page: 1});

        expect(res.status).toBe(200);

        // Find the created therapy service in the results
        const foundService = res.body.data.find((s: any) => s.id === therapy.id);
        expect(foundService, "Created therapy service not found in filtered results").toBeTruthy();

        // Check that all returned services include the student name we filtered by
        for (const service of res.body.data) {
            const studentFirstName = service.student.firstName.toLowerCase();
            const studentLastName = service.student.lastName.toLowerCase();
            const fullName = `${studentFirstName} ${studentLastName}`;

            expect(
                fullName.includes(uniqueLastName.toLowerCase()) ||
                studentLastName.includes(uniqueLastName.toLowerCase())
            ).toBe(true);
        }
    });

    it('should filter therapy services by provider name', async ({expect}) => {
        const uniqueFirstName = "Provider" + faker.string.alphanumeric(5);

        // Update the user with this unique first name
        await prisma.user.update({
            where: {id: providerUser.id},
            data: {
                firstName: uniqueFirstName,
                lastName: faker.person.lastName()
            }
        });

        const provider = await prisma.provider.create({
            data: {
                id: faker.string.uuid(),
                userId: providerUser.id,
                licenseNumber: faker.string.numeric(10),
                credentials: faker.string.alphanumeric(10),
                signature: faker.lorem.words(),
                serviceFeeStructure: 'HOURLY',
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: 'ACTIVE'
            }
        });

        const documents = await Promise.all(
            [1, 2, 3].map(async (num) => {
                return prisma.document.create({
                    data: {
                        providerId: provider.id,
                        document: `document_${num}`,
                        createdById: adminUser.id
                    }
                });
            })
        );

        const contracts = await Promise.all(
            [1, 2, 3].map(async (num) => {
                return prisma.contract.create({
                    data: {
                        providerId: provider.id,
                        contract: `contract_${num}`,
                        createdById: adminUser.id
                    }
                });
            })
        );

        const contacts = await Promise.all(
            [1, 2, 3].map(async (num) => {
                return prisma.contact.create({
                    data: {
                        providerId: provider.id,
                        firstName: faker.person.firstName(),
                        lastName: faker.person.lastName(),
                        cellPhone: faker.phone.number(),
                        workPhone: faker.phone.number(),
                        email: faker.internet.email(),
                        createdById: adminUser.id
                    }
                });
            })
        );

        await Promise.all([
            ...faker.helpers.arrayElements(documents, {min: 1, max: 3}).map(doc =>
                prisma.providerDocument.create({
                    data: {
                        providerId: provider.id,
                        documentId: doc.id
                    }
                })
            ),
            ...faker.helpers.arrayElements(contracts, {min: 1, max: 3}).map(contract =>
                prisma.providerContract.create({
                    data: {
                        providerId: provider.id,
                        contractId: contract.id
                    }
                })
            ),
            ...faker.helpers.arrayElements(contacts, {min: 1, max: 3}).map(contact =>
                prisma.providerContact.create({
                    data: {
                        providerId: provider.id,
                        contactId: contact.id
                    }
                })
            )
        ]);

        // Create therapy service with this provider
        const therapy = await createTestTherapyService({
            providerId: provider.id
        });

        // Filter using provider's first name
        const res = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({provider: uniqueFirstName, perPage: 10, page: 1});

        expect(res.status).toBe(200);

        // Find the created service in the results using the correct ID variable
        const foundService = res.body.data.find((s: any) => s.id === therapy.id);
        expect(foundService, "Created therapy service not found in filtered results").toBeTruthy();

        // Check that all returned services include the provider name we filtered by
        for (const service of res.body.data) {
            // Access firstName and lastName through the user object
            const providerFirstName = service.provider.user.firstName.toLowerCase();
            const providerLastName = service.provider.user.lastName.toLowerCase();
            const fullName = `${providerFirstName} ${providerLastName}`;

            expect(
                fullName.includes(uniqueFirstName.toLowerCase()) ||
                providerFirstName.includes(uniqueFirstName.toLowerCase())
            ).toBe(true);
        }
    });

    it('should filter therapy services by service type', async ({expect}) => {
        // Create therapy services with each service type for testing
        const serviceTypes = Object.values(TherapyServices.ServiceType);

        // Create test therapy services for each service type
        for (const serviceType of serviceTypes) {
            const therapy = await createTestTherapyService({serviceType});
        }

        // Test each service type filter
        for (const serviceType of serviceTypes) {
            const res = await request(app)
                .get('/therapy-services')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({serviceType, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((service: { serviceType: string }) =>
                service.serviceType === serviceType)).toBe(true);
        }
    });

    it('should filter therapy services by status', async ({expect}) => {
        // Create therapy services with each status for testing
        const statuses = Object.values(TherapyServices.TherapyStatus);

        // Create test therapy services for each status
        for (const status of statuses) {
            // Create at least one therapy service with this status
            await createTestTherapyService({status});
        }

        // Test each status filter
        for (const status of statuses) {
            const res = await request(app)
                .get('/therapy-services')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({status, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((service: { status: string }) =>
                service.status === status)).toBe(true);
        }
    });

    it('should filter therapy services by delivery mode', async ({expect}) => {
        const deliveryModes = Object.values(TherapyServices.TherapyDeliveryMode);

        for (const deliveryMode of deliveryModes) {
            await createTestTherapyService({deliveryMode});
        }

        // Test each delivery mode filter
        for (const deliveryMode of deliveryModes) {
            const res = await request(app)
                .get('/therapy-services')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({deliveryMode, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((service: { deliveryMode: string }) =>
                service.deliveryMode === deliveryMode)).toBe(true);
        }
    });

    it('should filter therapy services by date range', async ({expect}) => {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const midRangeDate = new Date();
        midRangeDate.setDate(midRangeDate.getDate() - 15); // Halfway between start and end

        const testService = await createTestTherapyService({
            sessionDate: midRangeDate,
            serviceType: TherapyServices.ServiceType.SPEECH
        });

        const outsideRangeDate = new Date();
        outsideRangeDate.setMonth(outsideRangeDate.getMonth() + 1); // One month in the future

        const outsideRangeService = await createTestTherapyService({
            sessionDate: outsideRangeDate,
            serviceType: TherapyServices.ServiceType.SPEECH
        });

        const res = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                serviceType: TherapyServices.ServiceType.SPEECH,
                perPage: 50,
                page: 1
            });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        const foundTestService = res.body.data.find((s: any) => s.id === testService.id);
        expect(foundTestService, "Created test service within date range not found in results").toBeTruthy();

        const sessionDate = new Date(foundTestService.sessionDate);
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const isInRange = sessionDate.getTime() >= startTimestamp &&
            sessionDate.getTime() <= endTimestamp;

        expect(isInRange, "Test service's date should be within the specified range").toBe(true);
    });

    it('should paginate results correctly', async ({expect}) => {
        // Create a unique identifier based on a timestamp to ensure uniqueness
        const uniqueTimestamp = Date.now();

        // Create a set of therapy services with future dates to ensure they're ordered first with desc sorting
        const baseDateForTest = new Date();
        baseDateForTest.setDate(baseDateForTest.getDate() + 30); // 30 days in the future

        // Create exactly 8 therapy services with sequential dates to ensure consistent ordering
        for (let i = 0; i < 8; i++) {
            const serviceDate = new Date(baseDateForTest);
            serviceDate.setMinutes(serviceDate.getMinutes() + i); // Add minutes for ordering

            await createTestTherapyService({
                sessionDate: serviceDate,
                // Add a unique property we can filter by
                serviceType: TherapyServices.ServiceType.SPEECH
            });
        }

        // Use a small perPage to ensure we get multiple pages
        const perPage = 3;

        // Sort by sessionDate to get consistent ordering
        const sortParams = {
            sortBy: "sessionDate",
            sortOrder: "desc" as const,
            serviceType: TherapyServices.ServiceType.SPEECH
        };

        // Get the first page
        const page1 = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                ...sortParams,
                perPage,
                page: 1
            });

        // Get the second page
        const page2 = await request(app)
            .get('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                ...sortParams,
                perPage,
                page: 2
            });

        expect(page1.status).toBe(200);
        expect(page2.status).toBe(200);

        // Check that we got the expected number of results on each page
        expect(page1.body.data.length).toBe(perPage);
        expect(page2.body.data.length).toBeGreaterThan(0);

        // Check pagination info is correct
        expect(page1.body.pagination.total).toBeGreaterThan(perPage);
        expect(page1.body.pagination.pages).toBeGreaterThan(1);

        // Verify all items on page 1 have later dates than any item on page 2
        if (page1.body.data.length > 0 && page2.body.data.length > 0) {
            const page1OldestDate = new Date(Math.min(...page1.body.data.map(
                (s: { sessionDate: string }) => new Date(s.sessionDate).getTime()
            )));

            const page2NewestDate = new Date(Math.max(...page2.body.data.map(
                (s: { sessionDate: string }) => new Date(s.sessionDate).getTime()
            )));

            expect(page1OldestDate > page2NewestDate).toBe(true);
        }

        // Get IDs from both pages to ensure no overlap
        const page1Ids = page1.body.data.map((s: { id: string }) => s.id);
        const page2Ids = page2.body.data.map((s: { id: string }) => s.id);

        const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
        expect(hasOverlap).toBe(false);
    });
});
