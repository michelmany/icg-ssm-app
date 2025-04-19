import { Prisma, School as PrismaShool } from "@prisma/client";
import { prisma } from "../db";
import { z } from "zod";
import { Activity } from "../activity";
import { Errors } from "../errors";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export namespace Schools {
  export const Info = z.object({
    id: z.string().uuid(),
    name: z.string(),
    district: z.string(),
    state: z.string(),
    contactEmail: z.string().email(),
    maxTravelDistance: z.number(),
    maxStudentsPerTest: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
  });

  export const findParams = z.object({
    id: z.string().uuid(),
  });

  export const find = async ({ id }: z.infer<typeof findParams>) => {
    try {
      const school = await prisma.school.findUniqueOrThrow({
        where: {
          id,
          deletedAt: null,
        },
      });

      return serialize(school);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("School not found.", {
          code: "SCHOOL_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  export const listParams = z.object({
    name: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    contactEmail: z.string().optional(),
    maxTravelDistance: z.number().optional(),
    maxStudentsPerTest: z.number().optional(),

    sortBy: z
      .enum([
        "name",
        "district",
        "state",
        "contactEmail",
        "maxTravelDistance",
        "maxStudentsPerTest",
      ])
      .optional()
      .default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

    perPage: z.number({ coerce: true }).gte(1).default(20),
    page: z.number({ coerce: true }).gte(1).default(1),
  });

  const buildWhere = (
    filter: z.infer<typeof listParams>,
  ): Prisma.SchoolWhereInput => {
    return {
      deletedAt: null,
      name: {
        contains: filter.name,
        mode: "insensitive",
      },
      district: {
        contains: filter.district,
        mode: "insensitive",
      },
      state: {
        contains: filter.state,
        mode: "insensitive",
      },
      contactEmail: {
        contains: filter.contactEmail,
        mode: "insensitive",
      },
      maxStudentsPerTest: {
        equals: filter.maxStudentsPerTest,
      },
      maxTravelDistance: {
        equals: filter.maxTravelDistance,
      },
    };
  };

  const buildSort = (filter: z.infer<typeof listParams>) => {
    const { sortBy, sortOrder } = filter;

    return { [sortBy]: sortOrder };
  };

  export const list = async (filter: z.infer<typeof listParams>) => {
    const skip = (filter.page - 1) * filter.perPage;
    const take = filter.perPage;

    const where = buildWhere(filter);
    const orderBy = buildSort(filter);

    const [schools, total] = await prisma.$transaction([
      prisma.school.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.school.count({
        where,
      }),
    ]);

    const pagination = {
      total,
      pages: Math.ceil(total / take),
    };

    return {
      data: schools.map(serialize),
      pagination,
    };
  };

  export const createData = z.object({
    name: z.string(),
    district: z.string(),
    state: z.string(),
    contactEmail: z.string().email(),
    maxTravelDistance: z.number(),
    maxStudentsPerTest: z.number(),
  });

  export const create = async (
    data: z.infer<typeof createData>,
    context?: Activity.Context,
  ) => {
    const { id } = await prisma.school.create({
      data,
    });

    Activity.log({
      context,
      action: Activity.Action.CREATE_SCHOOL,
      subjectId: id,
    });
  };

  export const updateData = createData.partial();

  export const update = async (
    { id, ...updates }: z.infer<typeof findParams> & z.infer<typeof updateData>,
    context?: Activity.Context,
  ) => {
    try {
      await prisma.school.update({
        where: {
          id,
          deletedAt: null,
        },
        data: updates,
      });

      Activity.log({
        context,
        action: Activity.Action.UPDATE_SCHOOL,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("School not found.", {
          code: "SCHOOL_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  export const remove = async (
    { id }: z.infer<typeof findParams>,
    context?: Activity.Context,
  ) => {
    try {
      await prisma.school.update({
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
        action: Activity.Action.DELETE_SCHOOL,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("School not found.", {
          code: "SCHOOL_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  const serialize = (school: PrismaShool) => ({
    id: school.id,
    name: school.name,
    district: school.district,
    state: school.state,
    contactEmail: school.contactEmail,
    maxTravelDistance: school.maxTravelDistance,
    maxStudentsPerTest: school.maxStudentsPerTest,
    createdAt: school.createdAt,
    updatedAt: school.updatedAt,
  });
}
