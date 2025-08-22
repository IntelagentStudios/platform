/**
 * Next.js App Router Middleware for Tenant Isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantManager } from '../tenant-manager';
import { cookies } from 'next/headers';
import * as jose from 'jose';

interface TenantInfo {
  licenseKey: string;
  schemaName: string;
  products: string[];
  isPro: boolean;
  userId?: string;
  userRole?: string;
}

/**
 * Extract tenant info from Next.js request
 */
export async function extractTenantInfo(request: NextRequest): Promise<TenantInfo | null> {
  // Try to get from cookie
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  if (authToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jose.jwtVerify(authToken, secret);
      
      if (payload.licenseKey) {
        const tenantManager = getTenantManager();
        const config = await tenantManager.getTenantConfig(payload.licenseKey as string);
        
        if (config) {
          return {
            licenseKey: config.licenseKey,
            schemaName: config.schemaName,
            products: config.products,
            isPro: config.isPro,
            userId: payload.userId as string,
            userRole: payload.role as string
          };
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }

  // Try API key from header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && apiKey.startsWith('intl_')) {
    const licenseKey = apiKey.split('_').slice(0, 4).join('_');
    const tenantManager = getTenantManager();
    const config = await tenantManager.getTenantConfig(licenseKey);
    
    if (config) {
      return {
        licenseKey: config.licenseKey,
        schemaName: config.schemaName,
        products: config.products,
        isPro: config.isPro
      };
    }
  }

  return null;
}

/**
 * Get tenant-specific Prisma client for server components
 */
export async function getTenantDb(licenseKey?: string) {
  // If no license key provided, try to extract from context
  if (!licenseKey) {
    const { cookies: cookieStore } = await import('next/headers');
    const authToken = cookieStore().get('auth_token')?.value;
    
    if (authToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jose.jwtVerify(authToken, secret);
        licenseKey = payload.licenseKey as string;
      } catch {
        throw new Error('Invalid authentication token');
      }
    }
  }

  if (!licenseKey) {
    throw new Error('No license key available');
  }

  const tenantManager = getTenantManager();
  const db = await tenantManager.getTenantConnection(licenseKey);
  
  if (!db) {
    throw new Error('Failed to establish tenant connection');
  }

  return db;
}

/**
 * Server action wrapper with tenant context
 */
export function withTenant<T extends (...args: any[]) => any>(
  handler: (tenant: TenantInfo, ...args: Parameters<T>) => ReturnType<T>
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const { cookies: cookieStore } = await import('next/headers');
    const authToken = cookieStore().get('auth_token')?.value;
    
    if (!authToken) {
      throw new Error('Authentication required');
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload } = await jose.jwtVerify(authToken, secret);
      
      const tenantManager = getTenantManager();
      const config = await tenantManager.getTenantConfig(payload.licenseKey as string);
      
      if (!config) {
        throw new Error('Invalid or inactive license');
      }

      const tenant: TenantInfo = {
        licenseKey: config.licenseKey,
        schemaName: config.schemaName,
        products: config.products,
        isPro: config.isPro,
        userId: payload.userId as string,
        userRole: payload.role as string
      };

      return handler(tenant, ...args);
    } catch (error) {
      console.error('Tenant validation failed:', error);
      throw new Error('Failed to validate tenant');
    }
  };
}

/**
 * Product access guard for server components
 */
export async function requireProduct(product: string): Promise<void> {
  const { cookies: cookieStore } = await import('next/headers');
  const authToken = cookieStore().get('auth_token')?.value;
  
  if (!authToken) {
    throw new Error('Authentication required');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(authToken, secret);
    
    const tenantManager = getTenantManager();
    const config = await tenantManager.getTenantConfig(payload.licenseKey as string);
    
    if (!config) {
      throw new Error('Invalid license');
    }

    if (!config.products.includes(product)) {
      throw new Error(`Product '${product}' not included in license`);
    }
  } catch (error) {
    console.error('Product access check failed:', error);
    throw error;
  }
}

/**
 * Pro features guard for server components
 */
export async function requirePro(): Promise<void> {
  const { cookies: cookieStore } = await import('next/headers');
  const authToken = cookieStore().get('auth_token')?.value;
  
  if (!authToken) {
    throw new Error('Authentication required');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(authToken, secret);
    
    const tenantManager = getTenantManager();
    const config = await tenantManager.getTenantConfig(payload.licenseKey as string);
    
    if (!config) {
      throw new Error('Invalid license');
    }

    if (!config.isPro) {
      throw new Error('Pro subscription required');
    }
  } catch (error) {
    console.error('Pro access check failed:', error);
    throw error;
  }
}

/**
 * Admin access helper for admin portal
 */
export async function getAdminDb() {
  const { cookies: cookieStore } = await import('next/headers');
  const adminToken = cookieStore().get('admin_token')?.value;
  
  if (!adminToken) {
    throw new Error('Admin authentication required');
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
    const { payload } = await jose.jwtVerify(adminToken, secret);
    
    if (!['super_admin', 'admin', 'support'].includes(payload.role as string)) {
      throw new Error('Insufficient admin permissions');
    }

    const tenantManager = getTenantManager();
    return tenantManager.getAdminConnection();
  } catch (error) {
    console.error('Admin authentication failed:', error);
    throw new Error('Invalid admin credentials');
  }
}

/**
 * Hook for client components to get tenant info
 */
export function useTenant(): TenantInfo | null {
  // This would be implemented as a React hook using context
  // For now, returning null as placeholder
  console.warn('useTenant hook not yet implemented for client components');
  return null;
}

/**
 * Middleware for edge runtime (middleware.ts)
 */
export async function tenantEdgeMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip public paths
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/_next',
    '/favicon.ico'
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for tenant context
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (!authToken) {
    // Redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(authToken, secret);
    
    // Validate license is still active
    const licenseKey = payload.licenseKey as string;
    
    // For edge runtime, we can't directly access database
    // Would need to call an API endpoint to validate
    // For now, just check token is valid
    
    // Add tenant info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-license', licenseKey);
    requestHeaders.set('x-tenant-user', payload.userId as string);
    requestHeaders.set('x-tenant-role', payload.role as string || 'member');

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  } catch (error) {
    // Invalid token, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    
    const response = NextResponse.redirect(url);
    response.cookies.delete('auth_token');
    
    return response;
  }
}

export { TenantInfo };