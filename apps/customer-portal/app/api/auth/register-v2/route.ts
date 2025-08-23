import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Hardcoded valid licenses for testing
const VALID_LICENSES = [
  {
    license_key: 'INTL-AGNT-BOSS-MODE',
    customer_name: 'Harry',
    email: 'harry@intelagentstudios.com',
    products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
    plan: 'Pro Platform',
    status: 'active'
  },
  {
    license_key: 'INTL-TEST-USER-1234',
    customer_name: 'Test User',
    email: null, // Not yet registered
    products: ['chatbot'],
    plan: 'Starter',
    status: 'active'
  }
];

// Store registered users (in production this would be in database)
const REGISTERED_USERS: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, licenseKey } = body;
    
    console.log('[REGISTER-V2] Registration attempt:', { email, licenseKey });
    
    // Validate input
    if (!email || !password || !licenseKey) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and license key are required' },
        { status: 400 }
      );
    }
    
    // Check if email already registered
    const existingUser = REGISTERED_USERS.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already registered',
          message: 'This email is already registered. Please login instead.'
        },
        { status: 400 }
      );
    }
    
    // Find the license
    const license = VALID_LICENSES.find(l => l.license_key === licenseKey);
    
    if (!license) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid license key',
          message: 'The license key you entered is not valid. Please check your purchase email.'
        },
        { status: 404 }
      );
    }
    
    // Check if license is already used
    if (license.email && license.email !== email.toLowerCase()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'License already registered',
          message: `This license is already registered to ${license.email}. Please login with that email.`
        },
        { status: 400 }
      );
    }
    
    // Check license status
    if (license.status !== 'active') {
      return NextResponse.json(
        { 
          success: false,
          error: 'License not active',
          message: 'This license is not active. Please contact support.'
        },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      license_key: licenseKey,
      name: license.customer_name,
      created_at: new Date().toISOString()
    };
    
    // Save user
    REGISTERED_USERS.push(newUser);
    
    // Update license with email
    license.email = email.toLowerCase();
    
    console.log('[REGISTER-V2] Registration successful:', { email, licenseKey });
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please log in.',
      redirectTo: '/login?registered=true'
    });
    
  } catch (error: any) {
    console.error('[REGISTER-V2] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

// Check if email/license combination is valid
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const licenseKey = searchParams.get('licenseKey');
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already registered
    const existingUser = REGISTERED_USERS.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return NextResponse.json({
        success: false,
        hasAccount: true,
        message: 'This email is already registered. Please login.'
      });
    }
    
    // If license key provided, validate it
    if (licenseKey) {
      const license = VALID_LICENSES.find(l => l.license_key === licenseKey);
      
      if (!license) {
        return NextResponse.json({
          success: false,
          validLicense: false,
          message: 'Invalid license key'
        });
      }
      
      if (license.email && license.email !== email.toLowerCase()) {
        return NextResponse.json({
          success: false,
          validLicense: false,
          message: `This license is registered to ${license.email}`
        });
      }
      
      return NextResponse.json({
        success: true,
        validLicense: true,
        customerName: license.customer_name,
        products: license.products,
        plan: license.plan
      });
    }
    
    return NextResponse.json({
      success: true,
      hasAccount: false,
      message: 'Email available for registration'
    });
    
  } catch (error: any) {
    console.error('[REGISTER-V2] Check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Check failed' },
      { status: 500 }
    );
  }
}