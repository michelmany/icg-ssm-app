import {z} from "zod";
import {prisma} from "../db";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, Therapist as PrismaTherapist} from "@prisma/client";
import {Activity} from "../activity";
import { Users } from "../users";

export namespace Therapists {
    export enum TherapistStatus {
        ACTIVE = "ACTIVE",
        INACTIVE = "INACTIVE",
        PENDING = "PENDING"
    }

    export const Info = z.object({
        id: z.string().uuid(),
        disciplines: z.string(),
        licenseNumber: z.string(),
        medicaidNationalProviderId: z.number(),
        socialSecurity: z.string(),
        stateMedicaidProviderId: z.number(),
        status: z.nativeEnum(TherapistStatus).default(TherapistStatus.ACTIVE),
        userId: z.string().uuid(),
        name: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const therapist = await prisma.therapist.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    user: true,
                },
            });

            return serialize(therapist);

        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapist not found.", {
                    code: "THERAPIST_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        disciplines: z.string().optional(),
        licenseNumber: z.string().optional(),
        medicaidNationalProviderId: z.number({coerce: true}).optional(),
        stateMedicaidProviderId: z.number({coerce: true}).optional(),
        status: z.nativeEnum(TherapistStatus).optional(),
        name: z.string().optional(),

        sortBy: z
            .enum([
                "disciplines",
                "licenseNumber",
                "medicaidNationalProviderId",
                "stateMedicaidProviderId",
                "status",
                "name"
            ])
            .optional()
            .default("status"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.TherapistWhereInput => {
        return {
            deletedAt: null,
            disciplines: filter.disciplines
                ? {
                    contains: filter.disciplines,
                    mode: "insensitive"
                }
                : undefined,
            licenseNumber: filter.licenseNumber
                ? {
                    contains: filter.licenseNumber,
                    mode: "insensitive"
                }
                : undefined,
            medicaidNationalProviderId: filter.medicaidNationalProviderId
                ? {
                    equals: filter.medicaidNationalProviderId,
                }
                : undefined,
            stateMedicaidProviderId: filter.stateMedicaidProviderId
                ? {
                    equals: filter.stateMedicaidProviderId,
                }
                : undefined,
            status: filter.status
                ? {
                    equals: filter.status,
                }
                : undefined,
            user: filter.name
                ? {
                    OR: [
                        { firstName: { contains: filter.name, mode: "insensitive" } },
                        { lastName: { contains: filter.name, mode: "insensitive" } }
                    ]
                }
                : undefined,
        };
    };

    const buildSort = (filter: z.infer<typeof listParams>) => {
        const {sortBy, sortOrder} = filter;

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

        const [therapists, total] = await prisma.$transaction([
            prisma.therapist.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: true,
                },
            }),
            prisma.therapist.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: therapists.map(serialize),
            pagination,
        };
    };

    export const createData = z.object({
        disciplines: z.string(),
        licenseNumber: z.string(),
        medicaidNationalProviderId: z.number(),
        socialSecurity: z.string(),
        stateMedicaidProviderId: z.number(),
        status: z.nativeEnum(TherapistStatus).default(TherapistStatus.PENDING),
        userId: z.string().uuid(),
    });

    export const create = async (
        data: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        const { userId, ...therapistData } = data;
        const {id} = await prisma.therapist.create({
            data: {
                ...therapistData,
                user: {
                    connect: { id: userId }
                }
            },
        });

        await Activity.log({
            context,
            action: Activity.Action.CREATE_THERAPIST,
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
            await prisma.therapist.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: updates,
            });

            await Activity.log({
                context,
                action: Activity.Action.UPDATE_THERAPIST,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapist not found.", {
                    code: "THERAPIST_NOT_FOUND",
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
            await prisma.therapist.update({
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
                action: Activity.Action.DELETE_THERAPIST,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapist not found.", {
                    code: "THERAPIST_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (therapist: PrismaTherapist & { user?: any }) => ({
        id: therapist.id,
        disciplines: therapist.disciplines,
        licenseNumber: therapist.licenseNumber,
        medicaidNationalProviderId: therapist.medicaidNationalProviderId,
        socialSecurity: therapist.socialSecurity,
        stateMedicaidProviderId: therapist.stateMedicaidProviderId,
        status: therapist.status as TherapistStatus,
        userId: therapist.userId,
        name: therapist.user ? `${therapist.user.firstName} ${therapist.user.lastName}` : null,
        createdAt: therapist.createdAt || new Date(),
        updatedAt: therapist.updatedAt || new Date(),
    })
}
