import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Temporary simple login for friend testing
const TEST_CREDENTIALS = {
  email: 'friend@testbusiness.com',
  password: 'TestDemo123!',
  licenseKey: 'TEST-CHAT-BOT1-2024'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Simple validation for friend's test account
    if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
      // Set auth cookies
      cookies().set('auth', 'authenticated-test-friend', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
      
      cookies().set('license_key', TEST_CREDENTIALS.licenseKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Login successful',
        redirectTo: '/dashboard'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}