import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { licenseCache } from '@intelagent/redis/license-cache';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email with license information
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      include: {
        licenses: {
          select: {
            license_key: true,
            products: true,
            is_pro: true,
            site_key: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check for account lockout (rate limiting per license)
    if (user.license_key) {
      const loginAttempts = await licenseCache.checkRateLimit(
        user.license_key,
        'login_attempts',
        MAX_LOGIN_ATTEMPTS,
        LOCKOUT_DURATION
      );

      if (!loginAttempts.allowed) {
        const minutesRemaining = Math.ceil((loginAttempts.resetAt - Date.now()) / 60000);
        return NextResponse.json(
          { 
            error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`,
            resetAt: new Date(loginAttempts.resetAt).toISOString()
          },
          { status: 429 }
        );
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      if (user.license_key) {
        await licenseCache.incrementCounter(
          user.license_key,
          `login_attempts:${Math.floor(Date.now() / (LOCKOUT_DURATION * 1000))}`,
          1
        );
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Clear failed login attempts on successful login
    if (user.license_key) {
      await licenseCache.delete(
        user.license_key,
        'counter',
        `login_attempts:${Math.floor(Date.now() / (LOCKOUT_DURATION * 1000))}`
      );
    }

    // Verify license exists and is active
    const license = user.licenses;
    if (!license) {
      return NextResponse.json(
        { error: 'No license associated with this account. Please contact support.' },
        { status: 403 }
      );
    }
    
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: 'Your license is not active. Please contact support.' },
        { status: 403 }
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

    // Store session in both database and Redis cache
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const sessionData = {
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        license_key: user.license_key,
        products: license?.products || [],
        is_pro: license?.is_pro || false
      };

      // Store in database (with upsert to handle concurrent logins)
      await prisma.user_sessions.upsert({
        where: { token: sessionToken },
        create: {
          user_id: user.id,
          token: sessionToken,
          expires_at: expiresAt,
          ip_address: sessionData.ip_address,
          user_agent: sessionData.user_agent
        },
        update: {
          expires_at: expiresAt,
          ip_address: sessionData.ip_address,
          user_agent: sessionData.user_agent
        }
      });
      
      // Cache session in Redis for fast access
      if (user.license_key) {
        await licenseCache.cacheUserSession(
          user.license_key,
          sessionToken,
          sessionData,
          60 * 60 * 24 * 7 // 7 days in seconds
        );
        
        // Track active sessions count for the license
        await licenseCache.incrementCounter(
          user.license_key,
          'active_sessions',
          1
        );
        
        // Log successful login
        await licenseCache.set(
          user.license_key,
          'auth',
          'last_login',
          {
            timestamp: new Date().toISOString(),
            ip: sessionData.ip_address,
            user_agent: sessionData.user_agent
          },
          60 * 60 * 24 * 30 // Keep for 30 days
        );
      }
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
        licenseKey: user.license_key,
        products: license?.products || [],
        is_pro: license?.is_pro || false,
        site_key: license?.site_key || null
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

    // Set a session identifier cookie for quick session validation
    response.cookies.set('session_id', sessionToken.substring(0, 20), {
      httpOnly: false, // Allow client to check session existence
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

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