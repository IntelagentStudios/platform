import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const HARDCODED_USER = {
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  email: 'harry@intelagentstudios.com',
  password_hash: '$2b$12$2ukCbMdeoeptdXCwKsaVeuVskSkPFeOZvknT6qyPWI8ueAwHzCWRO',
  license_key: 'INTL-AGNT-BOSS-MODE',
  name: 'harry'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN-DEBUG] Request received:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    if (email.toLowerCase() !== HARDCODED_USER.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, HARDCODED_USER.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: HARDCODED_USER.id,
        email: HARDCODED_USER.email,
        licenseKey: HARDCODED_USER.license_key
      },
      process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      redirectTo: '/dashboard'
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('[LOGIN-DEBUG] Login successful, token set');
    return response;

  } catch (error: any) {
    console.error('[LOGIN-DEBUG] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}