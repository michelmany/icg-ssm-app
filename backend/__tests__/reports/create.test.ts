import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient, ReportType} from '@prisma/client';
import {
    createTestUserWithPermissions,
    createTestSchool,
    TestUser,
    TestSchool,
    TestDataRegistry, createTestTherapyService
} from '../utils/helpers';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

describe.concurrent('POST /reports', () => {
    let adminUser: TestUser;
    let testStudent: any;
    let parentUser: TestUser;
    let school: TestSchool;
    let testTherapyService: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with VIEW_REPORTS permission
        adminUser = await createTestUserWithPermissions(['VIEW_REPORTS']);
        parentUser = await createTestUserWithPermissions([]);

        school = await createTestSchool('Test School');

        testStudent = await prisma.student.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: parentUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED',
            }
        });

        // Create therapy service with this student
        testTherapyService = await createTestTherapyService({
            studentId: testStudent.id
        });
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should create a new report when user has VIEW_REPORTS permission', async ({expect}) => {
        const newReport = {
            schoolId: school.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            reportType: ReportType.ATTENDANCE,
            content: faker.lorem.paragraphs(3),
        };

        const res = await request(app)
            .post('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newReport);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');

        const reportId = res.body.id;

        // Verify the report was created in the database
        const createdReport = await prisma.report.findUnique({
            where: { id: reportId },
            include: {
                school: true,
                student: true,
                therapyService: true,
            }
        });

        expect(createdReport).not.toBeNull();
        expect(createdReport?.reportType).toBe(newReport.reportType);
        expect(createdReport?.content).toBe(newReport.content);
        expect(createdReport?.schoolId).toBe(school.id);
        expect(createdReport?.studentId).toBe(testStudent.id);
        expect(createdReport?.therapyServiceId).toBe(testTherapyService.id);
        expect(createdReport?.school).toHaveProperty('name');
        expect(createdReport?.student).toHaveProperty('firstName');
        expect(createdReport?.therapyService).toHaveProperty('status');
    });

    it('should return an error when user lacks VIEW_REPORTS permission', async ({expect}) => {
        const regularUser = await createTestUserWithPermissions([]);

        const newReport = {
            schoolId: school.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            reportType: ReportType.ATTENDANCE,
            content: faker.lorem.paragraphs(2)
        };

        const res = await request(app)
            .post('/reports')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(newReport);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when required fields are missing', async ({expect}) => {
        const res = await request(app)
            .post('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('length');
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should record an activity log entry when a report is created', async ({expect}) => {
        const newReport = {
            schoolId: school.id,
            studentId: testStudent.id,
            therapyServiceId: testTherapyService.id,
            reportType: ReportType.PROGRESS,
            content: faker.lorem.paragraphs(2),
        };

        const res = await request(app)
            .post('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(newReport);

        expect(res.status).toBe(201);
        const reportId = res.body.id;

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'CREATE_REPORT',
                    subjectId: reportId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // If found already, break out of the loop
            if (activityLog) {
                break;
            }

            // Wait 100ms before trying again
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        expect(activityLog).not.toBeNull();
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
