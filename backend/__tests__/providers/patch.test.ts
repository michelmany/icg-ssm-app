import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {Providers} from '../../src/providers';

const prisma = new PrismaClient();

describe.sequential('PATCH /providers/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let providerToUpdate: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

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

        for (let i = 0; i < 6; i++) {
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

        // Create provider to update in tests
        providerToUpdate = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: Providers.ServiceFeeStructure.FLAT_RATE,
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: faker.helpers.enumValue(Providers.ProviderStatus),
                documents: {
                    create: faker.helpers.arrayElements(documentIds, {min: 2, max: 4}).map(id => ({
                        documentId: id
                    }))
                },
                contracts: {
                    create: faker.helpers.arrayElements(contractIds, {min: 2, max: 4}).map(id => ({
                        contractId: id
                    }))
                },
                contacts: {
                    create: faker.helpers.arrayElements(contactIds, {min: 2, max: 4}).map(id => ({
                        contactId: id
                    }))
                }
            }
        });
    });

    it('should update provider when requester has MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            serviceFeeStructure: Providers.ServiceFeeStructure.HOURLY,
            status: Providers.ProviderStatus.INACTIVE,
        };

        const res = await request(app)
            .patch(`/providers/${providerToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the provider was updated
        const updatedProvider = await prisma.provider.findUnique({
            where: {id: providerToUpdate.id}
        });

        expect(updatedProvider).not.toBeNull();
        expect(updatedProvider?.serviceFeeStructure).toBe(updateData.serviceFeeStructure);
        expect(updatedProvider?.status).toBe(updateData.status);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const updateData = {
            model: 'Should Not Update'
        };

        const res = await request(app)
            .patch(`/providers/${providerToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when provider ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .patch(`/providers/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({model: 'NonExistent'});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Provider not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        const anotherProvider = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: Providers.ServiceFeeStructure.FLAT_RATE,
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: faker.helpers.enumValue(Providers.ProviderStatus),
                documents: {
                    create: faker.helpers.arrayElements(documentIds, {min: 2, max: 4}).map(id => ({
                        documentId: id
                    }))
                },
                contracts: {
                    create: faker.helpers.arrayElements(contractIds, {min: 2, max: 4}).map(id => ({
                        contractId: id
                    }))
                },
                contacts: {
                    create: faker.helpers.arrayElements(contactIds, {min: 2, max: 4}).map(id => ({
                        contactId: id
                    }))
                }
            }
        });

        const originalProvider = await prisma.provider.findUnique({
            where: {id: anotherProvider.id}
        });

        const updateData = {
            serviceFeeStructure: Providers.ServiceFeeStructure.PER_DIEM
            // Only updating serviceFeeStructure
        };

        const res = await request(app)
            .patch(`/providers/${anotherProvider.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only serviceFeeStructure was updated
        const updatedProvider = await prisma.provider.findUnique({
            where: {id: anotherProvider.id}
        });

        expect(updatedProvider).not.toBeNull();
        expect(updatedProvider?.serviceFeeStructure).toBe(updateData.serviceFeeStructure);
        expect(updatedProvider?.status).toBe(originalProvider?.status);
        expect(updatedProvider?.nssEnabled).toBe(originalProvider?.nssEnabled);
        expect(updatedProvider?.credentials).toBe(originalProvider?.credentials);
        expect(updatedProvider?.signature).toBe(originalProvider?.signature);
    });

    it('should record an activity log entry when provider is updated', async ({expect}) => {
        const providerForActivity = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: Providers.ServiceFeeStructure.FLAT_RATE,
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: Providers.ProviderStatus.INACTIVE,
                documents: {
                    create: faker.helpers.arrayElements(documentIds, {min: 2, max: 4}).map(id => ({
                        documentId: id
                    }))
                },
                contracts: {
                    create: faker.helpers.arrayElements(contractIds, {min: 2, max: 4}).map(id => ({
                        contractId: id
                    }))
                },
                contacts: {
                    create: faker.helpers.arrayElements(contactIds, {min: 2, max: 4}).map(id => ({
                        contactId: id
                    }))
                }
            }
        });

        await request(app)
            .patch(`/providers/${providerForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({signature: 'Updated for activity log'});

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 1000; // 1 second
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'UPDATE_PROVIDER',
                    subjectId: providerForActivity.id,
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
        expect(activityLog?.subjectId).toBe(providerForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
