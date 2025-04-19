import {encode} from "@auth/core/jwt";
import {AuthConfig} from '../../src/config/auth';
import {SecurityLevel, UserStatus} from '@prisma/client';
import {getTestPrisma} from './database';
import {TherapyServices} from '../../src/therapy-services';
import {faker} from '@faker-js/faker';
import bcrypt from 'bcrypt';

export interface TestUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: UserStatus;
    securityLevel: SecurityLevel;
    phoneNumber: string | null;
    roleId: string;
    schoolId: string;
    token: string;
    school: {
        id: string;
        name: string;
        district: string;
        state: string;
        maxTravelDistance: number;
        maxStudentsPerTest: number;
        contactEmail: string;
    };
}

/**
 * Test school type definition
 */
export interface TestSchool {
    id: string;
    name: string;
    district: string;
    state: string;
    maxTravelDistance: number | null;
    maxStudentsPerTest: number | null;
    contactEmail: string;
}

const prisma = getTestPrisma();

/**
 * Test data registry
 */
export const TestDataRegistry = {
    emails: new Set<string>(),
    roleIds: new Set<string>(),
    schoolIds: new Set<string>(),
    providerIds: new Set<string>(),
    therapyServiceIds: new Set<string>(),
    studentIds: new Set<string>(),
    documentIds: new Set<string>(),
    contractIds: new Set<string>(),
    contactIds: new Set<string>(),
    accommodationIds: new Set<string>(),

    /**
     * Register test user data
     */
    registerUser(email: string) {
        this.emails.add(email);
    },

    /**
     * Register test role data
     */
    registerRole(roleId: string) {
        this.roleIds.add(roleId);
    },

    /**
     * Register test school data
     */
    registerSchool(schoolId: string) {
        this.schoolIds.add(schoolId);
    },

    /**
     * Register test provider data
     */
    registerProvider(providerId: string) {
        this.providerIds.add(providerId);
    },

    /**
     * Register test therapy service
     */
    registerTherapyService(id: string) {
        this.therapyServiceIds.add(id);
    },

    /**
     * Register test student
     */
    registerStudent(id: string) {
        this.studentIds.add(id);
    },

    /**
     * Register document
     */
    registerDocument(id: string) {
        this.documentIds.add(id);
    },

    /**
     * Register contract
     */
    registerContract(id: string) {
        this.contractIds.add(id);
    },

    /**
     * Register contact
     */
    registerContact(id: string) {
        this.contactIds.add(id);
    },

    /**
     * Register accommodation
     */
    registerAccommodation(id: string) {
        this.accommodationIds.add(id);
    },

    /**
     * Clear all registries
     */
    clear() {
        this.emails.clear();
        this.roleIds.clear();
        this.schoolIds.clear();
        this.providerIds.clear();
        this.therapyServiceIds.clear();
        this.studentIds.clear();
        this.documentIds.clear();
        this.contractIds.clear();
        this.contactIds.clear();
        this.accommodationIds.clear();
    },

    /**
     * Clean up all registered test data
     */
    async cleanup() {
        const prisma = getTestPrisma();

        // Delete in correct order to avoid foreign key constraints
        // 1. Therapy Services
        if (this.therapyServiceIds.size > 0) {
            await prisma.therapyService.deleteMany({
                where: { id: { in: [...this.therapyServiceIds] } }
            }).catch(() => {});
        }

        if (this.providerIds.size > 0) {
            await prisma.providerDocument.deleteMany({
                where: { providerId: { in: [...this.providerIds] } }
            }).catch(() => {});
            
            await prisma.providerContract.deleteMany({
                where: { providerId: { in: [...this.providerIds] } }
            }).catch(() => {});
            
            await prisma.providerContact.deleteMany({
                where: { providerId: { in: [...this.providerIds] } }
            }).catch(() => {});
        }

        if (this.studentIds.size > 0) {
            await prisma.studentTeacher.deleteMany({
                where: { studentId: { in: [...this.studentIds] } }
            }).catch(() => {});
            
            await prisma.studentTestAssignment.deleteMany({
                where: { studentId: { in: [...this.studentIds] } }
            }).catch(() => {});
            
            await prisma.studentAccommodation.deleteMany({
                where: { studentId: { in: [...this.studentIds] } }
            }).catch(() => {});
        }

        if (this.providerIds.size > 0) {
            await prisma.provider.deleteMany({
                where: { id: { in: [...this.providerIds] } }
            }).catch(() => {});
        }

        if (this.studentIds.size > 0) {
            await prisma.student.deleteMany({
                where: { id: { in: [...this.studentIds] } }
            }).catch(() => {});
        }

        if (this.emails.size > 0) {
            await prisma.user.deleteMany({
                where: { email: { in: [...this.emails] } }
            }).catch(() => {});
        }

        if (this.roleIds.size > 0) {
            await prisma.role.deleteMany({
                where: { id: { in: [...this.roleIds] } }
            }).catch(() => {});
        }

        if (this.schoolIds.size > 0) {
            await prisma.school.deleteMany({
                where: { id: { in: [...this.schoolIds] } }
            }).catch(() => {});
        }

        // Clear all sets
        this.clear();
    }
};



