import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Hardcoded user for testing (simulating database)
const TEST_USER = {
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  email: 'harry@intelagentstudios.com',
  password_hash: '$2b$12$2ukCbMdeoeptdXCwKsaVeuVskSkPFeOZvknT6qyPWI8ueAwHzCWRO', // Birksgrange226!
  license_key: 'INTL-AGNT-BOSS-MODE',
  name: 'Harry',
  onboarding_completed: true,
  license: {
    status: 'active',
    products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
    plan: 'Pro Platform'
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('[LOGIN-FINAL] Attempt for:', email);
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    // Check user (simulating database lookup)
    if (email.toLowerCase() !== TEST_USER.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, TEST_USER.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check license status
    if (TEST_USER.license?.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Your license is not active. Please contact support.' },
        { status: 403 }
      );
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: TEST_USER.id,
        email: TEST_USER.email,
        licenseKey: TEST_USER.license_key
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('[LOGIN-FINAL] Token created, setting cookie');
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
        license_key: TEST_USER.license_key,
        onboarding_completed: TEST_USER.onboarding_completed,
        products: TEST_USER.license.products,
        plan: TEST_USER.license.plan
      }
    });
    
    // Set secure cookie with proper settings for production
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      // Critical: Set domain for production to work across subdomains
      ...(isProduction && { domain: '.intelagentstudios.com' })
    });
    
    console.log('[LOGIN-FINAL] Cookie set with domain:', isProduction ? '.intelagentstudios.com' : 'localhost');
    
    return response;
    
  } catch (error: any) {
    console.error('[LOGIN-FINAL] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}