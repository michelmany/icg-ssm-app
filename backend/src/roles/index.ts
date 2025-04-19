import { Role as PrismaRole } from "@prisma/client";
import { prisma } from "../db";
import { z } from "zod";

export namespace Roles {
  export const Info = z.object({
    id: z.string().uuid(),
    name: z.string(),
  });

  export const listParams = z.object({
    perPage: z.number({ coerce: true }).gte(1).default(20),
    page: z.number({ coerce: true }).gte(1).default(1),
  });

  export const list = async (filter: z.infer<typeof listParams>) => {
    const skip = (filter.page - 1) * filter.perPage;
    const take = filter.perPage;

    const [roles, total] = await prisma.$transaction([
      prisma.role.findMany({
        skip,
        take,
      }),
      prisma.role.count(),
    ]);

    const pagination = {
      total,
      pages: Math.ceil(total / take),
    };

    return {
      data: roles.map(serialize),
      pagination,
    };
  };

  const serialize = (role: PrismaRole) => ({
    id: role.id,
    name: role.name,
  });
}
