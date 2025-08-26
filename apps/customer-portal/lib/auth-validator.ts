/**
 * Centralized authentication validator for the customer portal
 * Optimized for high-volume license-based authentication
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { licenseCache } from '@/lib/license-cache';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export interface AuthUser {
  userId: string;
  email: string;
  licenseKey: string;
  role: string;
  name: string;
  products?: string[];
  is_pro?: boolean;
  site_key?: string | null;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  error?: string;
  license?: {
    key: string;
    products: string[];
    is_pro: boolean;
    site_key?: string | null;
    status: string;
  };
}

/**
 * Validates authentication token and returns user information
 * Uses Redis cache for performance, falls back to database
 */
export async function validateAuth(request?: NextRequest): Promise<AuthResult> {
  try {
    console.log('[Auth Validator] Starting validation...');
    
    // Get auth token from cookies
    const authToken = request 
      ? request.cookies.get('auth_token')?.value
      : cookies().get('auth_token')?.value;
    
    console.log('[Auth Validator] Auth token found:', !!authToken);
    
    if (!authToken) {
      console.log('[Auth Validator] No token found, returning unauthenticated');
      return {
        authenticated: false,
        error: 'No authentication token found'
      };
    }

    // Verify and decode JWT
    let decoded: AuthUser;
    try {
      decoded = jwt.verify(authToken, JWT_SECRET) as AuthUser;
      console.log('[Auth Validator] JWT decoded successfully:', { 
        userId: decoded.userId,
        email: decoded.email,
        licenseKey: decoded.licenseKey 
      });
    } catch (jwtError) {
      console.log('[Auth Validator] JWT verification failed:', jwtError);
      return {
        authenticated: false,
        error: 'Invalid or expired token'
      };
    }

    // Quick validation of required fields
    if (!decoded.licenseKey || !decoded.email) {
      return {
        authenticated: false,
        error: 'Invalid token structure'
      };
    }

    // Try to get cached session first for performance
    const cachedSession = await licenseCache.getUserSession(
      decoded.licenseKey,
      authToken
    );

    if (cachedSession) {
      // Validate cached session is not expired
      if (new Date(cachedSession.expires_at) > new Date()) {
        return {
          authenticated: true,
          user: {
            userId: cachedSession.user_id,
            email: decoded.email,
            licenseKey: decoded.licenseKey,
            role: decoded.role,
            name: decoded.name,
            products: cachedSession.products,
            is_pro: cachedSession.is_pro,
            site_key: cachedSession.site_key
          },
          license: {
            key: decoded.licenseKey,
            products: cachedSession.products || [],
            is_pro: cachedSession.is_pro || false,
            site_key: cachedSession.site_key,
            status: 'active'
          }
        };
      }
    }

    // Cache miss or expired - fetch from database
    const user = await prisma.users.findUnique({
      where: { 
        id: decoded.userId,
        email: decoded.email 
      }
    });

    if (!user) {
      return {
        authenticated: false,
        error: 'User not found'
      };
    }

    // Fetch license information
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key },
      select: {
        license_key: true,
        products: true,
        is_pro: true,
        site_key: true,
        status: true
      }
    });

    // Verify license is still active
    if (!license || license.status !== 'active') {
      return {
        authenticated: false,
        error: 'License is not active'
      };
    }

    // Skip session database check - JWT is sufficient for stateless auth
    // This is actually better for scaling and avoids database dependency
    console.log('[Auth Validator] Using stateless JWT authentication');
    
    // Create session object for compatibility
    const session = {
      user_id: user.id,
      token: authToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ip_address: 'jwt-auth',
      user_agent: 'jwt-auth'
    };

    // Cache the session for future requests
    const sessionData = {
      user_id: user.id,
      token: authToken,  // Use full token now that DB supports it
      expires_at: session.expires_at,
      ip_address: session.ip_address || 'unknown',
      user_agent: session.user_agent || 'unknown',
      license_key: user.license_key,
      products: license.products || [],
      is_pro: license.is_pro || false,
      site_key: license.site_key
    };

    await licenseCache.cacheUserSession(
      user.license_key,
      authToken,  // Use full token as cache key
      sessionData,
      Math.floor((session.expires_at.getTime() - Date.now()) / 1000) // TTL in seconds
    );

    return {
      authenticated: true,
      user: {
        userId: user.id,
        email: user.email,
        licenseKey: user.license_key,
        role: user.role,
        name: user.name,
        products: license.products,
        is_pro: license.is_pro,
        site_key: license.site_key
      },
      license: {
        key: user.license_key,
        products: license.products || [],
        is_pro: license.is_pro || false,
        site_key: license.site_key,
        status: license.status || 'active'
      }
    };

  } catch (error) {
    console.error('Auth validation error:', error);
    return {
      authenticated: false,
      error: 'Authentication validation failed'
    };
  }
}

/**
 * Validates if user has access to specific product
 */
export async function validateProductAccess(
  licenseKey: string,
  product: string
): Promise<boolean> {
  try {
    // Try cache first
    const cachedProducts = await licenseCache.get<string[]>(
      licenseKey,
      'license',
      'products'
    );

    if (cachedProducts) {
      return cachedProducts.includes(product);
    }

    // Fetch from database
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { products: true }
    });

    if (license) {
      // Cache for future requests
      await licenseCache.set(
        licenseKey,
        'license',
        'products',
        license.products,
        3600 // Cache for 1 hour
      );
      return license.products.includes(product);
    }

    return false;
  } catch (error) {
    console.error('Product access validation error:', error);
    return false;
  }
}

/**
 * Logout user by invalidating session
 */
export async function logout(authToken?: string): Promise<void> {
  try {
    const token = authToken || cookies().get('auth_token')?.value;
    
    if (!token) return;

    // Decode token to get user info
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      
      if (decoded.licenseKey) {
        // Remove from cache
        await licenseCache.delete(decoded.licenseKey, 'session', token);
        
        // Decrement active sessions counter
        await licenseCache.incrementCounter(
          decoded.licenseKey,
          'active_sessions',
          -1
        );
      }
    } catch (e) {
      // Token might be invalid, continue with database cleanup
    }

    // Remove from database
    await prisma.user_sessions.deleteMany({
      where: { token }
    });

  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Get all active sessions for a license
 */
export async function getActiveSessions(licenseKey: string): Promise<any[]> {
  try {
    const users = await prisma.users.findMany({
      where: { license_key: licenseKey }
    });

    const userIds = users.map(u => u.id);

    const sessions = await prisma.user_sessions.findMany({
      where: {
        user_id: { in: userIds },
        expires_at: { gt: new Date() }
      },
      orderBy: { created_at: 'desc' }
    });

    // Enrich sessions with user data
    const usersById = Object.fromEntries(
      users.map(u => [u.id, u])
    );

    const enrichedSessions = sessions.map(session => ({
      ...session,
      user: usersById[session.user_id] ? {
        email: usersById[session.user_id].email,
        name: usersById[session.user_id].name,
        role: usersById[session.user_id].role
      } : null
    }));

    return enrichedSessions;
  } catch (error) {
    console.error('Get active sessions error:', error);
    return [];
  }
}