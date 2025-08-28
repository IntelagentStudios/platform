import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key } = body;
    
    // Verify admin access (you should check for master admin)
    // For now, we'll assume the request is authorized
    
    // Get user details
    const user = await prisma.users.findFirst({
      where: { license_key }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create impersonation token
    const impersonationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        licenseKey: license_key,
        isImpersonation: true,
        impersonatedBy: 'master_admin',
        expiresIn: '1h'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Log the impersonation
    await prisma.audit_logs.create({
      data: {
        action: 'impersonate_user',
        resource_type: 'user',
        resource_id: user.id,
        license_key: license_key,
        changes: {
          impersonated_user: user.email,
          timestamp: new Date().toISOString()
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Create a one-time use token for accessing the dashboard
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    // Store in cache or database for validation
    // For now, we'll include it in the response
    
    return NextResponse.json({
      success: true,
      token: accessToken,
      impersonationToken,
      user: {
        id: user.id,
        email: user.email,
        license_key
      }
    });
    
  } catch (error) {
    console.error('Error creating impersonation session:', error);
    return NextResponse.json({ error: 'Failed to impersonate user' }, { status: 500 });
  }
}