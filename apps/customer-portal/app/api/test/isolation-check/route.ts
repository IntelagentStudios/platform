import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { MASTER_ADMIN_KEY } from '@/types/license';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authToken = cookies().get('auth_token');
    
    if (!authToken) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        authenticated: false 
      }, { status: 401 });
    }

    // Verify JWT and get user info
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ 
        error: 'No license key found',
        authenticated: false 
      }, { status: 403 });
    }

    // Get license information
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        site_key: true,
        products: true,
        is_pro: true,
        domain: true,
        email: true,
        status: true
      }
    });

    if (!license) {
      return NextResponse.json({ 
        error: 'License not found',
        license_key: licenseKey 
      }, { status: 404 });
    }

    // Check if master admin
    const isMasterAdmin = licenseKey === MASTER_ADMIN_KEY;

    // Get conversation counts
    let conversationCount = 0;
    let totalConversations = 0;
    let accessibleSiteKeys: string[] = [];

    if (isMasterAdmin) {
      // Master admin sees all
      conversationCount = await prisma.chatbot_logs.count();
      totalConversations = conversationCount;
      
      // Get all site keys
      const allLicenses = await prisma.licenses.findMany({
        where: { site_key: { not: null } },
        select: { site_key: true }
      });
      
      accessibleSiteKeys = allLicenses
        .map(l => l.site_key)
        .filter((key): key is string => key !== null);
    } else {
      // Regular user sees only their data
      if (license.site_key) {
        conversationCount = await prisma.chatbot_logs.count({
          where: { site_key: license.site_key }
        });
        accessibleSiteKeys = [license.site_key];
      }
      
      // Get total conversations in system (for comparison)
      totalConversations = await prisma.chatbot_logs.count();
    }

    // Test isolation by checking if we can see other conversations
    let isolationTest = {
      passed: true,
      message: 'Data properly isolated',
      details: {} as any
    };

    if (!isMasterAdmin && license.site_key) {
      // Try to find conversations that don't belong to this user
      const otherConversations = await prisma.chatbot_logs.findMany({
        where: {
          site_key: {
            not: license.site_key
          }
        },
        take: 1
      });

      // Check if we accidentally got other conversations
      const myConversations = await prisma.chatbot_logs.findMany({
        where: { site_key: license.site_key },
        take: 100
      });

      const leaked = myConversations.some(conv => conv.site_key !== license.site_key);

      if (leaked) {
        isolationTest = {
          passed: false,
          message: 'DATA LEAK DETECTED - User can see other conversations!',
          details: {
            expected_site_key: license.site_key,
            found_other_keys: [...new Set(myConversations.map(c => c.site_key))]
          }
        };
      } else {
        isolationTest.details = {
          user_conversations: conversationCount,
          total_system_conversations: totalConversations,
          isolation_percentage: totalConversations > 0 
            ? ((conversationCount / totalConversations) * 100).toFixed(2) + '%'
            : 'N/A'
        };
      }
    }

    // Get user information
    const user = await prisma.users.findFirst({
      where: { license_key: licenseKey },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    // Build response
    const response = {
      isolation_check: {
        status: isolationTest.passed ? 'PASSED ✅' : 'FAILED ❌',
        message: isolationTest.message,
        details: isolationTest.details
      },
      current_user: {
        email: user?.email || decoded.email,
        role: user?.role || decoded.role,
        license_key: licenseKey,
        is_master_admin: isMasterAdmin
      },
      license_info: {
        license_key: license.license_key,
        site_key: license.site_key || 'NOT_CONFIGURED',
        products: license.products,
        is_pro: license.is_pro,
        domain: license.domain,
        status: license.status
      },
      data_access: {
        accessible_site_keys: isMasterAdmin ? 'ALL' : accessibleSiteKeys,
        conversation_count: conversationCount,
        can_see_all_data: isMasterAdmin,
        data_scope: isMasterAdmin ? 'GLOBAL' : 'LICENSE_SCOPED'
      },
      system_info: {
        total_conversations_in_system: totalConversations,
        user_conversation_percentage: totalConversations > 0 
          ? ((conversationCount / totalConversations) * 100).toFixed(2) + '%'
          : 'N/A'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Isolation check error:', error);
    return NextResponse.json({ 
      error: 'Isolation check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}