import {z} from "zod";
import {prisma} from "../db";
import {Users} from "../users";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, Provider as PrismaProvider} from "@prisma/client";
import {Activity} from "../activity";

export namespace Providers {
    export enum ProviderStatus {
        ACTIVE = "ACTIVE",
        INACTIVE = "INACTIVE",
        PENDING = "PENDING",
        SUSPENDED = "SUSPENDED",
    }

    export enum ServiceFeeStructure {
        HOURLY = "HOURLY",
        FLAT_RATE = "FLAT_RATE",
        PER_DIEM = "PER_DIEM",
    }

    export const Info = z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        user: Users.Info.pick({
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        }),
        licenseNumber: z.string().nullable(),
        credentials: z.string(),
        signature: z.string().nullable(),
        serviceFeeStructure: z.nativeEnum(ServiceFeeStructure),
        nssEnabled: z.boolean(),
        reviewNotes: z.object({notes: z.string()}),
        status: z.nativeEnum(ProviderStatus).default(ProviderStatus.ACTIVE),
        documentIds: z.array(z.string()),
        contractIds: z.array(z.string()),
        contactIds: z.array(z.string()),
        createdAt: z.date(),
        updatedAt: z.date(),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const provider = await prisma.provider.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    user: true,
                    documents: {
                        include: {
                            document: true,
                        }
                    },
                    contracts: {
                        include: {
                            contract: true,
                        }
                    },
                    contacts: {
                        include: {
                            contact: true,
                        }
                    }
                }
            });

            // Get the base serialized provider with IDs
            const serializedProvider = serialize(provider);

            // Extract full document, contract and contact data
            const documents = provider.documents
                ? provider.documents.map(doc => doc.document)
                : [];

            const contracts = provider.contracts
                ? provider.contracts.map(contract => contract.contract)
                : [];

            const contacts = provider.contacts
                ? provider.contacts.map(contact => contact.contact)
                : [];

            // Omit the ID arrays from the response since we're including the full objects
            const { documentIds, contractIds, contactIds, ...providerData } = serializedProvider;

            return {
                ...providerData,
                documents,
                contracts,
                contacts,
                user: {
                    id: provider.user.id,
                    firstName: provider.user.firstName,
                    lastName: provider.user.lastName,
                    email: provider.user.email
                }
            };

        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Provider not found.", {
                    code: "PROVIDER_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        name: z.string().optional(),
        licenseNumber: z.string().optional(),
        credentials: z.string().optional(),
        nssEnabled: z.preprocess(
            (val) => val === "true" ? true : val === "false" ? false : val,
            z.boolean().optional()
        ),
        status: z.nativeEnum(ProviderStatus).optional(),
        serviceFeeStructure: z.nativeEnum(ServiceFeeStructure).optional(),

        sortBy: z
            .enum([
                "name",
                "licenseNumber",
                "credentials",
                "nssEnabled",
                "serviceFeeStructure",
                "status",
            ])
            .optional()
            .default("name"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.ProviderWhereInput => {
        return {
            deletedAt: null,
            status: filter.status as ProviderStatus,
            serviceFeeStructure: filter.serviceFeeStructure as ServiceFeeStructure,
            ...(filter.licenseNumber
                ? {licenseNumber: {contains: filter.licenseNumber, mode: "insensitive"}}
                : {}),
            ...(filter.credentials
                ? {credentials: {contains: filter.credentials, mode: "insensitive"}}
                : {}),
            ...(filter.nssEnabled !== undefined
                ? {nssEnabled: filter.nssEnabled}
                : {}),
            ...(filter.name
                ? {
                    user: {
                        OR: [
                            {firstName: {contains: filter.name, mode: "insensitive"}},
                            {lastName: {contains: filter.name, mode: "insensitive"}}
                        ]
                    }
                }
                : {}),
        };
    };

    const buildSort = (filter: z.infer<typeof listParams>) => {
        const {sortBy, sortOrder} = filter;

        // Handle special case for sorting by name (needs to sort by user's name)
        if (sortBy === "name") {
            return {
                user: {
                    firstName: sortOrder
                }
            };
        }

        return {[sortBy]: sortOrder};
    };

    export const list = async (filter: z.infer<typeof listParams>) => {
        const skip = (filter.page - 1) * filter.perPage;
        const take = filter.perPage;

        const where = buildWhere(filter);
        const orderBy = buildSort(filter);

        const [providers, total] = await prisma.$transaction([
            prisma.provider.findMany({
                where,
                include: {
                    user: true,
                    documents: {
                        include: {
                            document: true
                        }
                    },
                    contracts: {
                        include: {
                            contract: true
                        }
                    },
                    contacts: {
                        include: {
                            contact: true
                        }
                    }
                },
                skip,
                take,
                orderBy,
            }),
            prisma.provider.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: providers.map(provider => ({
                ...serialize(provider),
                user: {
                    id: provider.user.id,
                    firstName: provider.user.firstName,
                    lastName: provider.user.lastName,
                    email: provider.user.email
                }
            })),
            pagination,
        };
    };

    export const createData = z.object({
        userId: z.string().uuid(),
        licenseNumber: z.string(),
        credentials: z.string(),
        signature: z.string().nullable(),
        serviceFeeStructure: z.nativeEnum(ServiceFeeStructure).optional().default(ServiceFeeStructure.HOURLY),
        nssEnabled: z.boolean(),
        reviewNotes: z.object({notes: z.string()}),
        status: z.nativeEnum(ProviderStatus).optional().default(ProviderStatus.ACTIVE),
    });

    export const create = async (
        providerData: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        const provider = await prisma.provider.create({
            data: {
                ...providerData,
                status: providerData.status as ProviderStatus,
                serviceFeeStructure: providerData.serviceFeeStructure as ServiceFeeStructure,
            },
        });

        await Activity.log({
            context,
            action: Activity.Action.CREATE_PROVIDER,
            subjectId: provider.id,
        });

        return provider;
    };

    export const updateData = createData.partial();

    export const update = async (
        {id, ...updates}: z.infer<typeof findParams> & z.infer<typeof updateData>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.provider.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: {
                    ...updates,
                    status: updates.status as ProviderStatus,
                    serviceFeeStructure: updates.serviceFeeStructure as ServiceFeeStructure,
                }
            });

            await Activity.log({
                context,
                action: Activity.Action.UPDATE_PROVIDER,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Provider not found.", {
                    code: "PROVIDER_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    // Document association management
    export const addDocuments = async (providerId: string, documentIds: string[]) => {
        // Validate documents existence
        if (documentIds.length > 0) {
            const existingDocuments = await prisma.document.findMany({
                where: {
                    id: {in: documentIds},
                    deletedAt: null
                },
                select: {id: true}
            });

            const existingDocumentIds = existingDocuments.map(doc => doc.id);
            const nonExistingDocumentIds = documentIds.filter(id => !existingDocumentIds.includes(id));

            if (nonExistingDocumentIds.length > 0) {
                throw new Errors.TNError(`Documents with IDs ${nonExistingDocumentIds.join(', ')} not found.`, {
                    code: "DOCUMENT_NOT_FOUND",
                    status: 404,
                });
            }
        }

        // Create associations
        return Promise.all(documentIds.map(documentId =>
            prisma.providerDocument.create({
                data: {
                    providerId,
                    documentId
                }
            })
        ));
    };

    export const removeDocuments = async (providerId: string, documentIds?: string[]) => {
        if (documentIds && documentIds.length > 0) {
            // Remove specific associations
            await prisma.providerDocument.deleteMany({
                where: {
                    providerId,
                    documentId: {in: documentIds}
                }
            });
        } else {
            // Remove all associations
            await prisma.providerDocument.deleteMany({
                where: {providerId}
            });
        }
    };

    // Contract association management
    export const addContracts = async (providerId: string, contractIds: string[]) => {
        // Validate contracts existence
        if (contractIds.length > 0) {
            const existingContracts = await prisma.contract.findMany({
                where: {
                    id: {in: contractIds},
                    deletedAt: null
                },
                select: {id: true}
            });

            const existingContractIds = existingContracts.map(contract => contract.id);
            const nonExistingContractIds = contractIds.filter(id => !existingContractIds.includes(id));

            if (nonExistingContractIds.length > 0) {
                throw new Errors.TNError(`Contracts with IDs ${nonExistingContractIds.join(', ')} not found.`, {
                    code: "CONTRACT_NOT_FOUND",
                    status: 404,
                });
            }
        }

        // Create associations
        return Promise.all(contractIds.map(contractId =>
            prisma.providerContract.create({
                data: {
                    providerId,
                    contractId
                }
            })
        ));
    };

    export const removeContracts = async (providerId: string, contractIds?: string[]) => {
        if (contractIds && contractIds.length > 0) {
            // Remove specific associations
            await prisma.providerContract.deleteMany({
                where: {
                    providerId,
                    contractId: {in: contractIds}
                }
            });
        } else {
            // Remove all associations
            await prisma.providerContract.deleteMany({
                where: {providerId}
            });
        }
    };

    // Contact association management
    export const addContacts = async (providerId: string, contactIds: string[]) => {
        // Validate contacts existence
        if (contactIds.length > 0) {
            const existingContacts = await prisma.contact.findMany({
                where: {
                    id: {in: contactIds},
                    deletedAt: null
                },
                select: {id: true}
            });

            const existingContactIds = existingContacts.map(contact => contact.id);
            const nonExistingContactIds = contactIds.filter(id => !existingContactIds.includes(id));

            if (nonExistingContactIds.length > 0) {
                throw new Errors.TNError(`Contacts with IDs ${nonExistingContactIds.join(', ')} not found.`, {
                    code: "CONTACT_NOT_FOUND",
                    status: 404,
                });
            }
        }

        // Create associations
        return Promise.all(contactIds.map(contactId =>
            prisma.providerContact.create({
                data: {
                    providerId,
                    contactId
                }
            })
        ));
    };

    export const removeContacts = async (providerId: string, contactIds?: string[]) => {
        if (contactIds && contactIds.length > 0) {
            // Remove specific associations
            await prisma.providerContact.deleteMany({
                where: {
                    providerId,
                    contactId: {in: contactIds}
                }
            });
        } else {
            // Remove all associations
            await prisma.providerContact.deleteMany({
                where: {providerId}
            });
        }
    };

    export const remove = async (
        {id}: z.infer<typeof findParams>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.provider.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: {
                    deletedAt: new Date(),
                },
            });

            await Activity.log({
                context,
                action: Activity.Action.DELETE_PROVIDER,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Provider not found.", {
                    code: "PROVIDER_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (provider: PrismaProvider & {
        documents?: any[],
        contracts?: any[],
        contacts?: any[]
    }) => {
        const documentIds = provider.documents
            ? provider.documents.map(doc => doc.documentId)
            : [];

        const contractIds = provider.contracts
            ? provider.contracts.map(contract => contract.contractId)
            : [];

        const contactIds = provider.contacts
            ? provider.contacts.map(contact => contact.contactId)
            : [];

        return {
            id: provider.id,
            userId: provider.userId,
            status: provider.status as ProviderStatus,
            licenseNumber: provider.licenseNumber,
            credentials: provider.credentials,
            signature: provider.signature,
            serviceFeeStructure: provider.serviceFeeStructure as ServiceFeeStructure,
            nssEnabled: provider.nssEnabled,
            reviewNotes: provider.reviewNotes,
            documentIds,
            contractIds,
            contactIds,
            createdAt: provider.createdAt,
            updatedAt: provider.updatedAt,
        };
    };
}
