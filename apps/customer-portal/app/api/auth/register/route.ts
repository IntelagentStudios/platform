import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { sendWelcomeNotification } from '@intelagent/notifications';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  licenseKey: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid license key format')
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    const { email, password, licenseKey } = validatedData;
    
    // Check if email already has an account
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    // Check if license key exists and is valid
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });
    
    if (!license) {
      return NextResponse.json(
        { 
          error: 'Invalid license key',
          message: 'Please check the license key from your welcome email and try again.' 
        },
        { status: 404 }
      );
    }
    
    // Check if license is already linked to another user
    const licenseInUse = await prisma.users.findUnique({
      where: { license_key: licenseKey }
    });
    
    if (licenseInUse) {
      return NextResponse.json(
        { 
          error: 'This license is already registered',
          message: 'This license key has already been used to create an account. Please log in instead.' 
        },
        { status: 400 }
      );
    }
    
    // Verify the license status
    if (license.status === 'expired' || license.status === 'cancelled') {
      return NextResponse.json(
        { 
          error: 'License is not active',
          message: 'This license is no longer active. Please contact support for assistance.' 
        },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user account
    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        license_key: licenseKey,
        name: license.customer_name || email.split('@')[0],
        email_verified: true, // Auto-verify since they have a valid license
        email_verified_at: new Date()
      }
    });
    
    // Update license status and link email
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: { 
        status: 'active',
        used_at: new Date(),
        email: email.toLowerCase() // Link the email to the license
      }
    });
    
    // Create session token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        licenseKey: user.license_key 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Create session in database
    await prisma.user_sessions.create({
      data: {
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      }
    });
    
    // Send welcome email
    try {
      await sendWelcomeNotification(license.license_key, user.name || user.email);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    }
    
    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        licenseKey: user.license_key,
        products: license.products || [],
        plan: license.plan
      },
      message: 'Account created successfully! Welcome to Intelagent.'
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
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Check if email has a license (pre-registration check)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already has an account
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json({
        hasAccount: true,
        hasLicense: false,
        message: 'This email already has an account. Please log in instead.'
      });
    }
    
    // Check if email has a license
    const license = await prisma.licenses.findFirst({
      where: { 
        email: email.toLowerCase(),
        status: { in: ['active', 'pending'] }
      }
    });
    
    if (license) {
      // Check if license is already linked
      const licenseInUse = await prisma.users.findUnique({
        where: { license_key: license.license_key }
      });
      
      if (licenseInUse) {
        return NextResponse.json({
          hasAccount: false,
          hasLicense: false,
          message: 'This license is already linked to another account.'
        });
      }
      
      return NextResponse.json({
        hasAccount: false,
        hasLicense: true,
        customerName: license.customer_name,
        products: license.products || [],
        plan: license.plan,
        message: 'Great! We found your purchase. Create your password to continue.'
      });
    }
    
    return NextResponse.json({
      hasAccount: false,
      hasLicense: false,
      message: 'No purchase found for this email. Please check your purchase email or contact support.'
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
}