import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Standard Prisma singleton pattern for Next.js
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Always cache in production too to prevent connection exhaustion
if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';

// Export tenant manager if it exists
export { getTenantManager, TenantManager } from './src/tenant-manager';
export type { TenantConfig } from './src/tenant-manager';

// Export admin DB helper
export const getAdminDb = async () => prisma;