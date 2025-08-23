import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Simple auth without JWT or bcrypt - just for testing
const VALID_EMAIL = 'harry@intelagentstudios.com';
const VALID_PASSWORD = 'Birksgrange226!';
const SESSION_VALUE = 'authenticated-user-harry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Simple validation
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      // Set a simple cookie
      cookies().set('auth', SESSION_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Login successful'
      });
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Check if user is logged in
  const authCookie = cookies().get('auth');
  
  return NextResponse.json({
    authenticated: authCookie?.value === SESSION_VALUE,
    cookie: authCookie ? 'present' : 'missing'
  });
}