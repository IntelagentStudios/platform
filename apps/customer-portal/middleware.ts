import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
  
  // Check for JWT auth token first
  const authToken = request.cookies.get('auth_token');
  let userRole = null;
  
  if (authToken) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
      userRole = decoded.role;
      
      // Check admin route access
      if (pathname.startsWith('/admin')) {
        if (userRole !== 'master_admin') {
          // Not admin, redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
      
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // Invalid token, continue to check old auth
    }
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