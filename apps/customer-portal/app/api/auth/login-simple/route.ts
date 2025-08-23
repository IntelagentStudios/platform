import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Hardcoded user for testing - your actual data from the database
const HARDCODED_USER = {
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  email: 'harry@intelagentstudios.com',
  password_hash: '$2b$12$Tmj6rJCRpBCXWBEn1a2mWOcFUcFcGJF9UaYEU5TzcdKBL7Iz10S9y',
  license_key: 'INTL-AGNT-BOSS-MODE',
  name: 'harry'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt for:', email);
    
    // Check if it's the correct email
    if (email.toLowerCase() !== HARDCODED_USER.email) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Simple password check - skip bcrypt for now
    if (password !== 'Birksgrange226!') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session token
    const token = jwt.sign(
      { 
        userId: HARDCODED_USER.id, 
        email: HARDCODED_USER.email,
        licenseKey: HARDCODED_USER.license_key 
      },
      process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS',
      { expiresIn: '7d' }
    );
    
    // Prepare user data
    const userData = {
      id: HARDCODED_USER.id,
      email: HARDCODED_USER.email,
      name: HARDCODED_USER.name,
      license_key: HARDCODED_USER.license_key,
      products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
      plan: 'Pro Platform'
    };
    
    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: 'Login successful (using temporary bypass)'
    });
    
    // Set secure session cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}