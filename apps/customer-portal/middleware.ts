import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/',
  '/terms',
  '/privacy',
  '/api/webhook'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api');
  
  // Get session token from cookie
  const token = request.cookies.get('session')?.value || request.cookies.get('auth-token')?.value;
  
  // For public routes, allow access
  if (isPublicRoute) {
    // If user has valid token and trying to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      try {
        // Verify token is valid
        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Invalid token, allow access to login/register
      }
    }
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
    
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
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
  } catch (error) {
    // Invalid token
    console.error('Invalid token:', error);
    
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