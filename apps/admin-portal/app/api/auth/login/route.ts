import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Master admin credentials (in production, store these securely)
const MASTER_ADMINS = [
  {
    email: process.env.MASTER_ADMIN_EMAIL || 'admin@intelagentstudios.com',
    password: process.env.MASTER_ADMIN_PASSWORD || '$2a$10$XQxOZF8WGpKFzV.0tcXnYOQKGxH6hZPVPpJ.vqRlXhRFYXhKGH5ey' // Default: AdminPass123!
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = MASTER_ADMINS.find(a => a.email === email);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    let isValidPassword = false;
    
    // Check if the stored password is already hashed
    if (admin.password.startsWith('$2a$')) {
      isValidPassword = await bcrypt.compare(password, admin.password);
    } else {
      // For plain text passwords (development only)
      isValidPassword = password === admin.password;
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create auth token
    const token = createAuthToken('MASTER_ADMIN', email);
    
    const response = NextResponse.json({
      success: true,
      isMaster: true,
      email: admin.email,
      role: 'master_admin'
    });

    // Set secure cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    response.cookies.set('admin-role', 'master', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}