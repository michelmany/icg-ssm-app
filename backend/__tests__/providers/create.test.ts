import request from 'supertest';
import {describe, expect, it, beforeAll, beforeEach} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {faker} from '@faker-js/faker';
import {Providers} from "../../src/providers";

const prisma = new PrismaClient();

describe.sequential('POST /providers', () => {
    let adminUser: TestUser;
    let documentIds: string[] = [];
    let contractIds: string[] = [];
    let contactIds: string[] = [];
    let tempProviderId: string;

    // Set up test data
    beforeAll(async () => {
        // Create user with MANAGE_USERS permission
        adminUser = await createTestUserWithPermissions(['MANAGE_USERS']);

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
    });

    beforeEach(async () => {
        const document1 = await prisma.document.create({
            data: {
                providerId: tempProviderId, // Use the temp provider ID
                document: faker.lorem.paragraph(),
                createdById: adminUser.id,
            }
        });

        const document2 = await prisma.document.create({
            data: {
                providerId: tempProviderId,
                document: faker.lorem.paragraph(),
                createdById: adminUser.id,
            }
        });

        documentIds = [document1.id, document2.id];

        const contract1 = await prisma.contract.create({
            data: {
                providerId: tempProviderId,
                contract: faker.lorem.paragraph(),
                createdById: adminUser.id,
            }
        });

        const contract2 = await prisma.contract.create({
            data: {
                providerId: tempProviderId,
                contract: faker.lorem.paragraph(),
                createdById: adminUser.id,
            }
        });

        contractIds = [contract1.id, contract2.id];

        const contact1 = await prisma.contact.create({
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

        const contact2 = await prisma.contact.create({
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

        contactIds = [contact1.id, contact2.id];
    });

    it('should create a new provider when user has MANAGE_USERS permission', async ({expect}) => {
        const newProvider = {
            id: faker.string.uuid(),
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        const res = await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        expect(res.status).toBe(204);

        // Verify the provider was created in the database
        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        expect(createdProvider).not.toBeNull();
        expect(createdProvider?.licenseNumber).toBe(newProvider.licenseNumber);
        expect(createdProvider?.credentials).toBe(newProvider.credentials);
        expect(createdProvider?.signature).toBe(newProvider.signature);
        expect(createdProvider?.serviceFeeStructure).toBe(newProvider.serviceFeeStructure);
        expect(createdProvider?.nssEnabled).toBe(newProvider.nssEnabled);
        expect(createdProvider?.reviewNotes).toStrictEqual(newProvider.reviewNotes);
        expect(createdProvider?.status).toBe(newProvider.status);

        // Now use the new endpoints to associate documents, contracts, and contacts
        const providerId = createdProvider!.id;

        // Associate documents
        const docsRes = await request(app)
            .post(`/providers/${providerId}/documents`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ documentIds });

        expect(docsRes.status).toBe(200);

        // Associate contracts
        const contractsRes = await request(app)
            .post(`/providers/${providerId}/contracts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contractIds });

        expect(contractsRes.status).toBe(200);

        // Associate contacts
        const contactsRes = await request(app)
            .post(`/providers/${providerId}/contacts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contactIds });

        expect(contactsRes.status).toBe(200);

        // Verify associations were created
        const providerWithAssociations = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                documents: {
                    select: {
                        documentId: true
                    }
                },
                contracts: {
                    select: {
                        contractId: true
                    }
                },
                contacts: {
                    select: {
                        contactId: true
                    }
                }
            }
        });

        expect(providerWithAssociations?.documents.length).toBe(documentIds.length);
        expect(providerWithAssociations?.contracts.length).toBe(contractIds.length);
        expect(providerWithAssociations?.contacts.length).toBe(contactIds.length);

        const providerDocumentIds = providerWithAssociations?.documents.map(doc => doc.documentId);
        expect(documentIds.every(id => providerDocumentIds?.includes(id))).toBe(true);

        const providerContractIds = providerWithAssociations?.contracts.map(contract => contract.contractId);
        expect(contractIds.every(id => providerContractIds?.includes(id))).toBe(true);

        const providerContactIds = providerWithAssociations?.contacts.map(contact => contact.contactId);
        expect(contactIds.every(id => providerContactIds?.includes(id))).toBe(true);
    });

    it('should return an error when user lacks MANAGE_USER permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const newProvider = {
            id: faker.string.uuid(),
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        const res = await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newProvider);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('length');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should use the default ACTIVE status when not specified', async () => {
        const newProvider = {
            id: faker.string.uuid(),
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()}
        };

        const res = await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        expect(res.status).toBe(204);

        // Verify the provider was created with default status
        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        expect(createdProvider).not.toBeNull();
        expect(createdProvider?.status).toBe('ACTIVE');
    });

    it('should associate documents with a provider', async ({expect}) => {
        // Create a new provider first
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;

        // Test document association
        const docsRes = await request(app)
            .post(`/providers/${providerId}/documents`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ documentIds });

        expect(docsRes.status).toBe(200);

        // Verify documents were associated
        const providerWithDocs = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                documents: {
                    select: {
                        documentId: true
                    }
                }
            }
        });

        const providerDocumentIds = providerWithDocs?.documents.map(doc => doc.documentId);
        expect(documentIds.every(id => providerDocumentIds?.includes(id))).toBe(true);

        // Test document removal
        const docsRemoveRes = await request(app)
            .delete(`/providers/${providerId}/documents`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ documentIds });

        expect(docsRemoveRes.status).toBe(200);

        // Verify documents were removed
        const providerAfterRemove = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                documents: {
                    select: {
                        documentId: true
                    }
                }
            }
        });

        expect(providerAfterRemove?.documents.length).toBe(0);
    });

    it('should associate contracts with a provider', async ({expect}) => {
        // Create a new provider first
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;

        // Test contract association
        const contractsRes = await request(app)
            .post(`/providers/${providerId}/contracts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contractIds });

        expect(contractsRes.status).toBe(200);

        // Verify contracts were associated
        const providerWithContracts = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                contracts: {
                    select: {
                        contractId: true
                    }
                }
            }
        });

        const providerContractIds = providerWithContracts?.contracts.map(contract => contract.contractId);
        expect(contractIds.every(id => providerContractIds?.includes(id))).toBe(true);

        // Test contract removal
        const contractsRemoveRes = await request(app)
            .delete(`/providers/${providerId}/contracts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contractIds });

        expect(contractsRemoveRes.status).toBe(200);

        // Verify contracts were removed
        const providerAfterRemove = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                contracts: {
                    select: {
                        contractId: true
                    }
                }
            }
        });

        expect(providerAfterRemove?.contracts.length).toBe(0);
    });

    it('should associate contacts with a provider', async ({expect}) => {
        // Create a new provider first
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;

        // Test contact association
        const contactsRes = await request(app)
            .post(`/providers/${providerId}/contacts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contactIds });

        expect(contactsRes.status).toBe(200);

        // Verify contacts were associated
        const providerWithContacts = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                contacts: {
                    select: {
                        contactId: true
                    }
                }
            }
        });

        const providerContactIds = providerWithContacts?.contacts.map(contact => contact.contactId);
        expect(contactIds.every(id => providerContactIds?.includes(id))).toBe(true);

        // Test contact removal
        const contactsRemoveRes = await request(app)
            .delete(`/providers/${providerId}/contacts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contactIds });

        expect(contactsRemoveRes.status).toBe(200);

        // Verify contacts were removed
        const providerAfterRemove = await prisma.provider.findFirst({
            where: { id: providerId },
            include: {
                contacts: {
                    select: {
                        contactId: true
                    }
                }
            }
        });

        expect(providerAfterRemove?.contacts.length).toBe(0);
    });

    it('should handle errors when associating non-existent documents', async ({expect}) => {
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;
        const fakeDocumentIds = [faker.string.uuid(), faker.string.uuid()];

        const docsRes = await request(app)
            .post(`/providers/${providerId}/documents`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ documentIds: fakeDocumentIds });

        expect(docsRes.status).toBe(404);
        expect(docsRes.body).toHaveProperty('message');
    });

    it('should handle errors when associating non-existent contracts', async ({expect}) => {
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;
        const fakeContractIds = [faker.string.uuid(), faker.string.uuid()];

        const contractsRes = await request(app)
            .post(`/providers/${providerId}/contracts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contractIds: fakeContractIds });

        expect(contractsRes.status).toBe(404);
        expect(contractsRes.body).toHaveProperty('message');
    });

    it('should handle errors when associating non-existent contacts', async ({expect}) => {
        const newProvider = {
            userId: adminUser.id,
            licenseNumber: faker.string.numeric({length: 10}),
            credentials: faker.string.numeric({length: 10}),
            signature: faker.lorem.words(),
            serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
            nssEnabled: faker.datatype.boolean(),
            reviewNotes: {notes: faker.lorem.paragraph()},
            status: faker.helpers.enumValue(Providers.ProviderStatus)
        };

        await request(app)
            .post('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newProvider);

        const createdProvider = await prisma.provider.findFirst({
            where: {licenseNumber: newProvider.licenseNumber}
        });

        const providerId = createdProvider!.id;
        const fakeContactIds = [faker.string.uuid(), faker.string.uuid()];

        const contactsRes = await request(app)
            .post(`/providers/${providerId}/contacts`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({ contactIds: fakeContactIds });

        expect(contactsRes.status).toBe(404);
        expect(contactsRes.body).toHaveProperty('message');
    });
});
