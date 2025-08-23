import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/validate',
  '/validate-license',
  '/test-login',
  '/test-form',
  '/api/auth/login',
  '/api/auth/login-simple',
  '/api/auth/login-redirect',
  '/api/auth/register',
  '/api/auth/check',
  '/api/webhooks',
  '/api/health',
  '/api/test',
  '/api/test-redirect',
  '/terms',
  '/privacy',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow all static assets and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // files with extensions
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Always allow auth pages and test pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/validate' || 
      pathname === '/test-login' || pathname === '/test-form' || pathname === '/login-success' || 
      pathname === '/dashboard-test' || pathname === '/simple' || pathname === '/login-fix' ||
      pathname === '/nav-test' || pathname === '/portal' || pathname === '/register-v2' ||
      pathname === '/login-working' || pathname === '/session-test' || pathname === '/simple-dashboard') {
    return NextResponse.next();
  }
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/auth')
  );
  
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api');
  
  // Get session token from cookie (check multiple cookie names)
  const token = request.cookies.get('session')?.value || 
                request.cookies.get('auth-token')?.value ||
                request.cookies.get('auth')?.value;
  
  // Debug logging for root and dashboard
  if (pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard-simple') {
    console.log('[MIDDLEWARE] Protected route access:', {
      pathname,
      hasToken: !!token,
      tokenFirstChars: token?.substring(0, 20)
    });
  }
  
  // For public routes, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  if (!token) {
    // No token, redirect to login
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Only redirect if not already on login page to prevent loops
    if (pathname !== '/login' && pathname !== '/register') {
      const url = new URL('/login', request.url);
      // Add redirect param for the page they were trying to access
      if (!pathname.startsWith('/validate-license')) {
        url.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    
    // Handle both new session format and old auth-token format
    if (decoded.userId) {
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-license-key', decoded.licenseKey);
    } else if (decoded.license_key) {
      // Old format compatibility
      requestHeaders.set('x-license-key', decoded.license_key);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error: any) {
    // Invalid token
    console.error('[MIDDLEWARE] Token verification failed:', {
      pathname,
      error: error.message,
      tokenLength: token?.length
    });
    
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Redirect to login and clear invalid cookie
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(url);
    response.cookies.delete('session');
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};