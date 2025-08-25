import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken } from '@/lib/auth';
import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';

// Master admin license key
const MASTER_ADMIN_LICENSE = 'INTL-AGNT-BOSS-MODE';

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, password } = await request.json();

    if (!licenseKey || !password) {
      return NextResponse.json(
        { error: 'License key and password are required' },
        { status: 400 }
      );
    }

    // Check if this is the master admin license
    if (licenseKey !== MASTER_ADMIN_LICENSE) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify the license exists in database
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 401 }
      );
    }

    // Check if a user exists with the provided email
    // Note: admin portal's user model doesn't have license_key field
    const user = await prisma.user.findUnique({
      where: { email: 'admin@intelagentstudios.com' }
    });

    if (user) {
      // Verify password if user exists
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    } else {
      // First time setup - create admin user
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email: 'admin@intelagentstudios.com',
          password: passwordHash,
          firstName: 'Master',
          lastName: 'Admin',
          role: 'admin'
        }
      });
    }

    // Create auth token
    const token = createAuthToken('MASTER_ADMIN', license.email || 'admin@intelagentstudios.com');
    
    const response = NextResponse.json({
      success: true,
      isMaster: true,
      licenseKey: licenseKey,
      email: license.email || 'admin@intelagentstudios.com',
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