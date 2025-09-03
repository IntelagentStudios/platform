import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let prismaInstance: PrismaClient | undefined;

// Only initialize Prisma if we're not in a build environment
if (process.env.BUILDING !== 'true') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prismaInstance = globalForPrisma.prisma;
} else {
  // During build, export a dummy object that won't cause initialization errors
  prismaInstance = {} as PrismaClient;
}

export const prisma = prismaInstance;

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';

// Export tenant manager if it exists
export { getTenantManager, TenantManager } from './src/tenant-manager';
export type { TenantConfig } from './src/tenant-manager';

// Export admin DB helper
export const getAdminDb = async () => prismaInstance;