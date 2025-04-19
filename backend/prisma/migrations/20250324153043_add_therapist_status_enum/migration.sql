-- Step 0: Create the enum type
CREATE TYPE "TherapistStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- Step 1: Alter the column to use the enum (assumes it exists as TEXT or similar)
ALTER TABLE "Therapist"
ALTER COLUMN "status" TYPE "TherapistStatus"
USING "status"::text::"TherapistStatus";

-- Step 2: Populate existing NULL values
UPDATE "Therapist"
SET "status" = 'ACTIVE'
WHERE "status" IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE "Therapist"
ALTER COLUMN "status" SET NOT NULL;
