import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {
    createTestUserWithPermissions,
    createTestProvider,
    TestUser,
    TestSchool,
    createTestSchool,
    createTestTherapyService,
    TestDataRegistry,
} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {Invoices} from '../../src/invoices';
import {TherapyServices} from '../../src/therapy-services';

const prisma = new PrismaClient();

describe.concurrent('GET /invoices', () => {
    let adminUser: TestUser;
    let providerUser: TestUser;
    let parentUser: TestUser;
    let school: TestSchool;
    let testProvider: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;
    let testStudent: any;
    let testTherapyService: any;

    // Set up test data
    beforeAll(async () => {
        // Create unique email suffixes for this test suite
        const uniqueSuffix = Date.now().toString();

        // Create users with different permissions and guaranteed unique emails
        adminUser = await createTestUserWithPermissions(['VIEW_INVOICES'], {
            emailSuffix: `admin-${uniqueSuffix}`
        });

        providerUser = await createTestUserWithPermissions([], {
            emailSuffix: `provider-${uniqueSuffix}`
        });

        parentUser = await createTestUserWithPermissions([], {
            emailSuffix: `parent-${uniqueSuffix}`
        });

        school = await createTestSchool('Test School');

        const tempProvider = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: "HOURLY",
                nssEnabled: false,
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: "ACTIVE"
            }
        });

        tempProviderId = tempProvider.id;

        for (let i = 0; i < 3; i++) {
            const document = await prisma.document.create({
                data: {
                    providerId: tempProviderId,
                    document: faker.lorem.paragraph(),
                    createdById: adminUser.id,
                }
            });
            documentIds.push(document.id);

            const contract = await prisma.contract.create({
                data: {
                    providerId: tempProviderId,
                    contract: faker.lorem.paragraph(),
                    createdById: adminUser.id,
                }
            });
            contractIds.push(contract.id);

            const contact = await prisma.contact.create({
                data: {
                    providerId: tempProviderId,
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                    cellPhone: faker.phone.number(),
                    workPhone: faker.phone.number(),
                    email: faker.internet.email(),
                    createdById: adminUser.id,
                }
            });
            contactIds.push(contact.id);
        }

        testProvider = await prisma.provider.create({
            data: {
                id: faker.string.uuid(),
                userId: providerUser.id,
                licenseNumber: faker.string.numeric(10),
                credentials: faker.string.alphanumeric(10),
                signature: faker.string.sample(),
                serviceFeeStructure: 'HOURLY',
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: 'ACTIVE',
                documents: {
                    create: faker.helpers.arrayElements(documentIds, {min: 1, max: 3}).map(id => ({
                        documentId: id
                    }))
                },
                contracts: {
                    create: faker.helpers.arrayElements(contractIds, {min: 1, max: 3}).map(id => ({
                        contractId: id
                    }))
                },
                contacts: {
                    create: faker.helpers.arrayElements(contactIds, {min: 1, max: 3}).map(id => ({
                        contactId: id
                    }))
                }
            }
        });

        // Create a student
        testStudent = await prisma.student.create({
            data: {
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED'
            }
        });

        // Create therapy service with this student and provider
        testTherapyService = await createTestTherapyService({
            studentId: testStudent.id,
            providerId: testProvider.id
        });

        // Create invoices for testing
        const invoiceStatuses = Object.values(Invoices.Status);
        for (const status of invoiceStatuses) {
            await prisma.invoice.create({
                data: {
                    providerId: testProvider.id,
                    studentId: testStudent.id,
                    therapyServiceId: testTherapyService.id,
                    amount: faker.number.float({min: 50, max: 500}),
                    status: status,
                    dateIssued: faker.date.recent()
                }
            });
        }
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should allow access when user has VIEW_INVOICES permission', async ({expect}) => {
        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an error when user lacks VIEW_INVOICES permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter invoices by provider name', async ({expect}) => {
        const uniqueFirstName = "Provider" + faker.string.alphanumeric(5);

        // Update the user with this unique first name
        await prisma.user.update({
            where: {id: providerUser.id},
            data: {
                firstName: uniqueFirstName,
                lastName: faker.person.lastName()
            }
        });

        // Create an invoice with this provider
        const invoice = await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });

        // Filter using provider's first name
        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({providerName: uniqueFirstName, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Check that returned invoices include the provider name we filtered by
        for (const invoice of res.body.data) {
            const providerFirstName = invoice.provider.user.firstName.toLowerCase();
            const providerLastName = invoice.provider.user.lastName.toLowerCase();
            const fullName = `${providerFirstName} ${providerLastName}`;

            expect(
                fullName.includes(uniqueFirstName.toLowerCase()) ||
                providerFirstName.includes(uniqueFirstName.toLowerCase())
            ).toBe(true);
        }
    });

    it('should filter invoices by student name', async ({expect}) => {
        // Create a student with a unique name we can filter by
        const uniqueLastName = "Student" + faker.string.alphanumeric(5);

        // Create a new student with the unique last name
        const student = await prisma.student.create({
            data: {
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED'
            }
        });

        // Create an invoice with this student
        const invoice = await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: student.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });

        // Call the API endpoint with student name filter
        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({studentName: uniqueLastName, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);

        for (const invoice of res.body.data) {
            const studentFirstName = invoice.student.firstName.toLowerCase();
            const studentLastName = invoice.student.lastName.toLowerCase();
            const fullName = `${studentFirstName} ${studentLastName}`;

            expect(
                fullName.includes(uniqueLastName.toLowerCase()) ||
                studentLastName.includes(uniqueLastName.toLowerCase())
            ).toBe(true);
        }
    });

    it('should filter invoices by therapy service type', async ({expect}) => {
        // Create a therapy service with a specific service type
        const serviceType = TherapyServices.ServiceType.SPEECH;
        const therapyService = await createTestTherapyService({
            serviceType,
            studentId: testStudent.id,
            providerId: testProvider.id
        });

        // Create an invoice with this therapy service
        await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: therapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });

        // Filter invoices by therapy service type
        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({therapyServiceType: serviceType, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Check that all returned invoices have the requested therapy service type
        for (const invoice of res.body.data) {
            expect(invoice.therapyService.serviceType).toBe(serviceType);
        }
    });

    it('should filter invoices by status', async ({expect}) => {
        // Test each status filter
        for (const status of Object.values(Invoices.Status)) {
            const res = await request(app)
                .get('/invoices')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({status, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');

            if (res.body.data.length > 0) {
                expect(res.body.data.every((invoice: { status: string }) =>
                    invoice.status === status)).toBe(true);
            }
        }
    });

    it('should filter invoices by date issued range', async ({expect}) => {
        const dateIssuedFrom = new Date();
        dateIssuedFrom.setMonth(dateIssuedFrom.getMonth() - 1);

        const dateIssuedTo = new Date();

        // Create an invoice with a date in this range
        await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: new Date(),
            }
        });

        const res = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                dateIssuedFrom: dateIssuedFrom.toISOString(),
                dateIssuedTo: dateIssuedTo.toISOString(),
                perPage: 10,
                page: 1
            });

        expect(res.status).toBe(200);
        if (res.body.data.length > 0) {
            for (const invoice of res.body.data) {
                const dateIssued = new Date(invoice.dateIssued);
                expect(dateIssued >= dateIssuedFrom && dateIssued <= dateIssuedTo).toBe(true);
            }
        }
    });

    it('should paginate results correctly', async ({expect}) => {
        // Create exactly 8 invoices with sequential dates to ensure consistent ordering
        const baseDateForTest = new Date();
        baseDateForTest.setDate(baseDateForTest.getDate() + 30); // 30 days in the future

        for (let i = 0; i < 8; i++) {
            const dateIssued = new Date(baseDateForTest);
            dateIssued.setMinutes(dateIssued.getMinutes() + i); // Add minutes for ordering

            await prisma.invoice.create({
                data: {
                    providerId: testProvider.id,
                    studentId: testStudent.id,
                    therapyServiceId: testTherapyService.id,
                    amount: faker.number.float({min: 50, max: 500}),
                    status: Invoices.Status.PENDING,
                    dateIssued
                }
            });
        }

        // Use a small perPage to ensure we get multiple pages
        const perPage = 3;

        // Sort by dateIssued to get consistent ordering
        const sortParams = {
            sortBy: "dateIssued",
            sortOrder: "desc" as const
        };

        // Get the first page
        const page1 = await request(app)
            .get('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                ...sortParams,
                perPage,
                page: 1
            });

        // Get the second page
        const page2 = await request(app)
            .get('/invoices')
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
                (i: { dateIssued: string }) => new Date(i.dateIssued).getTime()
            )));

            const page2NewestDate = new Date(Math.max(...page2.body.data.map(
                (i: { dateIssued: string }) => new Date(i.dateIssued).getTime()
            )));

            expect(page1OldestDate > page2NewestDate).toBe(true);
        }

        // Get IDs from both pages to ensure no overlap
        const page1Ids = page1.body.data.map((i: { id: string }) => i.id);
        const page2Ids = page2.body.data.map((i: { id: string }) => i.id);

        const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
        expect(hasOverlap).toBe(false);
    });
});
