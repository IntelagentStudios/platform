import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';


export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

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

    // Check if license is active (allow 'pending' status for new licenses)
    if (license.status && license.status !== 'active' && license.status !== 'pending') {
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

      // Create new user with a placeholder password hash (since we're using license-based auth)
      user = await prisma.users.create({
        data: {
          email,
          name,
          license_key,
          password_hash: 'LICENSE_AUTH' // Placeholder since we don't use password auth for license users
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

      // TODO: Log registration event in audit_logs since usage_events table doesn't exist
      try {
        await prisma.audit_logs.create({
          data: {
            license_key,
            user_id: user.id,
            action: 'license_registered',
            resource_type: 'platform',
            resource_id: license_key,
            changes: {
              email,
              name,
              user_id: user.id
            }
          }
        });
      } catch (e) {
        // Events table might not exist, continue anyway
        console.log('Could not log registration event:', e);
      }
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

      // TODO: Log access event in audit_logs since usage_events table doesn't exist
      try {
        await prisma.audit_logs.create({
          data: {
            license_key,
            user_id: user?.id || null,
            action: 'license_accessed',
            resource_type: 'platform',
            resource_id: license_key,
            changes: {
              user_id: user?.id
            }
          }
        });
      } catch (e) {
        // Events table might not exist, continue anyway
        console.log('Could not log access event:', e);
      }
    }

    // Set onboarding as false (field doesn't exist in current DB)
    const onboarding = { completed: false };

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
    const cookieStore = await cookies();
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
      { error: 'Failed to validate license', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'License validation endpoint is working',
    method: 'Use POST to validate a license',
    required_fields: {
      license_key: 'XXXX-XXXX-XXXX-XXXX format',
      email: 'optional - for registration',
      name: 'optional - for registration'
    }
  });
}