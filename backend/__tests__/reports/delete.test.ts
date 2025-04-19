import request from 'supertest';
import {describe, expect, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient, ReportType} from '@prisma/client';
import {
    createTestUserWithPermissions,
    createTestSchool,
    TestUser,
    TestSchool,
    TestDataRegistry,
    createTestTherapyService
} from '../utils/helpers';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

describe.concurrent('DELETE /reports/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let school: TestSchool;
    let testStudent: any;
    let testTherapyService: any;
    let reportToDelete: any;

    // Set up test data
    beforeAll(async () => {
        // Create user with VIEW_REPORTS permission
        adminUser = await createTestUserWithPermissions(['VIEW_REPORTS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        // Create a school
        school = await createTestSchool('Test School');

        // Create a student
        testStudent = await prisma.student.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(),
                gradeLevel: faker.number.int({min: 1, max: 12}),
                schoolId: school.id,
                parentId: regularUser.id,
                studentCode: faker.string.alphanumeric(8),
                status: 'ACTIVE',
                confirmationStatus: 'CONFIRMED',
            }
        });

        // Create therapy service with this student
        testTherapyService = await createTestTherapyService({
            studentId: testStudent.id
        });

        // Create a report to delete
        reportToDelete = await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.ATTENDANCE,
                content: faker.lorem.paragraphs(3),
            }
        });
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should delete a report when requester has VIEW_REPORTS permission', async ({expect}) => {
        const res = await request(app)
            .delete(`/reports/${reportToDelete.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(204);

        // Verify the report was soft deleted
        const deletedReport = await prisma.report.findUnique({
            where: {id: reportToDelete.id}
        });

        expect(deletedReport).not.toBeNull();
        expect(deletedReport?.deletedAt).not.toBeNull();
    });

    it('should return an error when user lacks VIEW_REPORTS permission', async ({expect}) => {
        // Create another report to attempt to delete
        const anotherReport = await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.ATTENDANCE,
                content: faker.lorem.paragraphs(3),
            }
        });

        const res = await request(app)
            .delete(`/reports/${anotherReport.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');

        // Verify report wasn't deleted
        const report = await prisma.report.findUnique({
            where: {id: anotherReport.id}
        });

        expect(report).not.toBeNull();
        expect(report?.deletedAt).toBeNull();
    });

    it('should return an error when report ID does not exist', async ({expect}) => {
        const nonExistingId = faker.string.uuid();

        const res = await request(app)
            .delete(`/reports/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Report not found.');
    });

    it('should record an activity log entry when a report is deleted', async ({expect}) => {
        // Create a report to delete
        const reportForActivity = await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.PROGRESS,
                content: faker.lorem.paragraphs(3),
            }
        });

        await request(app)
            .delete(`/reports/${reportForActivity.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`);

        // Wait up to 5 seconds for the activity log to be created
        const startTime = Date.now();
        const timeoutMs = 5000; // 5 seconds
        let activityLog = null;

        while (Date.now() - startTime < timeoutMs) {
            // Try to find the activity log
            activityLog = await prisma.activityLog.findFirst({
                where: {
                    action: 'DELETE_REPORT',
                    subjectId: reportForActivity.id,
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
        expect(activityLog?.subjectId).toBe(reportForActivity.id);
        expect(activityLog?.userId).toBe(adminUser.id);
    });
});
