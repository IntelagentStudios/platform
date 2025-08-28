import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export const dynamic = 'force-dynamic';
// Master admin credentials (in production, store these securely)
const MASTER_ADMINS = [
  {
    email: process.env.MASTER_ADMIN_EMAIL || 'harry@intelagentstudios.com',
    password: process.env.MASTER_ADMIN_PASSWORD || '$2b$10$5oMNvmtIbt.CvjjWj.ksau5tSqCbruD6pEVxxAi1N4v4KQ5mrmeb2' // Glendruid15!
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    
    // Check if the stored password is already hashed (supports both $2a$ and $2b$ prefixes)
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
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

    // Create auth token with admin flag
    const token = jwt.sign(
      { 
        email: admin.email,
        isAdmin: true,
        role: 'master_admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const response = NextResponse.json({
      success: true,
      isAdmin: true,
      email: admin.email,
      role: 'master_admin'
    });

    // Set secure cookies
    const cookieStore = cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    cookieStore.set('user_role', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}