/**
 * Create a test role with specified permissions
 */
export async function createTestRole(name: string, permissions: string[] = []) {
    const role = await prisma.$transaction(async (tx) => {
        await tx.role.deleteMany({
            where: { name }
        });
        
        return tx.role.create({
            data: {
                name,
                permissions: {
                    create: permissions.map(permission => ({
                        permission: {
                            connectOrCreate: {
                                where: { name: permission },
                                create: { name: permission },
                            },
                        },
                    })),
                },
            },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
    });

    TestDataRegistry.registerRole(role.id);

    return role;
}

/**
 * Create a test user with a role and school
 */
export async function createTestUser({
    firstName = 'Test',
    lastName = 'User',
    email = Math.random() + '@example.com',
    roleId,
    schoolId,
    securityLevel = SecurityLevel.FULL_ACCESS,
    status = UserStatus.ACTIVE,
    phoneNumber = '+1234567890',
}: {
    firstName?: string;
    lastName?: string;
    email?: string;
    roleId: string;
    schoolId?: string;
    securityLevel?: SecurityLevel;
    status?: UserStatus;
    phoneNumber?: string;
}): Promise<TestUser> {
    const passwordHash = await bcrypt.hash('testpassword', 10);

    // Create a school if schoolId is not provided
    if (!schoolId) {
        const school = await createTestSchool();
        schoolId = school.id;
    }

    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            passwordHash,
            securityLevel,
            status,
            phoneNumber,
            school: { connect: { id: schoolId } },
            role: { connect: { id: roleId } },
        },
        include: {
            school: true,
        },
    });

    TestDataRegistry.registerUser(user.email);

    const token = await createAuthToken(user.email, []);

    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        securityLevel: user.securityLevel as SecurityLevel, // Type assertion
        phoneNumber: user.phoneNumber,
        roleId: user.roleId ?? '', // Use nullish coalescing
        schoolId: user.schoolId ?? '', // Add nullish coalescing here to fix error
        token: token,
        school: {
            id: user.school?.id ?? '',
            name: user.school?.name ?? '',
            district: user.school?.district ?? '',
            state: user.school?.state ?? '',
            maxTravelDistance: user.school?.maxTravelDistance ?? 0,
            maxStudentsPerTest: user.school?.maxStudentsPerTest ?? 0,
            contactEmail: user.school?.contactEmail ?? ''
        }
    };
}

/**
 * Create a test school
 */
export async function createTestSchool(name = 'Test School'): Promise<TestSchool> {
    const school = await prisma.school.create({
        data: {
            name,
            district: 'Test District',
            state: 'Test State',
            contactEmail: 'school@example.com',
            maxTravelDistance: 50,
            maxStudentsPerTest: 30,
        },
    });

    // Register the created school
    TestDataRegistry.registerSchool(school.id);

    return school;
}

/**
 * Create a test therapy service
 */
export async function createTestTherapyService({
   id = faker.string.uuid(),
   studentId,
   providerId,
   serviceType = faker.helpers.enumValue(TherapyServices.ServiceType),
   status = faker.helpers.enumValue(TherapyServices.TherapyStatus),
   serviceBeginDate = faker.date.past(),
   sessionDate = faker.date.recent(),
   sessionNotes = faker.lorem.paragraph(),
   deliveryMode = faker.helpers.enumValue(TherapyServices.TherapyDeliveryMode),
   goalTracking = {
       goals: Array.from({length: 2}, () => ({
           goal: faker.lorem.sentence(),
           progress: faker.number.int({min: 0, max: 100})
       }))
   },
   ieps = {
       planDate: faker.date.past(),
       objectives: Array.from({length: 3}, () => faker.lorem.sentence())
   },
   nextMeetingDate = faker.date.future()
}: {
    id?: string;
    studentId?: string;
    providerId?: string;
    serviceType?: TherapyServices.ServiceType;
    status?: TherapyServices.TherapyStatus;
    serviceBeginDate?: Date;
    sessionDate?: Date;
    sessionNotes?: string;
    deliveryMode?: TherapyServices.TherapyDeliveryMode;
    goalTracking?: any;
    ieps?: any;
    nextMeetingDate?: Date;
}) {
    // Create or reuse student
    let actualStudentId = studentId;
    if (!actualStudentId) {
        // Create a school if needed
        const school = await createTestSchool();

        // Create a parent user
        const parentUser = await createTestUserWithPermissions([]);

        // Create student
        const student = await prisma.student.create({
            data: {
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED'
            }
        });
        actualStudentId = student.id;

        // Register the created student
        TestDataRegistry.registerStudent(student.id);
    }

    // Create or reuse provider
    let actualProviderId = providerId;
    if (!actualProviderId) {
        // Create provider user
        const providerUser = await createTestUserWithPermissions([]);

        // Create provider
        const provider = await prisma.provider.create({
            data: {
                id: faker.string.uuid(),
                userId: providerUser.id,
                licenseNumber: faker.string.numeric(10),
                credentials: faker.string.alphanumeric(10),
                signature: faker.lorem.words(),
                serviceFeeStructure: 'HOURLY',
                nssEnabled: faker.datatype.boolean(),
                reviewNotes: {notes: faker.lorem.paragraph()},
                status: 'ACTIVE'
            }
        });
        actualProviderId = provider.id;

        // Register the created provider
        TestDataRegistry.registerProvider(provider.id);
    }

    // Create therapy service
    const therapyService = await prisma.therapyService.create({
        data: {
            id,
            studentId: actualStudentId,
            providerId: actualProviderId,
            serviceType,
            status,
            serviceBeginDate,
            sessionDate,
            sessionNotes,
            deliveryMode,
            goalTracking,
            ieps,
            nextMeetingDate
        },
        include: {
            student: true,
            provider: {
                include: {
                    user: true
                }
            }
        }
    });

    // Register the created therapy service
    TestDataRegistry.registerTherapyService(therapyService.id);

    return therapyService;
}

