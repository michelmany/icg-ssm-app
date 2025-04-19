import { Prisma, User as PrismaUser, UserStatus } from "@prisma/client";
import { prisma } from "../db";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Errors } from "../errors";
import crypto from "crypto";
import { UsersConfig } from "../config/users";
import { Emails } from "../emails";
import { Activity } from "../activity";
import { Schools } from "../schools";
import { Roles } from "../roles";

export namespace Users {
  export enum Role {
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    THERAPIST = "THERAPIST",
    PROVIDER = "PROVIDER",
    SUPERVISOR = "SUPERVISOR",
  }

  export enum SecurityLevel {
    FULL_ACCESS = "FULL_ACCESS",
    LIMITED = "LIMITED",
    READ_ONLY = "READ_ONLY",
  }

  export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }

  export enum UserTokenType {
    PASSWORD_RESET = "PASSWORD_RESET",
    INVITATION = "INVITATION",
  }

  export enum Permission {
    MANAGE_USERS = "MANAGE_USERS",
    ASSIGN_ROLES = "ASSIGN_ROLES",
    DEACTIVATE_USERS = "DEACTIVATE_USERS",
    RESET_PASSWORDS = "RESET_PASSWORDS",
    CONFIGURE_TEST_SITES = "CONFIGURE_TEST_SITES",
    SCHEDULE_TESTS = "SCHEDULE_TESTS",
    ASSIGN_ACCOMMODATIONS = "ASSIGN_ACCOMMODATIONS",
    TRACK_STUDENT_CONFIRMATIONS = "TRACK_STUDENT_CONFIRMATIONS",
    MANAGE_EQUIPMENT = "MANAGE_EQUIPMENT",
    MANAGE_TESTS = "MANAGE_TESTS",
    ASSIGN_STUDENTS = "ASSIGN_STUDENTS",
    TRACK_ATTENDANCE = "TRACK_ATTENDANCE",
    SEND_REMINDERS = "SEND_REMINDERS",
    VIEW_REPORTS = "VIEW_REPORTS",
    SCAN_QR_CODES = "SCAN_QR_CODES",
    REPORT_INCIDENTS = "REPORT_INCIDENTS",
    CONFIRM_TEST_LOCATION = "CONFIRM_TEST_LOCATION",
    VIEW_RESULTS = "VIEW_RESULT",
    VIEW_INVOICES = "VIEW_INVOICES",
  }

  export const Info = z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phoneNumber: z.string().nullable(),
    securityLevel: z.nativeEnum(SecurityLevel),
    status: z.nativeEnum(Status),
    school: Schools.Info.pick({
      id: true,
      name: true,
    }),
    role: Roles.Info.pick({
      id: true,
      name: true,
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
  });

  export const listParams = z.object({
    name: z.string().optional(),
    school: z.string().optional(),

    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(Status).optional(),

    sortBy: z
      .enum(["name", "school", "role", "status"])
      .optional()
      .default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

    perPage: z.number({ coerce: true }).gte(10).lte(300).default(20),
    page: z.number({ coerce: true }).gte(1).default(1),
  });

  const buildSort = (filter: z.infer<typeof listParams>) => {
    const { sortBy, sortOrder } = filter;

    if (sortBy === "role") {
      return { role: { name: sortOrder } };
    }

    if (sortBy === "school") {
      return { school: { name: sortOrder } };
    }

    if (sortBy === "name") {
      return [{ firstName: sortOrder }, { lastName: sortOrder }];
    }

    return { [sortBy]: sortOrder };
  };

  const buildWhere = (
    filter: z.infer<typeof listParams>,
  ): Prisma.UserWhereInput => {
    return {
      deletedAt: null,
      status: filter.status,
      ...(filter.name
        ? {
            OR: [
              { firstName: { contains: filter.name, mode: "insensitive" } },
              { lastName: { contains: filter.name, mode: "insensitive" } },
              { email: { contains: filter.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filter.school
        ? {
            school: {
              name: { contains: filter.school, mode: "insensitive" },
            },
          }
        : {}),
      ...(filter.role
        ? {
            role: {
              name: filter.role,
            },
          }
        : {}),
    };
  };

  export const list = async (filter: z.infer<typeof listParams>) => {
    const skip = (filter.page - 1) * filter.perPage;
    const take = filter.perPage;
    const where = buildWhere(filter);
    const orderBy = buildSort(filter);

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take,
        orderBy,
      }),
      prisma.user.count({
        where,
      }),
    ]);

    const pagination = {
      total,
      pages: Math.ceil(total / take),
    };

    return {
      data: users.map((user) => ({
        ...serialize(user),
        school: user.school,
        role: user.role,
      })),
      pagination,
    };
  };

  export const InfoWithPermissions = Info.omit({
    school: true,
  }).extend({
    permissions: z.array(z.nativeEnum(Permission)),
  });

  export type UserWithPermissions = z.infer<typeof InfoWithPermissions>;

  export const getWithPermissions = async (
    email: string,
  ): Promise<UserWithPermissions | null> => {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        status: Status.ACTIVE,
      },
      include: {
        role: {
          include: {
            permissions: {
              select: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return null;
    }

    return {
      ...serialize(user),
      role: {
        id: user.role.id,
        name: user.role.name as Role,
      },
      permissions:
        user.role?.permissions.map(
          ({ permission }) => permission.name as Permission,
        ) ?? [],
    };
  };

  const serialize = (user: PrismaUser) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    securityLevel: user.securityLevel as SecurityLevel,
    status: user.status as Status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });

  export const hasPermission = (
    user: UserWithPermissions,
    permission: Permission,
  ) => {
    return user.permissions.includes(permission);
  };

  export const getUserPasswordHash = async (email: string) => {
    const user = await prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        passwordHash: true,
      },
    });

    return user?.passwordHash;
  };

  const setPasswordResetTokenParams = z.object({
    email: z.string().uuid(),
    token: z.string(),
    tokenExpiry: z.date(),
  });

  export const setPasswordResetToken = async ({
    email,
    token,
    tokenExpiry,
  }: z.infer<typeof setPasswordResetTokenParams>) => {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { email } });

        await tx.user.update({
          where: {
            email,
            deletedAt: null,
          },
          data: {
            tokens: {
              upsert: {
                where: {
                  userIdTokenType: {
                    userId: user.id,
                    type: UserTokenType.PASSWORD_RESET,
                  },
                },
                update: {
                  token,
                  expiresAt: tokenExpiry,
                },
                create: {
                  type: UserTokenType.PASSWORD_RESET,
                  token,
                  expiresAt: tokenExpiry,
                },
              },
            },
          },
        });
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", { code: "USER_NOT_FOUND" });
      }

      throw e;
    }
  };

  const setPasswordParams = z.object({
    email: z.string().uuid(),
    token: z.string(),
    passwordHash: z.string(),
    type: z.nativeEnum(UserTokenType),
    setActive: z.boolean().optional(),
  });

  export const setPassword = async ({
    email,
    token,
    passwordHash,
    type,
    setActive,
  }: z.infer<typeof setPasswordParams>) => {
    try {
      await prisma.$transaction(async (tx) => {
        const { tokens } = await tx.user.findUniqueOrThrow({
          where: { email, deletedAt: null },
          select: {
            tokens: {
              where: {
                type,
              },
            },
          },
        });

        const { token: resetPasswordToken, expiresAt } = tokens[0] ?? {};

        if (!expiresAt || !token || resetPasswordToken !== token) {
          throw new Errors.TNError("Invalid password reset token.", {
            code: "INVALID_RESET_TOKEN",
          });
        }

        if (expiresAt < new Date()) {
          throw new Errors.TNError("Password reset token has expired.", {
            code: "RESET_TOKEN_EXPIRED",
          });
        }

        await tx.user.update({
          where: { email, deletedAt: null },
          data: {
            passwordHash,
            status: setActive ? UserStatus.ACTIVE : undefined,
            tokens: {
              deleteMany: {
                type,
              },
            },
          },
        });
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("Invalid password reset token.", {
          code: "INVALID_RESET_TOKEN",
        });
      }

      throw e;
    }
  };

  export const findParams = z.object({
    id: z.string().uuid(),
  });

  export const find = async ({ id }: z.infer<typeof findParams>) => {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        ...serialize(user),
        school: user.school,
        role: user.role,
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", {
          code: "USER_NOT_FOUND",
          status: 404,
        });
      }

      throw e;
    }
  };

  export const findByEmailParams = z.object({
    email: z.string(),
  });

  export const findByEmail = async ({
    email,
  }: z.infer<typeof findByEmailParams>) => {
    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          email,
          deletedAt: null,
        },
      });

      return serialize(user);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", {
          code: "USER_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  export const createData = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    securityLevel: z.nativeEnum(SecurityLevel),
    schoolId: z.string().uuid(),
    roleId: z.string().uuid(),
    phoneNumber: z.string().nullable(),
    status: z.nativeEnum(UserStatus),
  });

  export const createParams = z.object({
    sendInvite: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .default(false),
  });

  export const create = async (
    {
      sendInvite,
      ...data
    }: z.infer<typeof createData> & z.infer<typeof createParams>,
    context?: Activity.Context,
  ) => {
    const { id } = await prisma.user.create({
      data: {
        ...data,
        passwordHash: "",
        status: UserStatus.INACTIVE,
      },
    });

    Activity.log({
      context,
      action: Activity.Action.CREATE_USER,
      subjectId: id,
    });

    if (sendInvite) {
      await invite({ id }, context);
    }
  };

  export const invite = async (
    { id }: z.infer<typeof findParams>,
    context?: Activity.Context,
  ) => {
    try {
      const token = crypto.randomBytes(50).toString("base64");
      const tokenExpiry = new Date(
        new Date().getTime() +
          UsersConfig.ACCOUNT_CREATION_INVITE_MAX_AGE * 1000,
      );

      const { email } = await prisma.user.update({
        where: {
          id,
          deletedAt: null,
        },
        data: {
          tokens: {
            upsert: {
              where: {
                userIdTokenType: {
                  userId: id,
                  type: UserTokenType.INVITATION,
                },
              },
              update: {
                token,
                expiresAt: tokenExpiry,
              },
              create: {
                type: UserTokenType.INVITATION,
                token,
                expiresAt: tokenExpiry,
              },
            },
          },
        },
      });

      await Emails.sendInviteEmail({
        to: email,
        token,
      });

      Activity.log({
        context,
        action: Activity.Action.INVITE_USER,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", {
          code: "USER_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  export const updateData = createData.partial();

  export const update = async (
    { id, ...updates }: z.infer<typeof findParams> & z.infer<typeof updateData>,
    context?: Activity.Context,
  ) => {
    try {
      await prisma.user.update({
        where: {
          id,
          deletedAt: null,
        },
        data: updates,
      });

      Activity.log({
        context,
        action: Activity.Action.UPDATE_USER,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", {
          code: "USER_NOT_FOUND",
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
      await prisma.user.update({
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
        action: Activity.Action.DELETE_USER,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("User not found.", {
          code: "USER_NOT_FOUND",
        });
      }

      throw e;
    }
  };
}
