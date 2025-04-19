/*
  Warnings:

  - The values [PERFORMANCE,PARTICIPATION] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `receiverType` on the `Communication` table. All the data in the column will be lost.
  - You are about to drop the column `exportFormat` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `filterCriteria` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `generatedById` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `reportData` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `assignedProctorId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhone` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `User` table. All the data in the column will be lost.
  - The `roleHierarchy` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Site` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SiteEquipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SiteToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `therapyServiceId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'THERAPIST', 'PROVIDER', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "RoleHierarchy" AS ENUM ('ADMIN', 'TEACHER', 'THERAPIST', 'PROVIDER', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('SPEECH', 'OCCUPATIONAL', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "TherapyStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "ServiceFeeStructure" AS ENUM ('HOURLY', 'FLAT_RATE', 'PER_DIEM');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "TeacherServiceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PENDING');

-- CreateEnum
CREATE TYPE "EquipmentReferralStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'DECLINED');

-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('PROGRESS', 'ATTENDANCE', 'BILLING', 'ELIGIBILITY');
ALTER TABLE "Report" ALTER COLUMN "reportType" TYPE "ReportType_new" USING ("reportType"::text::"ReportType_new");
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "ReportType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_assignedSiteId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_testId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_testId_fkey";

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_assignedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_generatedById_fkey";

-- DropForeignKey
ALTER TABLE "SiteEquipment" DROP CONSTRAINT "SiteEquipment_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "SiteEquipment" DROP CONSTRAINT "SiteEquipment_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_assignedProctorId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_bundledTestId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "UserToken" DROP CONSTRAINT "UserToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "_SiteToUser" DROP CONSTRAINT "_SiteToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SiteToUser" DROP CONSTRAINT "_SiteToUser_B_fkey";

-- DropIndex
DROP INDEX "Communication_receiverId_receiverType_idx";

-- AlterTable
ALTER TABLE "Communication" DROP COLUMN "receiverType",
ADD COLUMN     "readTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "exportFormat",
DROP COLUMN "filterCriteria",
DROP COLUMN "generatedById",
DROP COLUMN "reportData",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "therapyServiceId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "School" DROP COLUMN "deletedAt",
ALTER COLUMN "maxTravelDistance" DROP NOT NULL,
ALTER COLUMN "maxStudentsPerTest" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "assignedProctorId",
DROP COLUMN "deletedAt",
DROP COLUMN "parentPhone",
ADD COLUMN     "assignedTeacherIds" TEXT[],
ALTER COLUMN "parentId" DROP NOT NULL,
ALTER COLUMN "accommodations" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt",
ADD COLUMN     "permissions" JSONB,
ADD COLUMN     "role" "UserRole" NOT NULL,
DROP COLUMN "roleHierarchy",
ADD COLUMN     "roleHierarchy" "RoleHierarchy",
ALTER COLUMN "schoolId" DROP NOT NULL,
ALTER COLUMN "securityLevel" DROP NOT NULL;

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "Assignment";

-- DropTable
DROP TABLE "Attendance";

-- DropTable
DROP TABLE "Equipment";

-- DropTable
DROP TABLE "Site";

-- DropTable
DROP TABLE "SiteEquipment";

-- DropTable
DROP TABLE "Test";

-- DropTable
DROP TABLE "UserToken";

-- DropTable
DROP TABLE "_SiteToUser";

-- DropEnum
DROP TYPE "AssignmentStatus";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "CheckInMethod";

-- DropEnum
DROP TYPE "ConfirmationMethod";

-- DropEnum
DROP TYPE "EquipmentStatus";

-- DropEnum
DROP TYPE "EquipmentType";

-- DropEnum
DROP TYPE "ExportFormat";

-- DropEnum
DROP TYPE "SiteEquipmentStatus";

-- DropEnum
DROP TYPE "Subject";

-- DropEnum
DROP TYPE "TestType";

-- DropEnum
DROP TYPE "UserTokenType";

-- CreateTable
CREATE TABLE "TherapyService" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "status" "TherapyStatus" NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "sessionNotes" TEXT NOT NULL,
    "goalTracking" JSONB,
    "ieps" JSONB,
    "nextMeetingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapyService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "signature" TEXT,
    "serviceFeeStructure" "ServiceFeeStructure" NOT NULL,
    "nssEnabled" BOOLEAN NOT NULL,
    "reviewNotes" JSONB NOT NULL,
    "status" "ProviderStatus" NOT NULL,
    "documentIds" TEXT[],
    "contractIds" TEXT[],
    "contactIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "therapyServiceId" TEXT NOT NULL,
    "progressNotes" TEXT NOT NULL,
    "status" "TeacherServiceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentReferral" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "equipmentNeeded" TEXT NOT NULL,
    "status" "EquipmentReferralStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "therapyServiceId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "dateIssued" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contract" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "cellPhone" TEXT NOT NULL,
    "workPhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Therapist" (
    "id" TEXT NOT NULL,
    "disciplines" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "medicaidNationalProviderId" INTEGER NOT NULL,
    "socialSecurity" TEXT NOT NULL,
    "stateMedicaidProviderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Therapist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- RenameForeignKey
ALTER TABLE "Communication" RENAME CONSTRAINT "Communication_studentReceiver_fkey" TO "Communication_StudentReceiver_FK";

-- RenameForeignKey
ALTER TABLE "Communication" RENAME CONSTRAINT "Communication_userReceiver_fkey" TO "Communication_UserReceiver_FK";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyService" ADD CONSTRAINT "TherapyService_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapyService" ADD CONSTRAINT "TherapyService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherService" ADD CONSTRAINT "TeacherService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherService" ADD CONSTRAINT "TeacherService_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherService" ADD CONSTRAINT "TeacherService_therapyServiceId_fkey" FOREIGN KEY ("therapyServiceId") REFERENCES "TherapyService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentReferral" ADD CONSTRAINT "EquipmentReferral_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentReferral" ADD CONSTRAINT "EquipmentReferral_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_therapyServiceId_fkey" FOREIGN KEY ("therapyServiceId") REFERENCES "TherapyService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_therapyServiceId_fkey" FOREIGN KEY ("therapyServiceId") REFERENCES "TherapyService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
