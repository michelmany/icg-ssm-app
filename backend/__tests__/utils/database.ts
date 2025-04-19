import { PrismaClient } from '@prisma/client';

// Custom Prisma client for test database
let testPrisma: PrismaClient | null = null;

/**
 * Get a Prisma client connected to the test database
 */
export function getTestPrisma() {
    if (!testPrisma) {
        // Initialize with test database URL
        testPrisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.TEST_DATABASE_URL,
                }
            }
        });
    }
    
    return testPrisma;
}

/**
 * Close the test database connection
 */
export async function disconnectTestDb() {
    if (testPrisma) {
        await testPrisma.$disconnect();
        testPrisma = null;
    }
}