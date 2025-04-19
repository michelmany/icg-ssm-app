import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {
    createTestUserWithPermissions,
    TestUser,
    TestDataRegistry,
    createTestTherapyService,
    createTestSchool
} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {Invoices} from '../../src/invoices';

const prisma = new PrismaClient();

describe('POST /invoices', () => {
    let adminUser: TestUser;
    let testStudent: any;
    let parentUser: TestUser;
    let providerUser: TestUser;
    let testProvider: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;
    let testTherapyService: any;
    let testSchool: any;


    // Set up test data
    beforeAll(async () => {
        // Create user with VIEW_INVOICES permission
        adminUser = await createTestUserWithPermissions(['VIEW_INVOICES']);
        parentUser = await createTestUserWithPermissions([]);
        providerUser = await createTestUserWithPermissions([]);

        // Create school first
        testSchool = await createTestSchool('Test School');

        // Create provider
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

        testStudent = await prisma.student.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED',
                schoolId: testSchool.id,
            }
        });

        // Create therapy service with this student
        testTherapyService = await createTestTherapyService({
            studentId: testStudent.id,
            providerId: testProvider.id
        });
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should create a new invoice when user has VIEW_INVOICES permission', async ({expect}) => {
        const newInvoice = {
            providerId: testProvider.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            amount: faker.number.float({ min: 0, max: 100 }),
            status: Invoices.Status.PENDING,
            dateIssued: faker.date.recent()
        };

        const res = await request(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newInvoice);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');

        const invoiceId = res.body.id;

        // Verify the invoice was created in the database
        const createdInvoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                provider: true,
                student: true,
                therapyService: true
            }
        });

        expect(createdInvoice).not.toBeNull();
        expect(createdInvoice?.providerId).toBe(newInvoice.providerId);
        expect(createdInvoice?.studentId).toBe(newInvoice.studentId);
        expect(createdInvoice?.therapyServiceId).toBe(newInvoice.therapyServiceId);
        expect(Number(createdInvoice?.amount)).toEqual(newInvoice.amount);
        expect(createdInvoice?.status).toBe(newInvoice.status);
        expect(createdInvoice?.provider).toHaveProperty('id');
        expect(createdInvoice?.student).toHaveProperty('firstName');
        expect(createdInvoice?.therapyService).toHaveProperty('id');
    });

    it('should return an error when user lacks VIEW_INVOICES permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const newInvoice = {
            providerId: testProvider.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            amount: faker.number.float({min: 50, max: 500, fractionDigits: 2}),
            status: Invoices.Status.PENDING,
            dateIssued: faker.date.recent()
        };

        const res = await request(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newInvoice);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('length');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should use the default PENDING status when not specified', async ({expect}) => {
        const newInvoice = {
            providerId: testProvider.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            amount: faker.number.float({min: 50, max: 500, fractionDigits: 2}),
            dateIssued: faker.date.recent()
            // status is not specified on purpose
        };

        const res = await request(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newInvoice);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');

        // Verify the invoice was created with default status
        const createdInvoice = await prisma.invoice.findUnique({
            where: { id: res.body.id }
        });

        expect(createdInvoice).not.toBeNull();
        expect(createdInvoice?.status).toBe(Invoices.Status.PENDING);
    });

    it('should record an activity log entry when an invoice is created', async ({expect}) => {
        const newInvoice = {
            providerId: testProvider.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            amount: faker.number.float({min: 50, max: 500, fractionDigits: 2}),
            status: Invoices.Status.PENDING,
            dateIssued: faker.date.recent()
        };

        const res = await request(app)
            .post('/invoices')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newInvoice);

        expect(res.status).toBe(201);
        const invoiceId = res.body.id;

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'CREATE_INVOICE',
                    subjectId: invoiceId,
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
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
