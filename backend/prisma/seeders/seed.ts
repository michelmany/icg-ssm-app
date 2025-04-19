import {
  ConfirmationStatus,
  PrismaClient,
  Role,
  SecurityLevel,
  StudentStatus,
  UserStatus,
  ProviderStatus,
  ServiceFeeStructure,
  ServiceType,
  TherapyStatus,
  TherapyDeliveryMode,
  ReportType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const USERS_TO_CREATE = 200;
const STUDENTS_TO_CREATE = 500;
const SCHOOLS_TO_CREATE = 38;
const PROVIDERS_TO_CREATE = 8;
const THERAPIST_TO_CREATE = 8;
const THERAPY_SERVICES_TO_CREATE = 200;
const REPORTS_TO_CREATE = 200;

const rolesAndPermissions = {
  ADMIN: [
    "MANAGE_USERS",
    "ASSIGN_ROLES",
    "DEACTIVATE_USERS",
    "RESET_PASSWORDS",
    "CONFIGURE_TEST_SITES",
    "SCHEDULE_TESTS",
    "ASSIGN_ACCOMMODATIONS",
    "TRACK_STUDENT_CONFIRMATIONS",
    "MANAGE_EQUIPMENT",
    "MANAGE_TESTS",
    "ASSIGN_STUDENTS",
    "SEND_REMINDERS",
    "VIEW_REPORTS",
  ],
  TEACHER: [
    "ASSIGN_ACCOMMODATIONS",
    "TRACK_STUDENT_CONFIRMATIONS",
    "MANAGE_EQUIPMENT",
    "ASSIGN_STUDENTS",
    "TRACK_ATTENDANCE",
    "SEND_REMINDERS",
  ],
  THERAPIST: [
    "MANAGE_EQUIPMENT",
    "TRACK_ATTENDANCE",
    "SCAN_QR_CODES",
    "REPORT_INCIDENTS",
  ],
  PROVIDER: [
    "CONFIRM_TEST_LOCATION",
  ],
  SUPERVISOR: [
    "VIEW_RESULTS",
  ],
};

async function main() {
  const roles: Role[] = [];

  for (const role in rolesAndPermissions) {
    const createdRole = await prisma.role.upsert({
      where: {
        name: role,
      },
      update: {},
      create: {
        name: role,
        permissions: {
          create: rolesAndPermissions[
            role as keyof typeof rolesAndPermissions
          ].map((permission) => ({
            permission: {
              connectOrCreate: {
                where: {
                  name: permission,
                },
                create: {
                  name: permission,
                },
              },
            },
          })),
        },
      },
    });
    roles.push(createdRole);
  }

  const schools = await prisma.school.createManyAndReturn({
    data: Array.from(new Array(SCHOOLS_TO_CREATE)).map(() => ({
      name: faker.company.name(),
      district: faker.location.county(),
      state: faker.location.state(),
      maxTravelDistance: faker.number.int({ max: 100 }),
      maxStudentsPerTest: faker.number.int({ max: 100 }),
      contactEmail: faker.internet.email(),
    })),
  });

  const passwordHash = await bcrypt.hash("testpassword", 10);

  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    securityLevel: SecurityLevel;
    status: UserStatus;
    schoolId: string;
    roleId: string;
  }

  const users: User[] = [];

  const timestamp = Date.now();

  for (let i = 0; i < roles.length; i++) {
    const user = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `${roles[i]?.name.toLowerCase()}@example.com`,
        passwordHash,
        securityLevel: faker.helpers.enumValue(SecurityLevel) || SecurityLevel.FULL_ACCESS,
        status: UserStatus.ACTIVE,
        schoolId: faker.helpers.arrayElement(schools).id,
        roleId: roles[i]?.id,
      },
    });
    users.push(user as User);
  }

  const remainingUsersToCreate = USERS_TO_CREATE - roles.length;
  for (let i = 0; i < remainingUsersToCreate; i++) {
    const user = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `user-${i}-${timestamp}-${faker.internet.email()}`,
        passwordHash,
        securityLevel: faker.helpers.enumValue(SecurityLevel) || SecurityLevel.FULL_ACCESS,
        status: faker.helpers.enumValue(UserStatus) || UserStatus.ACTIVE,
        schoolId: faker.helpers.arrayElement(schools).id,
        roleId: faker.helpers.arrayElement(roles).id,
      },
    });
    users.push(user as User);
  }

  const allAccommodations = await prisma.accommodation.findMany();

  const students = await prisma.student.createManyAndReturn({
    data: Array.from(new Array(STUDENTS_TO_CREATE)).map((_, i) => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dob: faker.date.birthdate(),
      gradeLevel: faker.number.int({ min: 1, max: 12 }),
      schoolId: faker.helpers.arrayElement(schools).id,
      parentId: faker.helpers.arrayElement(users).id,
      status: faker.helpers.enumValue(StudentStatus),
      studentCode: faker.string.numeric({ length: 10 }),
      confirmationStatus: faker.helpers.enumValue(ConfirmationStatus),
    })),
  });

  await Promise.all(
    students.map(async (student) => {
      const studentAccommodations = faker.helpers.arrayElements(
        allAccommodations,
        { min: 1, max: 3 }
      );

      await Promise.all(
        studentAccommodations.map(accommodation =>
          prisma.studentAccommodation.create({
            data: {
              studentId: student.id,
              accommodationId: accommodation.id,
              details: Math.random() > 0.5
                ? { notes: faker.lorem.sentence() }
                : undefined,
            },
          })
        )
      );
    })
  );

  const teacherUsers = users.filter(
    ({ roleId }) => roleId === roles.find((role) => role.name === "TEACHER")?.id
  );

  await Promise.all(
    students.slice(0, 500).map(async (student) => {
      const studentTeachers = faker.helpers.arrayElements(
        teacherUsers,
        { min: 1, max: 2 }
      );

      await Promise.all(
        studentTeachers.map(teacher =>
          prisma.studentTeacher.create({
            data: {
              studentId: student.id,
              teacherId: teacher.id,
            },
          })
        )
      );
    })
  );

  const providerUsers = users.filter(
    ({ roleId }) => roleId === roles.find((role) => role.name === "PROVIDER")?.id
  );

  const providers = await Promise.all(
    Array.from(new Array(PROVIDERS_TO_CREATE)).map(async () => {
      return await prisma.provider.create({
        data: {
          userId: faker.helpers.arrayElement(providerUsers).id,
          licenseNumber: faker.string.numeric({ length: 10 }),
          credentials: faker.string.numeric({ length: 10 }),
          signature: faker.lorem.words(),
          serviceFeeStructure: faker.helpers.enumValue(ServiceFeeStructure),
          nssEnabled: faker.datatype.boolean(),
          reviewNotes: { notes: faker.lorem.words() },
          status: faker.helpers.enumValue(ProviderStatus),
        },
      });
    })
  );

  const documents = await Promise.all(
    Array.from(new Array(20)).map(() =>
      prisma.document.create({
        data: {
          providerId: faker.helpers.arrayElement(providers).id, // Use real provider ID
          document: faker.system.filePath(),
          createdById: faker.helpers.arrayElement(users).id,
        },
      })
    )
  );

  const contacts = await Promise.all(
    Array.from(new Array(15)).map(() =>
      prisma.contact.create({
        data: {
          providerId: faker.helpers.arrayElement(providers).id, // Use real provider ID
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          cellPhone: faker.phone.number(),
          workPhone: faker.phone.number(),
          email: faker.internet.email(),
          createdById: faker.helpers.arrayElement(users).id,
        },
      })
    )
  );

  const contracts = await Promise.all(
    Array.from(new Array(10)).map(() =>
      prisma.contract.create({
        data: {
          providerId: faker.helpers.arrayElement(providers).id, // Use real provider ID
          contract: faker.system.filePath(),
          createdById: faker.helpers.arrayElement(users).id,
        },
      })
    )
  );

  await Promise.all(
    providers.map(async (provider) => {
      const providerDocuments = faker.helpers.arrayElements(documents, { min: 2, max: 4 });
      await Promise.all(
        providerDocuments.map(doc =>
          prisma.providerDocument.create({
            data: {
              providerId: provider.id,
              documentId: doc.id,
            },
          })
        )
      );

      const providerContracts = faker.helpers.arrayElements(contracts, { min: 1, max: 3 });
      await Promise.all(
        providerContracts.map(contract =>
          prisma.providerContract.create({
            data: {
              providerId: provider.id,
              contractId: contract.id,
            },
          })
        )
      );

      const providerContacts = faker.helpers.arrayElements(contacts, { min: 1, max: 3 });
      await Promise.all(
        providerContacts.map(contact =>
          prisma.providerContact.create({
            data: {
              providerId: provider.id,
              contactId: contact.id,
            },
          })
        )
      );
    })
  );

  const therapistUsers = users.filter(
    ({ roleId }) => roleId === roles.find((role) => role.name === "THERAPIST")?.id
  );

  await Promise.all(
    Array.from(new Array(THERAPIST_TO_CREATE)).map((_, i) =>
      prisma.therapist.create({
        data: {
          userId: therapistUsers[i % therapistUsers.length]?.id ?? "defaultUserId",
          disciplines: faker.lorem.words(),
          licenseNumber: faker.string.numeric({length: 10}),
          medicaidNationalProviderId: faker.number.int({min: 1, max: 12}),
          socialSecurity: faker.lorem.words(),
          stateMedicaidProviderId: faker.number.int({min: 1, max: 12}),
          status: "ACTIVE",
        }
      })
    )
  );

  await prisma.therapyService.createManyAndReturn({
    data: Array.from(new Array(THERAPY_SERVICES_TO_CREATE)).map(() => {
      const sessionDate = faker.date.recent({ days: 30 });
      const serviceBeginDate = faker.date.past({ years: 1, refDate: sessionDate });

      return {
        id: faker.string.uuid(),
        studentId: faker.helpers.arrayElement(students).id,
        providerId: faker.helpers.arrayElement(providers).id,
        serviceType: faker.helpers.enumValue(ServiceType),
        status: faker.helpers.enumValue(TherapyStatus),
        serviceBeginDate,
        sessionDate,
        sessionNotes: faker.lorem.paragraph(),
        deliveryMode: faker.helpers.enumValue(TherapyDeliveryMode),
        goalTracking: Math.random() > 0.5
            ? JSON.parse(JSON.stringify({
              goals: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
                goal: faker.lorem.sentence(),
                progress: faker.number.int({min: 0, max: 100})
              }))
            }))
            : undefined,
        ieps: Math.random() > 0.5
            ? JSON.parse(JSON.stringify({
              planDate: faker.date.past(),
              objectives: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.lorem.sentence())
            }))
            : undefined,
        nextMeetingDate: Math.random() > 0.3 ? faker.date.future() : null,
      };
    }),
  });

  const therapyServices = await prisma.therapyService.findMany({
    take: 100,
  });

  await prisma.report.createMany({
    data: Array.from(new Array(REPORTS_TO_CREATE)).map(() => {
      const therapyService = faker.helpers.arrayElement(therapyServices);

      return {
        schoolId: faker.helpers.arrayElement(schools).id,
        studentId: therapyService.studentId,
        therapyServiceId: therapyService.id,
        reportType: faker.helpers.enumValue(ReportType),
        content: faker.lorem.paragraphs(3),
      };
    }),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
