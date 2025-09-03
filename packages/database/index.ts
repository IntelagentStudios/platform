// Conditionally import PrismaClient to avoid build-time issues
let PrismaClient: any;
let prismaInstance: any;

const globalForPrisma = global as unknown as { prisma: any };

if (process.env.BUILDING !== 'true') {
  // Only import PrismaClient when not building
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prismaInstance = globalForPrisma.prisma;
} else {
  // During build, export a dummy object
  prismaInstance = new Proxy({}, {
    get() {
      return () => Promise.resolve({});
    }
  });
  // Also export dummy PrismaClient
  PrismaClient = class PrismaClient {};
}

export { PrismaClient };
export const prisma = prismaInstance;

// Re-export types only (these don't cause initialization)
export type * from '@prisma/client';

// Export tenant manager if it exists
export { getTenantManager, TenantManager } from './src/tenant-manager';
export type { TenantConfig } from './src/tenant-manager';

// Export admin DB helper
export const getAdminDb = async () => prismaInstance;