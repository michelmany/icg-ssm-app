import request from 'supertest';
import {describe, it, beforeAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient} from '@prisma/client';
import {createTestUserWithPermissions, TestUser} from '../utils/helpers';
import {Providers} from '../../src/providers';
import {faker} from "@faker-js/faker";

const prisma = new PrismaClient();

describe.sequential('GET /providers', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
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

        for (let i = 0; i < 10; i++) {
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

        const providers = [];
        for (let i = 0; i < 5; i++) {
            providers.push(await prisma.provider.create({
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
            }));
        }
    });

    it('should allow access when user has MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an error when user lacks MANAGE_USERS permission', async ({expect}) => {
        const res = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter providers by service fee structure', async ({expect}) => {
        // Create provider with each service fee structure for testing
        for (const serviceFeeStructure of Object.values(Providers.ServiceFeeStructure)) {
            await prisma.provider.create({
                data: {
                    userId: adminUser.id,
                    licenseNumber: faker.string.numeric({length: 10}),
                    credentials: faker.string.numeric({length: 10}),
                    signature: faker.lorem.words(),
                    serviceFeeStructure,
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
        }

        for (const serviceFeeStructure of Object.values(Providers.ServiceFeeStructure)) {
            const res = await request(app)
                .get('/providers')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({serviceFeeStructure, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((provider: {
                serviceFeeStructure: string
            }) => provider.serviceFeeStructure === serviceFeeStructure)).toBe(true);
        }
    });

    it('should filter providers by status', async ({expect}) => {
        // Create providers with each status for testing
        for (const status of Object.values(Providers.ProviderStatus)) {
            await prisma.provider.create({
                data: {
                    userId: adminUser.id,
                    licenseNumber: faker.string.numeric({length: 10}),
                    credentials: faker.string.numeric({length: 10}),
                    signature: faker.lorem.words(),
                    serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
                    nssEnabled: faker.datatype.boolean(),
                    reviewNotes: {notes: faker.lorem.paragraph()},
                    status,
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
        }

        for (const status of Object.values(Providers.ProviderStatus)) {
            const res = await request(app)
                .get('/providers')
                .set('Authorization', `Bearer ${adminUser.token}`)
                .query({status, perPage: 10, page: 1});

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data.every((provider: { status: string }) => provider.status === status)).toBe(true);
        }
    });

    it('should filter providers by user name', async ({expect}) => {
        // Create a user with a specific name for testing
        const specificUser = await createTestUserWithPermissions(['MANAGE_USERS'], {
            firstName: 'TestFirstName',
            lastName: 'TestLastName'
        });

        // Create provider with this specific user
        await prisma.provider.create({
            data: {
                userId: specificUser.id,
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

        // Search by first name
        const res1 = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({name: 'TestFirst', perPage: 10, page: 1});

        expect(res1.status).toBe(200);
        expect(res1.body.data.length).toBeGreaterThan(0);
        expect(res1.body.data.some((provider: any) =>
            provider.user.firstName === 'TestFirstName'
        )).toBe(true);

        // Search by last name
        const res2 = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({name: 'TestLast', perPage: 10, page: 1});

        expect(res2.status).toBe(200);
        expect(res2.body.data.length).toBeGreaterThan(0);
        expect(res2.body.data.some((provider: any) =>
            provider.user.lastName === 'TestLastName'
        )).toBe(true);
    });

    it('should filter providers by license number', async ({expect}) => {
        const specificLicense = 'LIC9876543210';

        // Create provider with specific license number
        await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: specificLicense,
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
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({licenseNumber: 'LIC987', perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((provider: any) =>
            provider.licenseNumber === specificLicense
        )).toBe(true);
    });

    it('should filter providers by credentials', async ({expect}) => {
        const specificCredentials = 'CRED1234567890';

        // Create provider with specific credentials
        await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: specificCredentials,
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
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({credentials: 'CRED123', perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((provider: any) =>
            provider.credentials === specificCredentials
        )).toBe(true);
    });

    it('should filter providers by NSS enabled status', async ({expect}) => {
        // Create one provider with NSS enabled
        await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
                nssEnabled: true,
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

        // Create one provider with NSS disabled
        await prisma.provider.create({
            data: {
                userId: adminUser.id,
                licenseNumber: faker.string.numeric({length: 10}),
                credentials: faker.string.numeric({length: 10}),
                signature: faker.lorem.words(),
                serviceFeeStructure: faker.helpers.enumValue(Providers.ServiceFeeStructure),
                nssEnabled: false,
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

        // Test filtering for enabled NSS - use string "true" instead of boolean true
        const resEnabled = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({nssEnabled: "true", perPage: 10, page: 1});

        expect(resEnabled.status).toBe(200);
        expect(resEnabled.body.data.length).toBeGreaterThan(0);
        expect(resEnabled.body.data.every((provider: any) =>
            provider.nssEnabled === true
        )).toBe(true);

        // Test filtering for disabled NSS - use string "false" instead of boolean false
        const resDisabled = await request(app)
            .get('/providers')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({nssEnabled: "false", perPage: 10, page: 1});

        expect(resDisabled.status).toBe(200);
        expect(resDisabled.body.data.length).toBeGreaterThan(0);
        expect(resDisabled.body.data.every((provider: any) =>
            provider.nssEnabled === false
        )).toBe(true);
    });
});
