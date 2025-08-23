import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const publicPaths = [
  '/login',
  '/register',
  '/api/auth/simple',
  '/api/auth/secure',
  '/_next',
  '/favicon.ico'
];

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    // Redirect to dashboard if already logged in and trying to access login
    if (pathname === '/login') {
      const authToken = request.cookies.get('auth_token');
      const simpleAuth = request.cookies.get('auth');
      
      if (authToken && simpleAuth) {
        try {
          // Verify token is valid
          jwt.verify(authToken.value, JWT_SECRET);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
          // Invalid token, allow login page access
        }
      }
    }
    return NextResponse.next();
  }
  
  // Check for authentication
  const authToken = request.cookies.get('auth_token');
  const simpleAuth = request.cookies.get('auth');
  
  // Must have both cookies for backward compatibility
  if (!authToken || !simpleAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For simple auth compatibility
  if (simpleAuth.value !== 'authenticated-user-harry') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify JWT token for secure auth
  try {
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-name', decoded.name);
    requestHeaders.set('x-user-role', decoded.role);
    requestHeaders.set('x-license-key', decoded.licenseKey);
    requestHeaders.set('x-license-type', decoded.licenseType);
    requestHeaders.set('x-products', JSON.stringify(decoded.products));
    
    // Check role-based access for admin routes
    if (pathname.startsWith('/admin')) {
      if (decoded.role !== 'admin' && decoded.role !== 'owner') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
    
  } catch (error) {
    // Invalid token, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    response.cookies.delete('auth');
    return response;
  }
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};