import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { license_key, email, name } = await request.json();

    // Validate license key format
    if (!license_key || !/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(license_key)) {
      return NextResponse.json(
        { error: 'Invalid license key format' },
        { status: 400 }
      );
    }

    // Check if license exists
    const license = await prisma.licenses.findUnique({
      where: { license_key },
      include: {
        users: true
      }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Check if license is active
    if (license.status !== 'active') {
      return NextResponse.json(
        { error: `License is ${license.status}. Please contact support.` },
        { status: 403 }
      );
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await prisma.licenses.update({
        where: { license_key },
        data: { status: 'expired' }
      });
      
      return NextResponse.json(
        { error: 'License has expired. Please renew your license.' },
        { status: 403 }
      );
    }

    // If registering (first time with email and name)
    if (email && name) {
      // Check if email already exists for this license
      const existingUser = await prisma.users.findFirst({
        where: {
          email,
          license_key
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered with this license' },
          { status: 400 }
        );
      }

      // Create new user
      const user = await prisma.users.create({
        data: {
          email,
          name,
          license_key,
          role: 'owner',
          status: 'active'
        }
      });

      // Update license first_activated if not set
      if (!license.first_activated_at) {
        await prisma.licenses.update({
          where: { license_key },
          data: { 
            first_activated_at: new Date(),
            last_accessed_at: new Date()
          }
        });
      }

      // Log registration event
      await prisma.events.create({
        data: {
          license_key,
          user_id: user.id,
          event_type: 'license.registered',
          event_data: {
            email,
            name
          }
        }
      });
    } else {
      // Just validating existing license
      await prisma.licenses.update({
        where: { license_key },
        data: { 
          last_accessed_at: new Date()
        }
      });

      // Log access event
      await prisma.events.create({
        data: {
          license_key,
          event_type: 'license.accessed',
          event_data: {}
        }
      });
    }

    // Check onboarding status
    const onboarding = await prisma.onboarding.findUnique({
      where: { license_key }
    });

    // Create session token
    const token = jwt.sign(
      { 
        license_key,
        email: email || license.users[0]?.email,
        name: name || license.users[0]?.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookies
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    cookieStore.set('license_key', license_key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      license: {
        license_key,
        product: license.product,
        status: license.status,
        expires_at: license.expires_at
      },
      onboarding_completed: onboarding?.completed || false,
      user: {
        email: email || license.users[0]?.email,
        name: name || license.users[0]?.name
      }
    });

  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate license' },
      { status: 500 }
    );
  }
}