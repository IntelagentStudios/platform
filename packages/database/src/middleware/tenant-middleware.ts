/**
 * Tenant Middleware for Multi-tenant Applications
 * Handles tenant context extraction and database connection routing
 */

import { Request, Response, NextFunction } from 'express';
import { getTenantManager } from '../tenant-manager';
import jwt from 'jsonwebtoken';

interface TenantContext {
  licenseKey: string;
  userId?: string;
  userRole?: string;
  schemaName: string;
  products: string[];
  isPro: boolean;
  domain?: string;
}

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantDb?: any; // PrismaClient instance
    }
  }
}

/**
 * Extract license key from various sources
 */
function extractLicenseKey(req: Request): string | null {
  // 1. Check JWT token in cookies
  const token = req.cookies?.auth_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (decoded.licenseKey) {
        return decoded.licenseKey;
      }
    } catch (error) {
      console.error('Invalid JWT token:', error);
    }
  }

  // 2. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    // API keys should include license key prefix
    const parts = apiKey.split('_');
    if (parts.length >= 2 && parts[0] === 'intl') {
      return parts.slice(0, 4).join('_'); // intl_xxxx_xxxx_xxxx
    }
  }

  // 3. Check X-License-Key header (for API access)
  const licenseHeader = req.headers['x-license-key'] as string;
  if (licenseHeader) {
    return licenseHeader;
  }

  // 4. Check query parameter (for webhooks, SSE endpoints)
  if (req.query.license) {
    return req.query.license as string;
  }

  // 5. Check subdomain (for tenant-specific domains)
  const host = req.headers.host || '';
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    // Look up license by subdomain (would need a mapping table)
    // This is a placeholder - actual implementation would query database
    return null;
  }

  return null;
}

/**
 * Main tenant middleware
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract license key
    const licenseKey = extractLicenseKey(req);
    
    if (!licenseKey) {
      // Public endpoints don't require tenant context
      if (isPublicEndpoint(req.path)) {
        return next();
      }
      
      res.status(401).json({
        error: 'No license key provided',
        code: 'LICENSE_REQUIRED'
      });
      return;
    }

    // Get tenant manager
    const tenantManager = getTenantManager();

    // Validate license and get config
    const config = await tenantManager.getTenantConfig(licenseKey);
    
    if (!config) {
      res.status(403).json({
        error: 'Invalid or inactive license',
        code: 'LICENSE_INVALID'
      });
      return;
    }

    // Validate domain if locked
    const requestDomain = req.headers.origin || req.headers.referer || '';
    if (requestDomain) {
      const isValidDomain = await tenantManager.validateDomain(licenseKey, requestDomain);
      if (!isValidDomain) {
        res.status(403).json({
          error: 'Domain not authorized for this license',
          code: 'DOMAIN_UNAUTHORIZED'
        });
        return;
      }
    }

    // Get tenant-specific database connection
    const tenantDb = await tenantManager.getTenantConnection(licenseKey);
    
    if (!tenantDb) {
      res.status(500).json({
        error: 'Failed to establish database connection',
        code: 'DB_CONNECTION_FAILED'
      });
      return;
    }

    // Extract user info if available
    let userId: string | undefined;
    let userRole: string | undefined;
    
    const token = req.cookies?.auth_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
        userRole = decoded.role;
      } catch {
        // Token invalid but license is valid, continue
      }
    }

    // Set tenant context
    req.tenant = {
      licenseKey,
      userId,
      userRole,
      schemaName: config.schemaName,
      products: config.products,
      isPro: config.isPro,
      domain: config.domain
    };

    // Set tenant database connection
    req.tenantDb = tenantDb;

    // Log access for audit
    if (process.env.ENABLE_AUDIT === 'true') {
      logTenantAccess(req);
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Admin middleware - for admin portal only
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Verify admin authentication
    const token = req.cookies?.admin_token;
    if (!token) {
      res.status(401).json({
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;
      
      // Check if user has admin role
      if (!['super_admin', 'admin', 'support'].includes(decoded.role)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      // Get admin database connection
      const tenantManager = getTenantManager();
      const adminDb = await tenantManager.getAdminConnection();

      // Set admin context
      req.tenant = {
        licenseKey: 'ADMIN',
        userId: decoded.userId,
        userRole: decoded.role,
        schemaName: 'public',
        products: ['all'],
        isPro: true
      };

      req.tenantDb = adminDb;
      
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid admin token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

/**
 * Product access middleware - check if tenant has access to product
 */
export function requireProduct(product: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      res.status(401).json({
        error: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
      return;
    }

    if (!req.tenant.products.includes(product)) {
      res.status(403).json({
        error: `Product '${product}' not included in license`,
        code: 'PRODUCT_NOT_LICENSED',
        availableProducts: req.tenant.products
      });
      return;
    }

    next();
  };
}

/**
 * Pro features middleware
 */
export function requirePro(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenant) {
    res.status(401).json({
      error: 'Tenant context required',
      code: 'TENANT_REQUIRED'
    });
    return;
  }

  if (!req.tenant.isPro) {
    res.status(403).json({
      error: 'Pro subscription required for this feature',
      code: 'PRO_REQUIRED',
      upgradeUrl: '/upgrade'
    });
    return;
  }

  next();
}

/**
 * Role-based access control
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant || !req.tenant.userRole) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.tenant.userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        requiredRoles: roles,
        currentRole: req.tenant.userRole
      });
      return;
    }

    next();
  };
}

/**
 * Check if endpoint is public (no tenant required)
 */
function isPublicEndpoint(path: string): boolean {
  const publicPaths = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/verify-email',
    '/api/health',
    '/api/status',
    '/_next',
    '/static',
    '/favicon.ico'
  ];

  return publicPaths.some(p => path.startsWith(p));
}

/**
 * Log tenant access for audit trail
 */
async function logTenantAccess(req: Request): Promise<void> {
  if (!req.tenant) return;

  try {
    const tenantManager = getTenantManager();
    const adminDb = await tenantManager.getAdminConnection();

    await adminDb.audit_logs.create({
      data: {
        license_key: req.tenant.licenseKey,
        user_id: req.tenant.userId,
        action: `${req.method} ${req.path}`,
        resource_type: 'api_request',
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

export { TenantContext };