import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Step 1: Find user
    let user;
    try {
      user = await prisma.users.findUnique({
        where: { email }
      });
    } catch (e) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: e instanceof Error ? e.message : 'Unknown error',
        step: 'find_user'
      }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email 
      }, { status: 404 });
    }
    
    // Step 2: Check password
    let isValid;
    try {
      isValid = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Password comparison failed',
        details: e instanceof Error ? e.message : 'Unknown error',
        step: 'compare_password'
      }, { status: 500 });
    }
    
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid password',
        provided_length: password.length,
        hash_length: user.password_hash.length
      }, { status: 401 });
    }
    
    // Step 3: Check environment
    const nodeEnv = process.env.NODE_ENV;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    
    return NextResponse.json({
      success: true,
      user_found: true,
      password_valid: true,
      environment: {
        NODE_ENV: nodeEnv,
        has_jwt_secret: hasJwtSecret
      },
      user_data: {
        id: user.id,
        email: user.email,
        license_key: user.license_key,
        role: user.role,
        has_name: !!user.name
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}