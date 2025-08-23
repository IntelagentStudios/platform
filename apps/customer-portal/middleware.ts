import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/login-final',
  '/api/auth/register',
  '/api/auth/check-session',
  '/api/health',
  '/_next',
  '/favicon.ico'
];

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Allow public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    // If user is logged in and tries to access login, redirect to dashboard
    if (pathname === '/login') {
      const token = request.cookies.get('session')?.value;
      if (token) {
        try {
          jwt.verify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
          // Invalid token, allow login page access
        }
      }
    }
    return NextResponse.next();
  }
  
  // Check for session cookie
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-license-key', decoded.licenseKey);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
    
  } catch (error: any) {
    // Invalid token, redirect to login and clear cookie
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ]
};