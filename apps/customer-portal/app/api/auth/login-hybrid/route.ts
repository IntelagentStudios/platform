import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hardcoded fallback users (includes both registered and pre-registered)
const FALLBACK_USERS = [
  {
    id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
    email: 'harry@intelagentstudios.com',
    password: 'Birksgrange226!',
    password_hash: '$2b$12$2ukCbMdeoeptdXCwKsaVeuVskSkPFeOZvknT6qyPWI8ueAwHzCWRO',
    license_key: 'INTL-AGNT-BOSS-MODE',
    name: 'Harry',
    products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
    plan: 'Pro Platform'
  }
];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[LOGIN-HYBRID] Login attempt for:', email);
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    let user = null;
    let isUsingFallback = false;
    
    // Try database first
    try {
      const { prisma } = await import('@intelagent/database');
      const dbUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          license: {
            select: {
              license_key: true,
              products: true,
              plan: true,
              status: true
            }
          }
        }
      });
      
      if (dbUser) {
        const passwordValid = await bcrypt.compare(password, dbUser.password_hash);
        if (passwordValid) {
          user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            license_key: dbUser.license_key,
            products: dbUser.license?.products || [],
            plan: dbUser.license?.plan || 'Pro Platform'
          };
          console.log('[LOGIN-HYBRID] Database login successful');
        }
      }
    } catch (dbError) {
      console.error('[LOGIN-HYBRID] Database error, trying fallback:', dbError);
      isUsingFallback = true;
    }
    
    // If database failed or user not found, try fallback users
    if (!user) {
      const fallbackUser = FALLBACK_USERS.find(u => u.email === email.toLowerCase());
      if (fallbackUser) {
        const passwordValid = await bcrypt.compare(password, fallbackUser.password_hash);
        if (passwordValid) {
          user = {
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            license_key: fallbackUser.license_key,
            products: fallbackUser.products,
            plan: fallbackUser.plan
          };
          isUsingFallback = true;
          console.log('[LOGIN-HYBRID] Fallback login successful');
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        licenseKey: user.license_key
      },
      process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS',
      { expiresIn: '7d' }
    );
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: user,
      message: isUsingFallback ? 'Login successful (fallback mode)' : 'Login successful',
      redirectTo: '/'
    });
    
    // Set session cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    console.log('[LOGIN-HYBRID] Token set, login complete');
    return response;
    
  } catch (error: any) {
    console.error('[LOGIN-HYBRID] Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}