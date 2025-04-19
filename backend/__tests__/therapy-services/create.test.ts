import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {
    createTestUserWithPermissions,
    createTestSchool,
    TestUser,
    TestSchool,
    TestDataRegistry
} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {TherapyServices} from "../../src/therapy-services";

const prisma = new PrismaClient();

describe.sequential('POST /therapy-services', () => {
    let adminUser: TestUser;
    let providerUser: TestUser;
    let parentUser: TestUser;
    let school: TestSchool;
    let testStudent: any;
    let testProvider: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;

    // Set up test data
    beforeAll(async () => {
        // Create users with different permissions
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);
        providerUser = await createTestUserWithPermissions([]);
        parentUser = await createTestUserWithPermissions([]);

        // Create a test school
        school = await createTestSchool('Test School');

        // Create test student directly since helper isn't available
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
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should create a new therapy service when user has MANAGE_USERS permission', async ({expect}) => {
        // First get existing students and providers from the database
        const student = await prisma.student.findFirst({
            where: { status: 'ACTIVE' }
        });

        const provider = await prisma.provider.findFirst({
            where: { status: 'ACTIVE' }
        });

        expect(student).toBeDefined();
        expect(provider).toBeDefined();

        const newTherapyService = {
            studentId: student!.id,
            providerId: provider!.id,
            serviceType: TherapyServices.ServiceType.SPEECH,
            status: TherapyServices.TherapyStatus.SCHEDULED,
            serviceBeginDate: faker.date.past(),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: TherapyServices.TherapyDeliveryMode.VIRTUAL,
            goalTracking: {
                goals: Array.from({length: 2}, () => ({
                    goal: faker.lorem.sentence(),
                    progress: faker.number.int({min: 0, max: 100})
                }))
            },
            ieps: {
                planDate: faker.date.past(),
                objectives: Array.from({length: 3}, () => faker.lorem.sentence())
            },
            nextMeetingDate: faker.date.future(),
        };

        const res = await request(app)
            .post('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newTherapyService);

        expect(res.status).toBe(204);

        // Verify the therapy service was created
        const createdTherapyService = await prisma.therapyService.findFirst({
            where: {
                studentId: newTherapyService.studentId,
                providerId: newTherapyService.providerId,
                sessionDate: newTherapyService.sessionDate
            }
        });

        expect(createdTherapyService).not.toBeNull();
        expect(createdTherapyService?.serviceType).toBe(newTherapyService.serviceType);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const newTherapyService = {
            studentId: testStudent.id,
            providerId: testProvider.id,
            serviceType: faker.helpers.enumValue(TherapyServices.ServiceType),
            status: faker.helpers.enumValue(TherapyServices.TherapyStatus),
            serviceBeginDate: faker.date.past(),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
        };

        const res = await request(app)
            .post('/therapy-services')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newTherapyService);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('length');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should use the default SCHEDULED status when not specified', async ({expect}) => {
        const student = await prisma.student.findFirst({
            where: { status: 'ACTIVE' }
        });

        const provider = await prisma.provider.findFirst({
            where: { status: 'ACTIVE' }
        });

        expect(student).toBeDefined();
        expect(provider).toBeDefined();

        const newTherapyService = {
            studentId: student!.id,
            providerId: provider!.id,
            serviceType: TherapyServices.ServiceType.SPEECH,
            serviceBeginDate: faker.date.past(),
            sessionDate: faker.date.recent(),
            sessionNotes: faker.lorem.paragraph(),
            deliveryMode: TherapyServices.TherapyDeliveryMode.VIRTUAL,
            goalTracking: {
                goals: Array.from({length: 2}, () => ({
                    goal: faker.lorem.sentence(),
                    progress: faker.number.int({min: 0, max: 100})
                }))
            },
            ieps: {
                planDate: faker.date.past(),
                objectives: Array.from({length: 3}, () => faker.lorem.sentence())
            },
            nextMeetingDate: faker.date.future(),
            // status is not specified on purpose
        };

        const res = await request(app)
            .post('/therapy-services')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newTherapyService);

        expect(res.status).toBe(204);

        // Verify the therapy service was created with default status
        const createdTherapyService = await prisma.therapyService.findFirst({
            where: {
                studentId: newTherapyService.studentId,
                providerId: newTherapyService.providerId,
                sessionDate: newTherapyService.sessionDate
            }
        });

        expect(createdTherapyService).not.toBeNull();
        expect(createdTherapyService?.status).toBe(TherapyServices.TherapyStatus.SCHEDULED);
    });
});
