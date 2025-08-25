import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

// Cache the Prisma client in both development and production to prevent connection exhaustion
globalForPrisma.prisma = prisma;

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';

// Export tenant manager if it exists
export { getTenantManager, TenantManager } from './src/tenant-manager';
export type { TenantConfig } from './src/tenant-manager';

// Export admin DB helper
export const getAdminDb = async () => prisma;