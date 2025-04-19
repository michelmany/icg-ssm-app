import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from "@faker-js/faker";
import {Providers} from '../../src/providers';

const prisma = new PrismaClient();

describe.sequential('DELETE /providers/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let providerToDelete: any;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USER permission
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

        // Create provider to be deleted in tests
        providerToDelete = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
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

    it('should delete provider when requester has MANAGE_USER permission', async ({expect}) => {
        const res = await request(app)
            .delete(`/providers/${providerToDelete.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(204);

        // Verify the provider was soft deleted
        const deletedProvider = await prisma.provider.findUnique({
            where: {id: providerToDelete.id}
        });

        expect(deletedProvider).not.toBeNull();
        expect(deletedProvider?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks MANAGE_USER permission', async ({expect}) => {
        // Create another provider to attempt to delete
        const anotherProvider = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
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

        const res = await request(app)
            .delete(`/providers/${anotherProvider.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify provider wasn't deleted
        const provider = await prisma.provider.findUnique({
            where: {id: anotherProvider.id}
        });

        expect(provider).not.toBeNull();
        expect(provider?.deletedAt).toBeNull();
    });

    it('should return an error when provider ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(`/providers/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('message', 'Provider not found.');
    });

    it('should record an activity log entry when provider is deleted', async ({expect}) => {
        // Create provider to delete
        const providerForActivity = await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
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

        await request(app)
            .delete(`/providers/${providerForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_PROVIDER',
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
