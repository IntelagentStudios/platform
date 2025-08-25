import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        licenseKey: user.license_key,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Try to store session in database (but don't fail if it doesn't work)
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.user_sessions.create({
        data: {
          user_id: user.id,
          token: sessionToken,
          expires_at: expiresAt,
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (sessionError) {
      console.error('Session storage error:', sessionError);
      // Continue anyway - the JWT token is what matters
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        licenseKey: user.license_key
      },
      redirectTo: user.role === 'master_admin' ? '/admin' : '/dashboard'
    });

    // Set the auth cookie
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    // Also set old auth cookie for backward compatibility
    if (user.license_key === 'INTL-AGNT-BOSS-MODE') {
      response.cookies.set('auth', 'authenticated-user-harry', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during login',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}