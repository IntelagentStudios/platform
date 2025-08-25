import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check for JWT token first
    const authToken = cookies().get('auth_token');
    
    if (authToken) {
      try {
        // Verify JWT token
        const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
        
        // Check if session exists in database
        const session = await prisma.user_sessions.findFirst({
          where: {
            token: authToken.value,
            expires_at: { gt: new Date() }
          },
          include: {
            user: {
              include: {
                license: true
              }
            }
          }
        });
        
        if (session) {
          // Update last activity
          await prisma.user_sessions.update({
            where: { id: session.id },
            data: { last_activity: new Date() }
          });
          
          return NextResponse.json({
            authenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              role: session.user.role,
              licenseKey: session.user.license_key,
              products: session.user.license?.products || [],
              emailVerified: session.user.email_verified
            }
          });
        }
      } catch (error) {
        // Invalid token, continue to check old auth
        console.error('JWT verification failed:', error);
      }
    }
    
    // Fall back to old auth system for backward compatibility
    const oldAuth = cookies().get('auth');
    if (oldAuth && oldAuth.value === 'authenticated-user-harry') {
      // Find the user with the boss mode license
      const user = await prisma.users.findUnique({
        where: { license_key: 'INTL-AGNT-BOSS-MODE' },
        include: {
          license: true
        }
      });
      
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            licenseKey: user.license_key,
            products: user.license?.products || [],
            emailVerified: user.email_verified
          },
          legacy: true // Indicate this is using the old auth
        });
      }
    }
    
    return NextResponse.json({
      authenticated: false
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Session check failed'
    });
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  try {
    const authToken = cookies().get('auth_token');
    
    if (authToken) {
      // Delete session from database
      await prisma.user_sessions.deleteMany({
        where: { token: authToken.value }
      });
    }
    
    // Clear cookies
    cookies().delete('auth_token');
    cookies().delete('auth');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}