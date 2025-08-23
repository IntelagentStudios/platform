import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Hardcoded user for testing
const HARDCODED_USER = {
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  email: 'harry@intelagentstudios.com',
  password: 'Birksgrange226!',
  license_key: 'INTL-AGNT-BOSS-MODE',
  name: 'harry'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Check credentials
    if (email.toLowerCase() !== HARDCODED_USER.email || password !== HARDCODED_USER.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session token
    const token = jwt.sign(
      { 
        userId: HARDCODED_USER.id, 
        email: HARDCODED_USER.email,
        licenseKey: HARDCODED_USER.license_key 
      },
      process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS',
      { expiresIn: '7d' }
    );
    
    // Create redirect response
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set secure session cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}