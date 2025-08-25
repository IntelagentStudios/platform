import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
  '/login',
  '/register',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/chatbot-widget.js'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for auth token (JWT verification happens in API routes)
  const authToken = request.cookies.get('auth_token');
  
  if (authToken) {
    // Basic check - actual JWT verification happens in API routes
    // due to Edge Runtime limitations with jsonwebtoken library
    
    // For admin routes, check in the route handler instead
    if (pathname.startsWith('/admin')) {
      // Let the route handler verify admin access
      return NextResponse.next();
    }
    
    // Token exists, allow access
    return NextResponse.next();
  }
  
  // Fall back to old auth cookie for backward compatibility
  const oldAuthCookie = request.cookies.get('auth');
  
  if (oldAuthCookie && 
      (oldAuthCookie.value === 'authenticated-user-harry' || 
       oldAuthCookie.value === 'authenticated-test-friend')) {
    // Old auth is valid, but restrict admin access
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // Not authenticated, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};