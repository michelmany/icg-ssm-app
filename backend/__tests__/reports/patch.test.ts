import request from 'supertest';
import {describe, expect, it, beforeAll, afterAll} from 'vitest';
import app from '../../src/api/app';
import {PrismaClient, ReportType} from '@prisma/client';
import {
    createTestUserWithPermissions,
    TestUser,
    createTestSchool,
    TestSchool,
    TestDataRegistry,
    createTestTherapyService
} from '../utils/helpers';
import {faker} from '@faker-js/faker';

const prisma = new PrismaClient();

describe.concurrent('PATCH /reports/:id', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let school: TestSchool;
    let testStudent: any;
    let testTherapyService: any;
    let reportToUpdate: any;

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

        // Create a report to update in tests
        reportToUpdate = await prisma.report.create({
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

    it('should update a report when requester has VIEW_REPORTS permission', async ({expect}) => {
        const updateData = {
            reportType: ReportType.PROGRESS,
            content: "Updated report content",
        };

        const res = await request(app)
            .patch(`/reports/${reportToUpdate.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify the report was updated
        const updatedReport = await prisma.report.findUnique({
            where: {id: reportToUpdate.id}
        });

        expect(updatedReport).not.toBeNull();
        expect(updatedReport?.reportType).toBe(updateData.reportType);
        expect(updatedReport?.content).toBe(updateData.content);
    });

    it('should return an error when user lacks VIEW_REPORTS permission', async ({expect}) => {
        const updateData = {
            reportType: ReportType.BILLING,
        };

        const res = await request(app)
            .patch(`/reports/${reportToUpdate.id}`)
            .set('Authorization', `Bearer ${regularUser.token}`)
            .send(updateData);

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should return an error when report ID does not exist', async ({expect}) => {
        const nonExistingId = '00000000-0000-0000-0000-000000000000';

        const res = await request(app)
            .patch(`/reports/${nonExistingId}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send({reportType: ReportType.BILLING});

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Report not found.');
    });

    it('should update only provided fields', async ({expect}) => {
        const anotherReport = await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.ATTENDANCE,
                content: faker.lorem.paragraphs(3),
            }
        });

        const originalReport = await prisma.report.findUnique({
            where: {id: anotherReport.id}
        });

        const updateData = {
            reportType: ReportType.ELIGIBILITY,
            // Only updating reportType
        };

        const res = await request(app)
            .patch(`/reports/${anotherReport.id}`)
            .set('Authorization', `Bearer ${adminUser.token}`)
            .send(updateData);

        expect(res.status).toBe(204);

        // Verify only reportType was updated
        const updatedReport = await prisma.report.findUnique({
            where: {id: anotherReport.id}
        });

        expect(updatedReport).not.toBeNull();
        expect(updatedReport?.reportType).toBe(updateData.reportType);
        expect(updatedReport?.content).toBe(originalReport?.content);
        expect(updatedReport?.schoolId).toBe(originalReport?.schoolId);
        expect(updatedReport?.studentId).toBe(originalReport?.studentId);
    });
});
