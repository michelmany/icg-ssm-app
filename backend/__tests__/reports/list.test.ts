import request from 'supertest';
import {describe, it, beforeAll, afterAll} from 'vitest';
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
import {TherapyServices} from "../../src/therapy-services";

const prisma = new PrismaClient();

describe.concurrent('GET /reports', () => {
    let adminUser: TestUser;
    let regularUser: TestUser;
    let testStudent: any;
    let parentUser: TestUser;
    let school: TestSchool;
    let testTherapyService: any;
    let testReports: any[] = [];

    // Set up test data
    beforeAll(async () => {
        // Create user with VIEW_REPORTS permission
        adminUser = await createTestUserWithPermissions(['VIEW_REPORTS']);

        // Create user without any permissions
        regularUser = await createTestUserWithPermissions([]);

        parentUser = await createTestUserWithPermissions([]);

        school = await createTestSchool('Test School');

        const studentFirstName = faker.person.firstName();
        const studentLastName = faker.person.lastName();

        testStudent = await prisma.student.create({
            data: {
                firstName: studentFirstName,
                lastName: studentLastName,
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

        // Create multiple reports for testing filters
        const reportTypes = [ReportType.ATTENDANCE, ReportType.PROGRESS];

        for (const reportType of reportTypes) {
            const report = await prisma.report.create({
                data: {
                    schoolId: school.id,
                    studentId: testStudent.id,
                    therapyServiceId: testTherapyService.id,
                    reportType: reportType,
                    content: faker.lorem.paragraphs(3),
                }
            });
            testReports.push(report);
        }
    });

    // Clean up after tests
    afterAll(async () => {
        await TestDataRegistry.cleanup();
        await prisma.$disconnect();
    });

    it('should allow access when user has VIEW_REPORTS permission', async ({expect}) => {
        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return an error when user lacks VIEW_REPORTS permission', async ({expect}) => {
        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${regularUser.token}`)
            .query({perPage: 10, page: 1});

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message');
    });

    it('should filter reports by reportType', async ({expect}) => {
        const reportType = ReportType.ATTENDANCE;

        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({reportType, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every((r: { reportType: ReportType }) => r.reportType === reportType)).toBe(true);
    });

    it('should filter reports by school name', async ({expect}) => {
        const schoolName = school.name;

        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({schoolName, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every((r: any) => r.school.name.toLowerCase().includes(schoolName.toLowerCase()))).toBe(true);
    });

    it('should filter reports by student name', async ({expect}) => {
        const studentName = testStudent.lastName;

        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({studentName, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.some((r: any) =>
            r.student.firstName.toLowerCase().includes(studentName.toLowerCase()) ||
            r.student.lastName.toLowerCase().includes(studentName.toLowerCase()))).toBe(true);
    });

    it('should filter reports by therapy service type', async ({expect}) => {
        // Create a therapy service with specific type
        const serviceType = TherapyServices.ServiceType.SPEECH;
        const therapyService = await createTestTherapyService({
            studentId: testStudent.id,
            serviceType: serviceType
        });

        // Create report with this therapy service
        await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: therapyService.id,
                reportType: ReportType.BILLING,
                content: faker.lorem.paragraphs(1),
            }
        });

        // Test filtering by service type
        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({therapyServiceType: serviceType, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Check that filtered reports have therapy services with the right type
        const matchingReports = res.body.data.filter((r: any) =>
            r.therapyService && r.therapyService.serviceType === serviceType
        );
        expect(matchingReports.length).toBeGreaterThan(0);
    });

    it('should sort reports by school name', async ({expect}) => {
        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({sortBy: 'schoolName', sortOrder: 'asc', perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Verify ascending order of school names
        const schoolNames = res.body.data.map((r: any) => r.school.name.toLowerCase());
        const sortedSchoolNames = [...schoolNames].sort();
        expect(schoolNames).toEqual(sortedSchoolNames);
    });

    it('should sort reports by student name', async ({expect}) => {
        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({sortBy: 'studentName', sortOrder: 'asc', perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Verify ascending order of student last names
        const studentNames = res.body.data.map((r: any) => r.student.lastName.toLowerCase());
        const sortedStudentNames = [...studentNames].sort();
        expect(studentNames).toEqual(sortedStudentNames);
    });

    it('should combine multiple filters', async ({expect}) => {
        const reportType = ReportType.ATTENDANCE;
        const schoolName = school.name;

        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({reportType, schoolName, perPage: 10, page: 1});

        expect(res.status).toBe(200);
        expect(res.body.data.every((r: { reportType: ReportType; school: { name: string } }) =>
            r.reportType === reportType && r.school.name === schoolName)).toBe(true);
    });

    it('should filter reports by createdAt', async ({expect}) => {
        // Create a report with a specific date
        const specificDate = new Date();

        const newReport = await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.PROGRESS,
                content: faker.lorem.paragraphs(2),
                createdAt: specificDate
            }
        });

        // Format date as ISO string for query
        const dateString = specificDate.toISOString();

        const res = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                createdAt: dateString,
                perPage: 10,
                page: 1
            });

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Check the returned reports have the matching createdAt date
        // We need to compare dates by converting them to the same format
        const matchingReports = res.body.data.filter((r: any) => {
            const reportDate = new Date(r.createdAt);
            return reportDate.toISOString().split('T')[0] === specificDate.toISOString().split('T')[0];
        });

        expect(matchingReports.length).toBeGreaterThan(0);
    });

    it('should sort reports by createdAt', async ({expect}) => {
        // Create reports with different creation dates
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 10);

        const newDate = new Date();

        // Create report with older date
        await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.BILLING,
                content: faker.lorem.paragraphs(1),
                createdAt: oldDate
            }
        });

        // Create report with newer date
        await prisma.report.create({
            data: {
                schoolId: school.id,
                studentId: testStudent.id,
                therapyServiceId: testTherapyService.id,
                reportType: ReportType.ATTENDANCE,
                content: faker.lorem.paragraphs(1),
                createdAt: newDate
            }
        });

        // Test ascending order
        const ascRes = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                sortBy: 'createdAt',
                sortOrder: 'asc',
                perPage: 20,
                page: 1
            });

        expect(ascRes.status).toBe(200);
        expect(ascRes.body.data.length).toBeGreaterThan(1);

        // Verify ascending order of creation dates
        const dates = ascRes.body.data.map((r: any) => new Date(r.createdAt).getTime());
        const sortedDates = [...dates].sort((a, b) => a - b);
        expect(dates).toEqual(sortedDates);

        // Test descending order
        const descRes = await request(app)
            .get('/reports')
            .set('Authorization', `Bearer ${adminUser.token}`)
            .query({
                sortBy: 'createdAt',
                sortOrder: 'desc',
                perPage: 20,
                page: 1
            });

        expect(descRes.status).toBe(200);

        // Verify descending order of creation dates
        const descDates = descRes.body.data.map((r: any) => new Date(r.createdAt).getTime());
        const descSortedDates = [...descDates].sort((a, b) => b - a);
        expect(descDates).toEqual(descSortedDates);
    });
});
