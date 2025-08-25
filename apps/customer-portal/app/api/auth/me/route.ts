import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check for auth_token (new JWT auth) first, then session (old)
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value || request.cookies.get('session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
    
    // Return user data in the expected format
    const userData = {
      authenticated: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        license_key: decoded.licenseKey,
        role: decoded.role || 'customer',
        products: ['chatbot'], // Based on the license we created
        plan: 'starter',
        subscription_status: 'active',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    };
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}