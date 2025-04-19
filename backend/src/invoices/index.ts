import {z} from "zod";
import {prisma} from "../db";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, Invoice as PrismaInvoice} from "@prisma/client";
import {Activity} from "../activity";
import {TherapyServices} from "../therapy-services";
import {Providers} from "../providers";
import {Students} from "../students";

export namespace Invoices {
    export enum Status {
        PENDING = "PENDING",
        PAID = "PAID",
        DECLINED = "DECLINED",
    }

    export const Info = z.object({
        id: z.string().uuid(),
        providerId: z.string().uuid(),
        studentId: z.string().uuid(),
        therapyServiceId: z.string().uuid(),
        amount: z.number(),
        status: z.nativeEnum(Status),
        dateIssued: z.date({coerce: true}),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
        provider: Providers.Info.pick({
            id: true,
            user: true,
        }).transform(provider => ({
            id: provider.id,
            firstName: provider.user.firstName,
            lastName: provider.user.lastName,
            email: provider.user.email,
        })),
        student: Students.Info.pick({
            id: true,
            firstName: true,
            lastName: true,
        }),
        therapyService: TherapyServices.Info.pick({
            id: true,
            serviceType: true,
        }),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const invoice = await prisma.invoice.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    provider: {
                        include: {
                            user: true
                        }
                    },
                    student: true,
                    therapyService: true,
                },
            });

            return {
                ...serialize(invoice),
                provider: {
                    user: {
                        id: invoice.provider.user.id,
                        firstName: invoice.provider.user.firstName,
                        lastName: invoice.provider.user.lastName,
                        email: invoice.provider.user.email,
                    }
                },
                student: {
                    id: invoice.student.id,
                    firstName: invoice.student.firstName,
                    lastName: invoice.student.lastName,
                },
                therapyService: {
                    id: invoice.therapyService.id,
                    serviceType: invoice.therapyService.serviceType,
                }
            };
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Invoice not found.", {
                    code: "INVOICE_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        status: z.nativeEnum(Status).optional(),
        providerName: z.string().optional(),
        studentName: z.string().optional(),
        therapyServiceType: z.nativeEnum(TherapyServices.ServiceType).optional(),
        dateIssuedFrom: z.date({coerce: true}).optional(),
        dateIssuedTo: z.date({coerce: true}).optional(),

        sortBy: z
            .enum([
                "status",
                "amount",
                "dateIssued",
                "createdAt",
                "updatedAt",
                "providerName",
                "studentName",
                "therapyServiceType"
            ])
            .optional()
            .default("dateIssued"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.InvoiceWhereInput => {
        const where: Prisma.InvoiceWhereInput = {
            status: filter.status,
            deletedAt: null,
        };

        if (filter.dateIssuedFrom || filter.dateIssuedTo) {
            where.dateIssued = {};
            if (filter.dateIssuedFrom) {
                where.dateIssued.gte = filter.dateIssuedFrom;
            }
            if (filter.dateIssuedTo) {
                where.dateIssued.lte = filter.dateIssuedTo;
            }
        }

        if (filter.providerName) {
            where.provider = {
                user: {
                    OR: [
                        {firstName: {contains: filter.providerName, mode: "insensitive"}},
                        {lastName: {contains: filter.providerName, mode: "insensitive"}}
                    ]
                }
            };
        }

        if (filter.studentName) {
            where.student = {
                OR: [
                    {firstName: {contains: filter.studentName, mode: "insensitive"}},
                    {lastName: {contains: filter.studentName, mode: "insensitive"}}
                ]
            };
        }

        if (filter.therapyServiceType) {
            where.therapyService = {
                serviceType: filter.therapyServiceType,
            };
        }

        return where;
    };

    const buildSort = (filter: z.infer<typeof listParams>): Prisma.InvoiceOrderByWithRelationInput => {
        const {sortBy, sortOrder} = filter;

        // For direct fields
        if (["status", "amount", "dateIssued", "createdAt", "updatedAt"].includes(sortBy)) {
            return {[sortBy]: sortOrder};
        }

        // For relation fields
        switch (sortBy) {
            case "providerName":
                return {
                    provider: {
                        user: {
                            firstName: sortOrder
                        }
                    }
                };
            case "studentName":
                return {
                    student: {
                        firstName: sortOrder
                    }
                };
            case "therapyServiceType":
                return {
                    therapyService: {
                        serviceType: sortOrder
                    }
                };
            default:
                return {createdAt: sortOrder};
        }
    };

    export const list = async (filter: z.infer<typeof listParams>) => {
        const skip = (filter.page - 1) * filter.perPage;
        const take = filter.perPage;

        const where = buildWhere(filter);
        const orderBy = buildSort(filter);

        const [invoices, total] = await prisma.$transaction([
            prisma.invoice.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    provider: {
                        include: {
                            user: true
                        }
                    },
                    student: true,
                    therapyService: true,
                },
            }),
            prisma.invoice.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: invoices.map((invoices) => ({
                ...serialize(invoices),
                provider: {
                    user: {
                        id: invoices.provider.user.id,
                        firstName: invoices.provider.user.firstName,
                        lastName: invoices.provider.user.lastName,
                        email: invoices.provider.user.email,
                    }
                },
                student: {
                    id: invoices.student.id,
                    firstName: invoices.student.firstName,
                    lastName: invoices.student.lastName,
                },
                therapyService: {
                    id: invoices.therapyService.id,
                    serviceType: invoices.therapyService.serviceType,
                }
            })),
            pagination,
        };
    };

    export const createData = z.object({
        providerId: z.string().uuid(),
        studentId: z.string().uuid(),
        therapyServiceId: z.string().uuid(),
        amount: z.number(),
        status: z.nativeEnum(Status).default(Status.PENDING),
        dateIssued: z.date({coerce: true}).default(() => new Date()),
    });

    export const create = async (
        data: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        const {id} = await prisma.invoice.create({
            data,
        });

        await Activity.log({
            context,
            action: Activity.Action.CREATE_INVOICE,
            subjectId: id,
        });

        return id;
    };

    export const updateData = createData.partial();

    export const update = async (
        {id, ...updates}: z.infer<typeof findParams> & z.infer<typeof updateData>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.invoice.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: updates,
            });

            await Activity.log({
                context,
                action: Activity.Action.UPDATE_INVOICE,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Invoice not found.", {
                    code: "INVOICE_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const remove = async (
        {id}: z.infer<typeof findParams>,
        context?: Activity.Context,
    ) => {
        try {
            await prisma.invoice.update({
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
                action: Activity.Action.DELETE_INVOICE,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Invoice not found.", {
                    code: "INVOICE_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (invoice: PrismaInvoice) => ({
        id: invoice.id,
        providerId: invoice.providerId,
        studentId: invoice.studentId,
        therapyServiceId: invoice.therapyServiceId,
        amount: invoice.amount,
        status: invoice.status,
        dateIssued: invoice.dateIssued,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        deletedAt: invoice.deletedAt,
    });
}
