import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    
    const { email, password } = validatedData;
    
    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        license: {
          select: {
            license_key: true,
            products: true,
            plan: true,
            status: true,
            subscription_status: true,
            next_billing_date: true
          }
        },
        product_setups: {
          select: {
            product: true,
            setup_completed: true,
            domain: true,
            site_key: true
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
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Invalidate old sessions (optional - for single session)
    await prisma.user_sessions.deleteMany({
      where: { 
        user_id: user.id,
        expires_at: { lt: new Date() }
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
    
    // Prepare user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      license_key: user.license_key,
      products: user.license?.products || [],
      plan: user.license?.plan,
      subscription_status: user.license?.subscription_status,
      next_billing_date: user.license?.next_billing_date,
      product_setups: user.product_setups.map(setup => ({
        product: setup.product,
        setup_completed: setup.setup_completed,
        domain: setup.domain
      }))
    };
    
    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: userData,
      requiresOnboarding: !user.onboarding_completed,
      message: 'Login successful'
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
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    
    if (token) {
      // Invalidate session in database
      await prisma.user_sessions.deleteMany({
        where: { token }
      });
    }
    
    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    response.cookies.delete('session');
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}