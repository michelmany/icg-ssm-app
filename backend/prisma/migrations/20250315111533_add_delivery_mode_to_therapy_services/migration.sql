/*
  Warnings:

  - Added the required column `deliveryMode` to the `TherapyService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceBeginDate` to the `TherapyService` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TherapyDeliveryMode" AS ENUM ('VIRTUAL', 'IN_PERSON');

-- AlterTable
ALTER TABLE "TherapyService" ADD COLUMN     "deliveryMode" "TherapyDeliveryMode" NOT NULL,
ADD COLUMN     "serviceBeginDate" TIMESTAMP(3) NOT NULL;
