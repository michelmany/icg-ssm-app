import {z} from "zod";
import {prisma} from "../db";
import {Students} from "../students";
import {Providers} from "../providers";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, TherapyService as PrismaTherapyService} from "@prisma/client";
import {Activity} from "../activity";

export namespace TherapyServices {
    export enum ServiceType {
        SPEECH = "SPEECH",
        OCCUPATIONAL = "OCCUPATIONAL",
        PHYSICAL = "PHYSICAL",
    }

    export enum TherapyStatus {
        SCHEDULED = "SCHEDULED",
        COMPLETED = "COMPLETED",
        MISSED = "MISSED",
    }

    export enum TherapyDeliveryMode {
        VIRTUAL = "VIRTUAL",
        IN_PERSON = "IN_PERSON",
    }

    export const Info = z.object({
        id: z.string().uuid(),
        student: Students.Info.pick({
            id: true,
            firstName: true,
            lastName: true,
        }),
        provider: Providers.Info.pick({
            id: true,
            user: true,
        }).transform(provider => ({
            id: provider.id,
            firstName: provider.user.firstName,
            lastName: provider.user.lastName,
            email: provider.user.email,
        })),
        serviceType: z.nativeEnum(ServiceType),
        status: z.nativeEnum(TherapyStatus),
        serviceBeginDate: z.date(),
        sessionDate: z.string().date(),
        sessionNotes: z.string(),
        deliveryMode: z.nativeEnum(TherapyDeliveryMode),
        goalTracking: z.any().nullable(),
        ieps: z.any().nullable(),
        nextMeetingDate: z.string().date().nullable(),
        deletedAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const therapyService = await prisma.therapyService.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    student: true,
                    provider: {
                        include: {
                            user: true
                        }
                    },
                },
            });

            return {
                ...serialize(therapyService),
                student: {
                    id: therapyService.student.id,
                    firstName: therapyService.student.firstName,
                    lastName: therapyService.student.lastName,
                },
                provider: {
                    user: {
                        id: therapyService.provider.user.id,
                        firstName: therapyService.provider.user.firstName,
                        lastName: therapyService.provider.user.lastName,
                        email: therapyService.provider.user.email,
                    }
                }
            };

        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapy service not found.", {
                    code: "THERAPY_SERVICE_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        student: z.string().optional(),
        studentId: z.string().uuid().optional(),
        provider: z.string().optional(),
        serviceType: z.nativeEnum(ServiceType).optional(),
        status: z.nativeEnum(TherapyStatus).optional(),
        serviceBeginDate: z.date({coerce: true}).optional(),
        sessionDate: z.date({coerce: true}).optional(),
        deliveryMode: z.nativeEnum(TherapyDeliveryMode).optional(),
        nextMeetingDate: z.date({coerce: true}).optional(),

        sortBy: z
            .enum([
                "student",
                "provider",
                "serviceType",
                "status",
                "serviceBeginDate",
                "sessionDate",
                "deliveryMode",
                "nextMeetingDate",
            ])
            .optional()
            .default("provider"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.TherapyServiceWhereInput => {
        return {
            deletedAt: null,
            serviceType: filter.serviceType,
            status: filter.status,
            serviceBeginDate: filter.serviceBeginDate,
            sessionDate: filter.sessionDate,
            deliveryMode: filter.deliveryMode,
            nextMeetingDate: filter.nextMeetingDate,
            ...(filter.studentId
                ? { studentId: filter.studentId }
                : {}),
            ...(filter.student
                ? {
                    student: {
                        OR: [
                            {firstName: {contains: filter.student, mode: "insensitive"}},
                            {lastName: {contains: filter.student, mode: "insensitive"}}
                        ]
                    },
                }
                : {}),
            ...(filter.provider
                ? {
                    provider: {
                        user: {
                            OR: [
                                {firstName: {contains: filter.provider, mode: "insensitive"}},
                                {lastName: {contains: filter.provider, mode: "insensitive"}}
                            ]
                        }
                    },
                }
                : {}),

        };
    };

    const buildSort = (filter: z.infer<typeof listParams>) => {
        const {sortBy, sortOrder} = filter;
        if (sortBy === "student") {
            return {
                student: {
                    firstName: sortOrder
                }
            };
        }
        if (sortBy === "provider") {
            return {
                provider: {
                    user: {
                        firstName: sortOrder
                    }
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

        const [therapyServices, total] = await prisma.$transaction([
            prisma.therapyService.findMany({
                where,
                include: {
                    student: true,
                    provider: {
                        include: {
                            user: true
                        }
                    },
                },
                skip,
                take,
                orderBy,
            }),
            prisma.therapyService.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: therapyServices.map((therapyService) => ({
                ...serialize(therapyService),
                student: {
                    id: therapyService.student.id,
                    firstName: therapyService.student.firstName,
                    lastName: therapyService.student.lastName,
                },
                provider: {
                    user: {
                        id: therapyService.provider.user.id,
                        firstName: therapyService.provider.user.firstName,
                        lastName: therapyService.provider.user.lastName,
                        email: therapyService.provider.user.email,
                    }
                }
            })),
            pagination,
        };
    };

    export const createData = z.object({
        studentId: z.string().uuid(),
        providerId: z.string().uuid(),
        serviceType: z.nativeEnum(ServiceType),
        status: z.nativeEnum(TherapyStatus).default(TherapyStatus.SCHEDULED),
        serviceBeginDate: z.date({coerce: true}),
        sessionDate: z.date({coerce: true}),
        sessionNotes: z.string(),
        deliveryMode: z.nativeEnum(TherapyDeliveryMode),
        goalTracking: z.any().nullable(),
        ieps: z.any().nullable(),
        nextMeetingDate: z.date({coerce: true}).nullable(),
    });

    export const create = async (
        data: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        try {
            // Validate that both student and provider exist
            const student = await prisma.student.findUnique({
                where: { id: data.studentId }
            });

            if (!student) {
                throw new Error(`Student with ID ${data.studentId} not found`);
            }

            const provider = await prisma.provider.findUnique({
                where: { id: data.providerId }
            });

            if (!provider) {
                throw new Error(`Provider with ID ${data.providerId} not found`);
            }


            const {id} = await prisma.therapyService.create({
                data: {
                    ...data
                },
            });

            await Activity.log({
                context,
                action: Activity.Action.CREATE_THERAPY_SERVICE,
                subjectId: id,
            });

            return { id };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === "P2014") {
                throw new Errors.TNError("Student not found.", {
                    code: "STUDENT_NOT_FOUND",
                    status: 404,
                });
            }

            if (error instanceof PrismaClientKnownRequestError && error.code === "P2014") {
                throw new Errors.TNError("Provider not found.", {
                    code: "PROVIDER_NOT_FOUND",
                    status: 404,
                });
            }

            throw error;
        }
    };

    export const updateData = createData.partial();

    export const update = async (
        {id, ...updates}: z.infer<typeof findParams> & z.infer<typeof updateData>,
        context?: Activity.Context,
    ) => {
        try {
            // First, check if the provider exists if providerId is being updated
            if (updates.providerId) {
                const provider = await prisma.provider.findUnique({
                    where: {id: updates.providerId}
                });

                if (!provider) {
                    throw new Error(`Provider with ID ${updates.providerId} not found`);
                }
            }

            await prisma.therapyService.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: updates,
            });

            await Activity.log({
                context,
                action: Activity.Action.UPDATE_THERAPY_SERVICE,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapy service not found.", {
                    code: "THERAPY_SERVICE_NOT_FOUND",
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
            await prisma.therapyService.update({
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
                action: Activity.Action.DELETE_THERAPY_SERVICE,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Therapy service not found.", {
                    code: "THERAPY_SERVICE_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (therapyService: PrismaTherapyService) => ({
        id: therapyService.id,
        studentId: therapyService.studentId,
        providerId: therapyService.providerId,
        serviceType: therapyService.serviceType,
        status: therapyService.status,
        serviceBeginDate: therapyService.serviceBeginDate,
        sessionDate: therapyService.sessionDate,
        sessionNotes: therapyService.sessionNotes,
        deliveryMode: therapyService.deliveryMode,
        goalTracking: therapyService.goalTracking,
        ieps: therapyService.ieps,
        nextMeetingDate: therapyService.nextMeetingDate,
        createdAt: therapyService.createdAt || new Date(),
        updatedAt: therapyService.updatedAt || new Date(),
    })
}
