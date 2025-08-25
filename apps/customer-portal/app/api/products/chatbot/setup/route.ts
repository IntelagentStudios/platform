import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@intelagent/database';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Generate a unique site key
function generateSiteKey(): string {
  return `sk_${crypto.randomBytes(16).toString('hex')}`;
}

// Helper to get auth info from JWT
function getAuthInfo() {
  const authToken = cookies().get('auth_token') || cookies().get('auth-token');
  if (!authToken) return null;
  
  try {
    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
    return {
      licenseKey: decoded.licenseKey,
      userEmail: decoded.email,
      userId: decoded.userId || decoded.licenseKey
    };
  } catch (e) {
    return null;
  }
}

// GET existing setup
export async function GET(request: NextRequest) {
  try {
    const authInfo = getAuthInfo();
    if (!authInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // TODO: Get existing chatbot setup from audit_logs since product_setups doesn't exist
    const setupLog = await prisma.audit_logs.findFirst({
      where: {
        license_key: authInfo.licenseKey,
        action: 'chatbot_setup',
        resource_type: 'chatbot'
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (!setupLog) {
      return NextResponse.json({
        setup_completed: false,
        message: 'No setup found'
      });
    }
    
    const setupData = setupLog.changes as any;
    return NextResponse.json({
      setup_completed: setupData?.setup_completed || false,
      domain: setupData?.domain,
      site_key: setupData?.site_key,
      setup_data: setupData?.setup_data || {},
      created_at: setupLog.created_at,
      updated_at: setupLog.created_at
    });
    
  } catch (error) {
    console.error('Get setup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup' },
      { status: 500 }
    );
  }
}

// POST create or update setup - simplified version for direct setup
export async function POST(request: NextRequest) {
  try {
    const authInfo = getAuthInfo();
    if (!authInfo) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { domain } = body;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }
    
    // Clean up domain (remove protocol, trailing slashes, etc)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim();
    
    // Check if domain is already used by another license
    const existingDomain = await prisma.licenses.findFirst({
      where: {
        domain: cleanDomain,
        license_key: { not: authInfo.licenseKey }
      }
    });
    
    if (existingDomain) {
      return NextResponse.json(
        { error: 'This domain is already registered to another account' },
        { status: 409 }
      );
    }
    
    // Generate site key
    const siteKey = generateSiteKey();
    
    // Update the license with domain and site_key
    await prisma.licenses.update({
      where: { license_key: authInfo.licenseKey },
      data: {
        domain: cleanDomain,
        site_key: siteKey
      }
    });
    
    // Create audit log for product configuration
    await prisma.audit_logs.create({
      data: {
        license_key: authInfo.licenseKey,
        user_id: authInfo.userId,
        action: 'product_configured',
        resource_type: 'product_config',
        resource_id: 'chatbot',
        changes: {
          config: {
            configured: true,
            site_key: siteKey,
            domain: cleanDomain,
            created_at: new Date()
          },
          enabled: true,
          updated_at: new Date()
        }
      }
    });
    
    // Return success response with embed code
    return NextResponse.json({
      success: true,
      site_key: siteKey,
      domain: cleanDomain,
      embed_code: `<script src="https://dashboard.intelagentstudios.com/widget.js" data-site-key="${siteKey}"></script>`,
      instructions: {
        squarespace: [
          'Go to Settings → Advanced → Code Injection',
          'Paste the embed code in the FOOTER section',
          'Click Save'
        ],
        general: [
          'Add the embed code before the closing </body> tag in your HTML'
        ]
      }
    });
    
  } catch (error) {
    console.error('Create setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create setup' },
      { status: 500 }
    );
  }
}

// PATCH update setup status
export async function PATCH(request: NextRequest) {
  try {
    const authInfo = getAuthInfo();
    if (!authInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { setup_completed } = body;
    
    // TODO: Update setup completion status in audit_logs since product_setups doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: authInfo.licenseKey,
        user_id: authInfo.userId,
        action: 'chatbot_setup_completed',
        resource_type: 'chatbot',
        resource_id: authInfo.userId,
        changes: {
          setup_completed,
          ...(setup_completed && { setup_completed_at: new Date() })
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      setup_completed,
      message: 'Setup status updated'
    });
    
  } catch (error) {
    console.error('Update setup error:', error);
    return NextResponse.json(
      { error: 'Failed to update setup' },
      { status: 500 }
    );
  }
}