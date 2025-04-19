import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {
    createTestUserWithPermissions,
    TestUser,
    createTestProvider,
    createTestTherapyService,
    createTestSchool,
    TestDataRegistry
} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {Invoices} from '../../src/invoices';

const prisma = new PrismaClient();

describe.concurrent('PATCH /invoices/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let parentUser: TestUser;
    let providerUser: TestUser;
    let testProvider: any;
    let testStudent: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;
    let testTherapyService: any;
    let invoiceToUpdate: any;
    let testSchool: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with VIEW_INVOICES permission
        adminUser = await createTestUserWithPermissions(['VIEW_INVOICES']);

        // Create user without permissions
        regularUser = await createTestUserWithPermissions([]);

        parentUser = await createTestUserWithPermissions([]);
        providerUser = await createTestUserWithPermissions([]);

        // Create school
        testSchool = await createTestSchool();

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

        // Create student
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

        // Create therapy service
        testTherapyService = await createTestTherapyService({
            studentId: testStudent.id,
            providerId: testProvider.id
        });

        // Create invoice to update in tests
        invoiceToUpdate = await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should update invoice when requester has VIEW_INVOICES permission', async ({expect}) => {
        const updateData = {
            status: Invoices.Status.PAID,
            amount: faker.number.float({min: 100, max: 200})
        };

        const res = await request(app)
            .patch(`/invoices/${invoiceToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the invoice was updated
        const updatedInvoice = await prisma.invoice.findUnique({
            where: {id: invoiceToUpdate.id}
        });

        expect(updatedInvoice).not.toBeNull();
        expect(updatedInvoice?.status).toBe(updateData.status);
        expect(Number(updatedInvoice?.amount)).toBeCloseTo(updateData.amount);
    });

    it('should return an error when user lacks VIEW_INVOICES permission', async ({expect}) => {
        const updateData = {
            status: Invoices.Status.PAID
        };

        const res = await request(app)
            .patch(`/invoices/${invoiceToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when invoice ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(`/invoices/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({status: Invoices.Status.PAID});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Invoice not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        const anotherInvoice = await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });

        const originalInvoice = await prisma.invoice.findUnique({
            where: {id: anotherInvoice.id}
        });

        const updateData = {
            status: Invoices.Status.PAID,
            // Only updating status
        };

        const res = await request(app)
            .patch(`/invoices/${anotherInvoice.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only status was updated
        const updatedInvoice = await prisma.invoice.findUnique({
            where: {id: anotherInvoice.id}
        });

        expect(updatedInvoice).not.toBeNull();
        expect(updatedInvoice?.status).toBe(updateData.status);
        expect(updatedInvoice?.amount).toEqual(originalInvoice?.amount);
        expect(updatedInvoice?.providerId).toBe(originalInvoice?.providerId);
        expect(updatedInvoice?.studentId).toBe(originalInvoice?.studentId);
        expect(updatedInvoice?.therapyServiceId).toBe(originalInvoice?.therapyServiceId);
    });

    it('should record an activity log entry when invoice is updated', async ({expect}) => {
        const invoiceForActivity = await prisma.invoice.create({
            data: {
                providerId: testProvider.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                amount: faker.number.float({min: 50, max: 500}),
                status: Invoices.Status.PENDING,
                dateIssued: faker.date.recent()
            }
        });

        await request(app)
            .patch(`/invoices/${invoiceForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({status: Invoices.Status.PAID});

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 1000; // 1 second
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_INVOICE',
                    subjectId: invoiceForActivity.id,
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
        expect(activityLog?.subjectId).toBe(invoiceForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
