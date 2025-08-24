import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
  '/login',
  '/api/auth/simple',
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
  
  // Check for auth cookie
  const authCookie = request.cookies.get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    // Not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};