/**
 * Create a test provider
 */
export async function createTestProvider({
    userId = '123456',
    licenseNumber = 'Test 192388294',
    credentials = 'Test Credentials',
    signature = 'Test Signature',
    serviceFeeStructure = 'HOURLY',
    nssEnabled = true,
    reviewNotes = {notes: 'Test Notes'},
    status = 'ACTIVE' as const,
    documentIds = ['1', '2', '3'],
    contractIds = ['1', '2', '3'],
    contactIds = ['1', '2', '3'],
}: {
    userId: string;
    licenseNumber?: string;
    credentials: string;
    signature?: string | null;
    serviceFeeStructure: 'HOURLY' | 'FLAT_RATE' | 'PER_DIEM';
    nssEnabled: boolean;
    reviewNotes: object;
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
    documentIds: string[];
    contractIds: string[];
    contactIds: string[];
}) {
    const provider = await prisma.provider.create({
        data: {
            userId,
            licenseNumber,
            credentials,
            signature,
            serviceFeeStructure,
            nssEnabled,
            reviewNotes,
            status
        },
    });

    if (documentIds.length > 0) {
        await Promise.all(documentIds.map(documentId => 
            prisma.providerDocument.create({
                data: {
                    providerId: provider.id,
                    documentId
                }
            })
        ));
    }

    if (contractIds.length > 0) {
        await Promise.all(contractIds.map(contractId => 
            prisma.providerContract.create({
                data: {
                    providerId: provider.id,
                    contractId
                }
            })
        ));
    }

    if (contactIds.length > 0) {
        await Promise.all(contactIds.map(contactId => 
            prisma.providerContact.create({
                data: {
                    providerId: provider.id,
                    contactId
                }
            })
        ));
    }

    // Register the created provider
    TestDataRegistry.registerProvider(provider.id);

    return provider;
}


/**
 * Create user with permissions
 */
export async function createTestUserWithPermissions(
    permissions: string[] = [],
    options?: {
        emailSuffix?: string,
        firstName?: string,
        lastName?: string
    }
): Promise<TestUser> {
    // Create test school
    const school = await createTestSchool();

    const roleName = `TEST_ROLE_${Date.now()}`;
    const emailSuffix = options?.emailSuffix || Date.now().toString();

    // Create test role with permissions
    const role = await createTestRole(roleName, permissions);

    // Create test user with a more unique email using the provided suffix
    const user = await createTestUser({
        firstName: options?.firstName || 'Test',
        lastName: options?.lastName || 'User',
        email: `test-${emailSuffix}@example.com`,
        roleId: role.id,
        schoolId: school.id,
    });

    // Get full user with permissions
    const userWithPermissions = await getUserWithPermissions(user.id);
    const permissionsArray = userWithPermissions && userWithPermissions.role
        ? userWithPermissions.role.permissions.map(rp => rp.permission.name)
        : [];

    // Create token
    const token = await createAuthToken(user.email, permissionsArray);

    return {
        ...user,
        token: token,
    };
}

/**
 * Create an authentication token for a user
 */
export async function createAuthToken(email: string, permissions: string[] = []) {
    return encode({
        token: {
            email,
            sub: email,
            user: {
                email,
                permissions
            }
        },
        secret: AuthConfig.AUTH_SECRET,
        salt: "authjs.session-token",
        maxAge: 3600
    });
}

/**
 * Get user with permissions
 */
export async function getUserWithPermissions(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            },
            school: true
        }
    });
}
