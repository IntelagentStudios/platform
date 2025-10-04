import { NextRequest, NextResponse } from 'next/server';
import { chatbotIsolationMiddleware, shouldBypassSkills } from './middleware/chatbot-isolation';

const publicPaths = [
  '/login',
  '/register',
  '/api/auth',
  '/api/widget',  // Widget endpoints must be public for embedding
  '/api/webhook', // Webhook endpoints for external services
  '/api/agent-builder', // Agent builder API endpoints for n8n workflow
  '/agent-builder', // Allow public access to entire agent builder flow including subpages
  '/marketplace/public', // Public marketplace
  '/_next',
  '/favicon.ico',
  '/chatbot-widget.js'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // CRITICAL: Apply chatbot isolation FIRST
  // This ensures chatbot remains independent from skills system
  if (shouldBypassSkills(pathname)) {
    return chatbotIsolationMiddleware(request);
  }
  
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