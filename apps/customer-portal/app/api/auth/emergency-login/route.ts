import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

// Emergency login endpoint - bypasses cache and rate limiting
// FOR DEBUGGING ONLY - Remove in production
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Emergency login attempt for:', email);

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    console.log('Found user:', {
      email: user.email,
      hasPassword: !!user.password_hash,
      licenseKey: user.license_key
    });

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    console.log('Password verified for:', email);

    // Fetch license
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    if (!license) {
      console.log('No license found for user:', email);
      return NextResponse.json(
        { error: 'No license found' },
        { status: 403 }
      );
    }

    console.log('License found:', {
      key: license.license_key,
      status: license.status,
      plan: license.plan
    });

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

    console.log('Token created successfully');

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Emergency login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        licenseKey: user.license_key,
        products: license?.products || [],
        is_pro: license?.is_pro || false
      },
      redirectTo: user.role === 'master_admin' ? '/admin' : '/dashboard'
    });

    // Set cookies
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    response.cookies.set('session_id', sessionToken.substring(0, 20), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    console.log('Emergency login successful for:', email);
    return response;

  } catch (error) {
    console.error('Emergency login error:', error);
    return NextResponse.json(
      { 
        error: 'Emergency login failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}