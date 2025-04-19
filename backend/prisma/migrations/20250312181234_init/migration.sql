-- AlterEnum
ALTER TYPE "ProviderStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "deletedAt" TIMESTAMP(3);
