import { vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { getTestPrisma, disconnectTestDb } from './utils/database';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Set environment variables for tests
vi.stubEnv("AUTH_SECRET", "authsecret");
vi.stubEnv("BCRYPT_ROUNDS", "1");
vi.stubEnv("TEST_DATABASE_URL", "postgresql://admin:password@test-database.sd-rsm-project.orb.local:15433/test_database");
vi.stubEnv("DATABASE_URL", "postgresql://admin:password@database.sd-rsm-project.orb.local:15432/my_database");

/**
 * Check database connection before running tests
 *
 * @returns {Promise<boolean>} - Returns true if connection is successful
 */
async function checkDatabaseConnection() {
    const prisma = getTestPrisma();

    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        return false;
    }
}

// Use a file-based flag that persists across all test files
const migrationFlagPath = path.join(__dirname, '.migrations-applied');

// Check if migrations have already been applied
const isMigrationApplied = () => {
    return fs.existsSync(migrationFlagPath);
};

// Mark migrations as applied
const markMigrationApplied = () => {
    fs.writeFileSync(migrationFlagPath, new Date().toISOString());
};

beforeAll(async () => {
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
        throw new Error('Cannot run tests: Database connection failed');
    }

    // Only run migrations once when tests start
    if (!isMigrationApplied()) {
        console.log("Resetting test database...");

        // Get the Prisma client
        const prisma = getTestPrisma();

        try {
            // Drop and recreate the public schema to completely reset everything
            await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
            await prisma.$executeRawUnsafe('CREATE SCHEMA public');

            // Disconnect to ensure clean connection after schema reset
            await disconnectTestDb();

            console.log("Running migrations on clean database...");

            execSync('npx prisma migrate deploy', {
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.TEST_DATABASE_URL
                },
                stdio: 'inherit'
            });

            execSync('npx prisma generate', {
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.TEST_DATABASE_URL
                },
                stdio: 'inherit'
            });

            execSync('ts-node prisma/seeders/seed.ts', {
                env: {
                    ...process.env,
                    DATABASE_URL: process.env.TEST_DATABASE_URL
                },
                stdio: 'inherit'
            });

            // Create flag file to mark migrations as applied
            markMigrationApplied();
        } catch (error) {
            console.error("Error resetting database:", error);
            throw error;
        }
    }

    // Start transaction once at the beginning of all tests
    const prisma = getTestPrisma();
    await prisma.$executeRaw`BEGIN`;
});

afterAll(async () => {
    // Rollback the transaction at the end of all tests
    const prisma = getTestPrisma();
    await prisma.$executeRaw`ROLLBACK`;

    await disconnectTestDb();
});

// Delete the migration flag file when process exits
process.on('exit', () => {
    if (isMigrationApplied()) {
        try {
            fs.unlinkSync(migrationFlagPath);
        } catch (err) {
            // Ignore errors on cleanup
        }
    }
});
