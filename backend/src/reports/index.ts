import {z} from "zod";
import {prisma} from "../db";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import {Errors} from "../errors";
import {Prisma, Report as PrismaReport, ReportType} from "@prisma/client";
import {Activity} from "../activity";
import {TherapyServices} from "../therapy-services";

export namespace Reports {
    export enum Type {
        PROGRESS = "PROGRESS",
        ATTENDANCE = "ATTENDANCE",
        BILLING = "BILLING",
        ELIGIBILITY = "ELIGIBILITY",
    }

    export const Info = z.object({
        id: z.string().uuid(),
        schoolId: z.string().uuid(),
        studentId: z.string().uuid(),
        therapyServiceId: z.string().uuid(),
        reportType: z.nativeEnum(Type),
        content: z.string(),
        createdAt: z.date().default(new Date()),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
        school: z.object({
            id: z.string().uuid(),
            name: z.string(),
        }).optional(),
        student: z.object({
            id: z.string().uuid(),
            firstName: z.string(),
            lastName: z.string(),
        }).optional(),
        therapyService: z.object({
            id: z.string().uuid(),
            serviceType: z.nativeEnum(TherapyServices.ServiceType),
        }).optional(),
    });

    export const findParams = z.object({
        id: z.string().uuid(),
    });

    export const find = async ({id}: z.infer<typeof findParams>) => {
        try {
            const report = await prisma.report.findUniqueOrThrow({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    school: true,
                    student: true,
                    therapyService: true,
                },
            });

            return serialize(report);
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Report not found.", {
                    code: "REPORT_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    export const listParams = z.object({
        reportType: z.nativeEnum(Type).optional(),
        therapyServiceId: z.string().uuid().optional(),
        schoolName: z.string().optional(),
        studentName: z.string().optional(),
        therapyServiceType: z.nativeEnum(TherapyServices.ServiceType).optional(),
        createdAt: z.date({coerce: true}).optional(),

        sortBy: z
            .enum([
                "reportType",
                "createdAt",
                "updatedAt",
                "content",
                "schoolName",
                "studentName",
                "therapyServiceType"
            ])
            .optional()
            .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

        perPage: z.number({coerce: true}).gte(1).default(20),
        page: z.number({coerce: true}).gte(1).default(1),
    });

    const buildWhere = (
        filter: z.infer<typeof listParams>,
    ): Prisma.ReportWhereInput => {
        const where: Prisma.ReportWhereInput = {
            reportType: filter.reportType,
            deletedAt: null,
        };

        if (filter.schoolName) {
            where.school = {
                name: {
                    contains: filter.schoolName,
                    mode: 'insensitive',
                },
            };
        }

        if (filter.studentName) {
            where.student = {
                OR: [
                    {
                        firstName: {
                            contains: filter.studentName,
                            mode: 'insensitive',
                        },
                    },
                    {
                        lastName: {
                            contains: filter.studentName,
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        if (filter.therapyServiceType) {
            where.therapyService = {
                serviceType: filter.therapyServiceType,
            };
        }

        return where;
    };

    const buildSort = (filter: z.infer<typeof listParams>) => {
        const {sortBy, sortOrder} = filter;

        // For direct fields
        if (["reportType", "createdAt", "updatedAt", "content"].includes(sortBy)) {
            return {[sortBy]: sortOrder};
        }

        // For relation fields
        switch (sortBy) {
            case "schoolName":
                return {
                    school: {
                        name: sortOrder
                    }
                };
            case "studentName":
                return {
                    student: {
                        lastName: sortOrder
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

        const [reports, total] = await prisma.$transaction([
            prisma.report.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    school: true,
                    student: true,
                    therapyService: true, // Make sure this is included
                },
            }),
            prisma.report.count({
                where,
            }),
        ]);

        const pagination = {
            total,
            pages: Math.ceil(total / take),
        };

        return {
            data: reports.map(serialize),
            pagination,
        };
    };

    export const createData = z.object({
        schoolId: z.string().uuid(),
        studentId: z.string().uuid(),
        therapyServiceId: z.string().uuid(),
        reportType: z.nativeEnum(Type),
        content: z.string(),
        createdAt: z.date().default(new Date()),
    });

    export const create = async (
        data: z.infer<typeof createData>,
        context?: Activity.Context,
    ) => {
        const {id} = await prisma.report.create({
            data,
        });

        Activity.log({
            context,
            action: Activity.Action.CREATE_REPORT,
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
            await prisma.report.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: updates,
            });

            Activity.log({
                context,
                action: Activity.Action.UPDATE_REPORT,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Report not found.", {
                    code: "REPORT_NOT_FOUND",
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
            await prisma.report.update({
                where: {
                    id,
                    deletedAt: null,
                },
                data: {
                    deletedAt: new Date(),
                },
            });

            Activity.log({
                context,
                action: Activity.Action.DELETE_REPORT,
                subjectId: id,
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
                throw new Errors.TNError("Report not found.", {
                    code: "REPORT_NOT_FOUND",
                    status: 404,
                });
            }

            throw e;
        }
    };

    const serialize = (report: PrismaReport & {
        school?: any;
        student?: any;
        therapyService?: any;
    }) => ({
        id: report.id,
        schoolId: report.schoolId,
        studentId: report.studentId,
        therapyServiceId: report.therapyServiceId,
        reportType: report.reportType,
        content: report.content,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        deletedAt: report.deletedAt,
        school: report.school ? {
            id: report.school.id,
            name: report.school.name,
        } : undefined,
        student: report.student ? {
            id: report.student.id,
            firstName: report.student.firstName,
            lastName: report.student.lastName,
        } : undefined,
        therapyService: report.therapyService ? {
            id: report.therapyService.id,
            serviceType: report.therapyService.serviceType,
        } : undefined,
    });
}
