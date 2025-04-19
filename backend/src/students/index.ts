import { z } from "zod";
import { Schools } from "../schools";
import { Users } from "../users";
import { prisma } from "../db";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Errors } from "../errors";
import { Prisma, Student as PrismaStudent } from "@prisma/client";
import { Activity } from "../activity";

export namespace Students {
  export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
  }

  export enum ConfirmationStatus {
    CONFIRMED = "CONFIRMED",
    PENDING = "PENDING",
    RESCHEDULED = "RESCHEDULED",
  }

  export const Info = z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    dob: z.string().date(),
    gradeLevel: z.number(),
    school: Schools.Info.pick({
      id: true,
      name: true,
    }),
    parent: Users.Info.pick({
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    }),
    studentCode: z.string(),
    status: z.nativeEnum(Status),
    confirmationStatus: z.nativeEnum(ConfirmationStatus),
    createdAt: z.date(),
    updatedAt: z.date(),
    accommodations: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      details: z.any().optional(),
    })).optional(),
    assignedTeachers: z.array(z.object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })).optional(),
    assignedTests: z.array(z.string()).optional(),
  });

  export const findParams = z.object({
    id: z.string().uuid(),
  });

  export const find = async ({ id }: z.infer<typeof findParams>) => {
    try {
      const student = await prisma.student.findUniqueOrThrow({
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
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          accommodations: {
            include: {
              accommodation: true,
            }
          },
          teachers: {
            include: {
              teacher: true,
            }
          },
          testAssignments: true,
        },
      });

      return {
        ...serialize(student),
        school: student.school,
        parent: student.parent,
        accommodations: student.accommodations.map(a => ({
          id: a.accommodation.id,
          name: a.accommodation.name,
          details: a.details,
        })),
        assignedTeachers: student.teachers.map(t => ({
          id: t.teacher.id,
          firstName: t.teacher.firstName,
          lastName: t.teacher.lastName,
        })),
        assignedTests: student.testAssignments.map(t => t.testId),
      };
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
    dob: z.date({ coerce: true }).optional(),
    gradeLevel: z.number({ coerce: true }).optional(),
    school: z.string().optional(),
    parent: z.string().optional(),
    studentCode: z.string().optional(),
    status: z.nativeEnum(Status).optional(),
    confirmationStatus: z.nativeEnum(ConfirmationStatus).optional(),
    teacherId: z.string().optional(),

    sortBy: z
      .enum([
        "name",
        "dob",
        "gradeLevel",
        "school",
        "parent",
        "studentCode",
        "status",
        "confirmationStatus",
      ])
      .optional()
      .default("name"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),

    perPage: z.number({ coerce: true }).gte(1).default(20),
    page: z.number({ coerce: true }).gte(1).default(1),
  });

  const buildWhere = (
    filter: z.infer<typeof listParams>,
  ): Prisma.StudentWhereInput => {
    return {
      deletedAt: null,
      dob: filter.dob,
      gradeLevel: filter.gradeLevel,
      status: filter.status,
      confirmationStatus: filter.confirmationStatus,
      studentCode: {
        contains: filter.studentCode,
      },
      ...(filter.name
        ? {
            OR: [
              { firstName: { contains: filter.name, mode: "insensitive" } },
              { lastName: { contains: filter.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filter.parent
        ? {
            parent: {
              firstName: { contains: filter.parent, mode: "insensitive" },
              lastName: { contains: filter.parent, mode: "insensitive" },
            },
          }
        : {}),
      ...(filter.school
        ? {
            school: {
              name: { contains: filter.school, mode: "insensitive" },
            },
          }
        : {}),
      ...(filter.teacherId
          ? {
            teachers: {
              some: {
                teacherId: filter.teacherId,
              },
            },
          }
          : {}),
    };
  };

  const buildSort = (filter: z.infer<typeof listParams>) => {
    const { sortBy, sortOrder } = filter;

    if (sortBy === "name") {
      return [{ firstName: sortOrder }, { lastName: sortOrder }];
    }

    if (sortBy === "parent") {
      return [
        { parent: { firstName: sortOrder } },
        { parent: { lastName: sortOrder } },
      ];
    }

    if (sortBy === "school") {
      return { school: { name: sortOrder } };
    }

    return { [sortBy]: sortOrder };
  };

  export const list = async (filter: z.infer<typeof listParams>) => {
    const skip = (filter.page - 1) * filter.perPage;
    const take = filter.perPage;

    const where = buildWhere(filter);
    const orderBy = buildSort(filter);

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          accommodations: {
            include: {
              accommodation: true,
            }
          },
          teachers: {
            include: {
              teacher: true,
            }
          },
          testAssignments: true,
        },
        skip,
        take,
        orderBy,
      }),
      prisma.student.count({
        where,
      }),
    ]);

    const pagination = {
      total,
      pages: Math.ceil(total / take),
    };

    return {
      data: students.map((student) => ({
        ...serialize(student),
        school: student.school,
        parent: student.parent,
        accommodations: student.accommodations.map(a => ({
          id: a.accommodation.id,
          name: a.accommodation.name,
          details: a.details,
        })),
        assignedTeachers: student.teachers.map(t => ({
          id: t.teacher.id,
          firstName: t.teacher.firstName,
          lastName: t.teacher.lastName,
        })),
        assignedTests: student.testAssignments.map(t => t.testId),
      })),
      pagination,
    };
  };

  export const createData = z.object({
    firstName: z.string(),
    lastName: z.string(),
    dob: z.date({ coerce: true }),
    gradeLevel: z.number().gte(1).lte(12),
    schoolId: z.string().uuid(),
    parentId: z.string().uuid(),
    studentCode: z.string(),
    status: z.nativeEnum(Status),
    confirmationStatus: z.nativeEnum(ConfirmationStatus),
    accommodationIds: z.array(z.string()).optional(),
    teacherIds: z.array(z.string()).optional(),
    testIds: z.array(z.string()).optional(),
  });

  export const create = async (
    data: z.infer<typeof createData>,
    context?: Activity.Context,
  ) => {
    const { accommodationIds, teacherIds, testIds, ...studentData } = data;

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: studentData,
      });

      if (accommodationIds && accommodationIds.length > 0) {
        await Promise.all(
          accommodationIds.map(accommodationId =>
            tx.studentAccommodation.create({
              data: {
                studentId: newStudent.id,
                accommodationId,
              }
            })
          )
        );
      }

      if (teacherIds && teacherIds.length > 0) {
        await Promise.all(
          teacherIds.map(teacherId =>
            tx.studentTeacher.create({
              data: {
                studentId: newStudent.id,
                teacherId,
              }
            })
          )
        );
      }

      if (testIds && testIds.length > 0) {
        await Promise.all(
          testIds.map(testId =>
            tx.studentTestAssignment.create({
              data: {
                studentId: newStudent.id,
                testId,
              }
            })
          )
        );
      }

      return newStudent;
    });

    Activity.log({
      context,
      action: Activity.Action.CREATE_STUDENT,
      subjectId: student.id,
    });
  };

  export const updateData = createData.partial();

  export const update = async (
    { id, ...updates }: z.infer<typeof findParams> & z.infer<typeof updateData>,
    context?: Activity.Context,
  ) => {
    try {
      const { accommodationIds, teacherIds, testIds, ...studentUpdates } = updates;

      await prisma.$transaction(async (tx) => {
        await tx.student.update({
          where: {
            id,
            deletedAt: null,
          },
          data: studentUpdates,
        });

        if (accommodationIds !== undefined) {
          await tx.studentAccommodation.deleteMany({
            where: { studentId: id }
          });

          if (accommodationIds.length > 0) {
            await Promise.all(
              accommodationIds.map(accommodationId =>
                tx.studentAccommodation.create({
                  data: {
                    studentId: id,
                    accommodationId,
                  }
                })
              )
            );
          }
        }

        if (teacherIds !== undefined) {
          await tx.studentTeacher.deleteMany({
            where: { studentId: id }
          });

          if (teacherIds.length > 0) {
            await Promise.all(
              teacherIds.map(teacherId =>
                tx.studentTeacher.create({
                  data: {
                    studentId: id,
                    teacherId,
                  }
                })
              )
            );
          }
        }

        if (testIds !== undefined) {
          await tx.studentTestAssignment.deleteMany({
            where: { studentId: id }
          });

          if (testIds.length > 0) {
            await Promise.all(
              testIds.map(testId =>
                tx.studentTestAssignment.create({
                  data: {
                    studentId: id,
                    testId,
                  }
                })
              )
            );
          }
        }
      });

      Activity.log({
        context,
        action: Activity.Action.UPDATE_STUDENT,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("Student not found.", {
          code: "STUDENT_NOT_FOUND",
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
      await prisma.student.update({
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
        action: Activity.Action.DELETE_STUDENT,
        subjectId: id,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === "P2025") {
        throw new Errors.TNError("Student not found.", {
          code: "STUDENT_NOT_FOUND",
        });
      }

      throw e;
    }
  };

  const serialize = (student: PrismaStudent) => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dob: formatBirthdate(student.dob),
    gradeLevel: student.gradeLevel,
    studentCode: student.studentCode,
    status: student.status,
    confirmationStatus: student.confirmationStatus,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  });

  const formatBirthdate = (date: Date) => {
    const year = date.getFullYear();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
}
