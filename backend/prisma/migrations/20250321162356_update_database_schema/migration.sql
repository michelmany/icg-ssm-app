/*
  Warnings:

  - You are about to drop the column `contactIds` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `contractIds` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `documentIds` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `accommodations` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTeacherIds` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTests` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Therapist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverType` to the `Communication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aacRequired` to the `TeacherService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryMode` to the `TeacherService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceDiscipline` to the `TeacherService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `TeacherService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Therapist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ServiceDiscipline" AS ENUM ('GENERAL', 'SPECIALIZED', 'INTENSIVE');

-- CreateEnum
CREATE TYPE "ReceiverType" AS ENUM ('USER', 'STUDENT');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Communication" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "receiverType" "ReceiverType" NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EquipmentReferral" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "contactIds",
DROP COLUMN "contractIds",
DROP COLUMN "documentIds";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "accommodations",
DROP COLUMN "assignedTeacherIds",
DROP COLUMN "assignedTests";

-- AlterTable
ALTER TABLE "TeacherService" ADD COLUMN     "aacRequired" BOOLEAN NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryMode" "TherapyDeliveryMode" NOT NULL,
ADD COLUMN     "serviceDiscipline" "ServiceDiscipline" NOT NULL,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL;

-- AlterTable
ALTER TABLE "Therapist" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StudentTeacher" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTestAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderDocument" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "ProviderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderContract" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,

    CONSTRAINT "ProviderContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderContact" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "ProviderContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Accommodation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Accommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAccommodation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "accommodationId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAccommodation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentTeacher_studentId_teacherId_key" ON "StudentTeacher"("studentId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTestAssignment_studentId_testId_key" ON "StudentTestAssignment"("studentId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderDocument_providerId_documentId_key" ON "ProviderDocument"("providerId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderContract_providerId_contractId_key" ON "ProviderContract"("providerId", "contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderContact_providerId_contactId_key" ON "ProviderContact"("providerId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAccommodation_studentId_accommodationId_key" ON "StudentAccommodation"("studentId", "accommodationId");

-- CreateIndex
CREATE INDEX "Communication_receiverId_receiverType_idx" ON "Communication"("receiverId", "receiverType");

-- CreateIndex
CREATE UNIQUE INDEX "Therapist_userId_key" ON "Therapist"("userId");

-- AddForeignKey
ALTER TABLE "StudentTeacher" ADD CONSTRAINT "StudentTeacher_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTeacher" ADD CONSTRAINT "StudentTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTestAssignment" ADD CONSTRAINT "StudentTestAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderDocument" ADD CONSTRAINT "ProviderDocument_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderDocument" ADD CONSTRAINT "ProviderDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderContract" ADD CONSTRAINT "ProviderContract_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderContract" ADD CONSTRAINT "ProviderContract_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderContact" ADD CONSTRAINT "ProviderContact_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderContact" ADD CONSTRAINT "ProviderContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Therapist" ADD CONSTRAINT "Therapist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAccommodation" ADD CONSTRAINT "StudentAccommodation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAccommodation" ADD CONSTRAINT "StudentAccommodation_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
