/**
 * Database Package - Multi-tenant Architecture
 * Centralized database access with tenant isolation
 */

import { PrismaClient } from '@prisma/client';

// Export tenant management
export { getTenantManager, TenantManager, TenantConfig } from './tenant-manager';

// Export middleware
export {
  tenantMiddleware,
  adminMiddleware,
  requireProduct,
  requirePro,
  requireRole,
  TenantContext
} from './middleware/tenant-middleware';

// Export Next.js specific helpers
export {
  extractTenantInfo,
  getTenantDb,
  withTenant,
  getAdminDb,
  tenantEdgeMiddleware,
  useTenant,
  TenantInfo
} from './middleware/nextjs-tenant';

// Legacy singleton for backward compatibility (public schema only)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use the local DATABASE_URL as fallback for production
const databaseUrl = process.env.DATABASE_URL || 
  'postgresql://postgres:tZtE5VGf9CGhCOXx2pUS@centerbeam.proxy.rlwy.net:34807/railway';

// Check for DATABASE_URL before initializing
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Please configure your database connection.');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export Prisma types
export * from '@prisma/client';