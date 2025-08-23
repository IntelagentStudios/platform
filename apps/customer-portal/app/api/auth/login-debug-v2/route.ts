import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Hardcoded user for testing
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

export async function POST(request: NextRequest) {
  const debugLog: any[] = [];
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    debugLog.push({ step: 'input', email, hasPassword: !!password });
    
    // Check JWT secret
    const JWT_SECRET = process.env.JWT_SECRET;
    const FALLBACK_SECRET = 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    
    debugLog.push({ 
      step: 'jwt_config',
      has_env_secret: !!JWT_SECRET,
      env_secret_length: JWT_SECRET?.length,
      using_fallback: !JWT_SECRET,
      secret_to_use: JWT_SECRET ? 'env' : 'fallback'
    });
    
    const secretToUse = JWT_SECRET || FALLBACK_SECRET;
    
    // Validate credentials
    if (email.toLowerCase() !== TEST_USER.email.toLowerCase()) {
      debugLog.push({ step: 'email_check', result: 'failed' });
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
        debug: debugLog
      }, { status: 401 });
    }
    
    debugLog.push({ step: 'email_check', result: 'passed' });
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, TEST_USER.password_hash);
    debugLog.push({ step: 'password_check', result: passwordValid ? 'passed' : 'failed' });
    
    if (!passwordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
        debug: debugLog
      }, { status: 401 });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: TEST_USER.id,
        email: TEST_USER.email,
        licenseKey: TEST_USER.license_key
      },
      secretToUse,
      { expiresIn: '7d' }
    );
    
    debugLog.push({ 
      step: 'token_created',
      token_length: token.length,
      token_preview: token.substring(0, 20) + '...'
    });
    
    // Check request host
    const hostname = request.headers.get('host') || '';
    const isProduction = hostname.includes('intelagentstudios.com');
    const isRailway = hostname.includes('railway.app');
    
    debugLog.push({
      step: 'environment',
      hostname,
      isProduction,
      isRailway,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: TEST_USER.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
        license_key: TEST_USER.license_key,
        products: TEST_USER.license.products,
        plan: TEST_USER.license.plan
      },
      debug: debugLog
    });
    
    // Set cookie
    let cookieOptions: any = {
      httpOnly: true,
      secure: isProduction || isRailway,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    };
    
    if (isProduction) {
      cookieOptions.domain = '.intelagentstudios.com';
    }
    
    response.cookies.set('session', token, cookieOptions);
    
    debugLog.push({
      step: 'cookie_set',
      cookieOptions,
      cookieName: 'session'
    });
    
    return response;
    
  } catch (error: any) {
    debugLog.push({ step: 'error', message: error.message, stack: error.stack });
    
    return NextResponse.json({
      success: false,
      error: 'Login failed',
      debug: debugLog,
      errorDetails: error.message
    }, { status: 500 });
  }
}