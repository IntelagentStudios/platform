import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const cookies = request.cookies.getAll();
    const sessionCookie = request.cookies.get('session');
    
    console.log('[CHECK-SESSION] All cookies:', cookies);
    console.log('[CHECK-SESSION] Session cookie:', sessionCookie);
    
    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session cookie found',
        cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
      });
    }
    
    try {
      const decoded = jwt.verify(sessionCookie.value, JWT_SECRET) as any;
      return NextResponse.json({
        authenticated: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          licenseKey: decoded.licenseKey
        },
        message: 'Session valid',
        cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
      });
    } catch (err) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid session token',
        error: err instanceof Error ? err.message : 'Unknown error',
        cookies: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
      });
    }
  } catch (error) {
    console.error('[CHECK-SESSION] Error:', error);
    return NextResponse.json({
      authenticated: false,
      message: 'Error checking session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}