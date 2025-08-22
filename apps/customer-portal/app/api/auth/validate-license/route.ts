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
      where: { license_key }
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

    // If registering (first time with email and name)
    let user = null;
    if (email && name) {
      // Check if user already exists for this license
      user = await prisma.users.findFirst({
        where: {
          email,
          license_key
        }
      });

      if (user) {
        return NextResponse.json(
          { error: 'Email already registered with this license' },
          { status: 400 }
        );
      }

      // Create new user
      user = await prisma.users.create({
        data: {
          email,
          name,
          license_key,
          status: 'active'
        }
      });

      // Update license as used if not already
      if (!license.used_at) {
        await prisma.licenses.update({
          where: { license_key },
          data: { 
            used_at: new Date()
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
      // Update last used time
      await prisma.licenses.update({
        where: { license_key },
        data: { 
          used_at: new Date()
        }
      });

      // Get the first user for this license if any
      user = await prisma.users.findFirst({
        where: { license_key },
        orderBy: { created_at: 'asc' }
      });

      // Log access event
      await prisma.events.create({
        data: {
          license_key,
          user_id: user?.id,
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
        email: email || user?.email || license.email,
        name: name || user?.name || license.customer_name
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
        products: license.products,
        status: license.status,
        plan: license.plan
      },
      onboarding_completed: onboarding?.completed || false,
      user: {
        email: email || user?.email || license.email,
        name: name || user?.name || license.customer_name
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