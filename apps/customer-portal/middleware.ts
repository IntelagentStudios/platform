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
  
  if (authToken) {
    try {
      // Verify JWT token
      jwt.verify(authToken.value, JWT_SECRET);
      // Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // Invalid token, continue to check old auth
    }
  }
  
  // Fall back to old auth cookie for backward compatibility
  const oldAuthCookie = request.cookies.get('auth');
  
  if (oldAuthCookie && oldAuthCookie.value === 'authenticated-user-harry') {
    // Old auth is valid, allow access
    return NextResponse.next();
  }
  
  // Not authenticated, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};