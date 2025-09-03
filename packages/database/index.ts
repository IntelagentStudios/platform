// Build-safe Prisma exports
let PrismaClient: any;
let prismaInstance: any;

const globalForPrisma = global as unknown as { prisma: any };

// Check if we're in build mode
const isBuildMode = process.env.BUILDING === 'true' || process.env.NEXT_PHASE === 'phase-production-build';

if (!isBuildMode) {
  try {
    // Only import PrismaClient when not building
    const prismaModule = require('@prisma/client');
    PrismaClient = prismaModule.PrismaClient;
    
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    prismaInstance = globalForPrisma.prisma;
  } catch (error) {
    console.warn('Failed to initialize Prisma Client:', error);
    // Fall back to dummy during errors
    prismaInstance = new Proxy({}, {
      get() {
        return () => Promise.resolve({});
      }
    });
    PrismaClient = class PrismaClient {};
  }
} else {
  // During build, create a comprehensive mock
  const mockHandler = {
    get(target: any, prop: string): any {
      // Return a function that returns a promise for any property access
      return new Proxy(() => {}, {
        get() {
          return mockHandler.get(target, prop);
        },
        apply() {
          return Promise.resolve({
            findUnique: () => Promise.resolve(null),
            findFirst: () => Promise.resolve(null),
            findMany: () => Promise.resolve([]),
            create: () => Promise.resolve({}),
            update: () => Promise.resolve({}),
            delete: () => Promise.resolve({}),
            count: () => Promise.resolve(0),
            aggregate: () => Promise.resolve({}),
            groupBy: () => Promise.resolve([])
          });
        }
      });
    }
  };
  
  prismaInstance = new Proxy({}, mockHandler);
  PrismaClient = class PrismaClient {
    constructor() {
      return new Proxy({}, mockHandler);
    }
  };
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