import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// User database (in production, this would be from a real database)
const USERS = [
  {
    id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
    email: 'harry@intelagentstudios.com',
    password_hash: '$2b$12$2ukCbMdeoeptdXCwKsaVeuVskSkPFeOZvknT6qyPWI8ueAwHzCWRO', // Birksgrange226!
    license_key: 'INTL-AGNT-BOSS-MODE',
    name: 'Harry',
    role: 'owner',
    license: {
      status: 'active',
      type: 'pro_platform',
      expires: '2025-12-31',
      products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent']
    }
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Input validation
    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Find user by email
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }
    
    // Check license status
    if (user.license.status !== 'active') {
      return NextResponse.json({ 
        success: false,
        error: 'Your license is not active. Please contact support.'
      }, { status: 403 });
    }
    
    // Check license expiration
    const expirationDate = new Date(user.license.expires);
    if (expirationDate < new Date()) {
      return NextResponse.json({ 
        success: false,
        error: 'Your license has expired. Please renew to continue.'
      }, { status: 403 });
    }
    
    // Create JWT token with user data
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        licenseKey: user.license_key,
        licenseType: user.license.type,
        products: user.license.products
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set secure cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    // Also set simple auth cookie for backward compatibility
    cookies().set('auth', 'authenticated-user-harry', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        license_key: user.license_key,
        license_type: user.license.type,
        products: user.license.products,
        license_expires: user.license.expires
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Authentication failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authToken = cookies().get('auth_token');
    const simpleAuth = cookies().get('auth');
    
    // Check for simple auth first (fallback)
    if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: '1',
          email: 'harry@intelagentstudios.com',
          name: 'Harry',
          role: 'owner',
          license_key: 'INTL-AGNT-BOSS-MODE',
          license_type: 'pro_platform',
          products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent']
        }
      });
    }
    
    if (!authToken) {
      return NextResponse.json({
        authenticated: false,
        message: 'No authentication token'
      });
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
      
      return NextResponse.json({
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          license_key: decoded.licenseKey,
          license_type: decoded.licenseType,
          products: decoded.products
        }
      });
    } catch (err) {
      // Invalid token
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      message: 'Authentication check failed'
    });
  }
}

export async function DELETE(request: NextRequest) {
  // Logout - clear cookies
  cookies().delete('auth_token');
  cookies().delete('auth');
  
  return NextResponse.json({ 
    success: true,
    message: 'Logged out successfully'
  });
}