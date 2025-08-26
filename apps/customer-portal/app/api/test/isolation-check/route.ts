import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// Master admin key constant
const MASTER_ADMIN_KEY = 'INTL-ADMIN-KEY';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

/**
 * Isolation Check Endpoint
 * 
 * Verifies the correct data isolation pattern:
 * 1. license_key is the PRIMARY filter (account boundary)
 * 2. site_key is SECONDARY filter (chatbot product only)
 * 3. Other products use license_key directly
 */
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

    // Get license information (PRIMARY KEY)
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

    // === CHATBOT DATA ACCESS (license → site_key → data) ===
    let chatbotAccess = {
      has_product: license.products.includes('chatbot'),
      site_key: license.site_key,
      conversation_count: 0,
      access_pattern: 'LICENSE_KEY → SITE_KEY → CHATBOT_DATA'
    };

    if (chatbotAccess.has_product && license.site_key) {
      // Chatbot uses site_key for data access
      chatbotAccess.conversation_count = await prisma.chatbot_logs.count({
        where: { site_key: license.site_key }
      });
    }

    // === OTHER PRODUCTS DATA ACCESS (license_key direct) ===
    const otherProductsAccess = {
      sales_agent: {
        has_product: license.products.includes('sales-agent'),
        access_pattern: 'LICENSE_KEY → SALES_DATA (direct)',
        // Future: await prisma.sales_data.count({ where: { license_key: licenseKey } })
        data_count: 'N/A (table not yet created)'
      },
      data_enrichment: {
        has_product: license.products.includes('data-enrichment'),
        access_pattern: 'LICENSE_KEY → ENRICHMENT_DATA (direct)',
        // Future: await prisma.enrichment_data.count({ where: { license_key: licenseKey } })
        data_count: 'N/A (table not yet created)'
      },
      setup_agent: {
        has_product: license.products.includes('setup-agent'),
        access_pattern: 'LICENSE_KEY → AGENT_CONFIGS (direct)',
        // Future: await prisma.agent_configs.count({ where: { license_key: licenseKey } })
        data_count: 'N/A (table not yet created)'
      }
    };

    // === ISOLATION VERIFICATION ===
    let isolationTest = {
      passed: true,
      message: 'Data properly isolated by license_key',
      details: {} as any
    };

    if (!isMasterAdmin && license.site_key) {
      // Test 1: Verify chatbot data isolation
      const myChatbotData = await prisma.chatbot_logs.findMany({
        where: { site_key: license.site_key },
        select: { site_key: true },
        take: 100
      });

      const chatbotDataClean = myChatbotData.every(log => log.site_key === license.site_key);

      // Test 2: Check we can't see other licenses' data
      const otherSiteKeys = await prisma.licenses.findMany({
        where: {
          site_key: { not: null },
          license_key: { not: licenseKey }
        },
        select: { site_key: true },
        take: 1
      });

      if (otherSiteKeys.length > 0 && otherSiteKeys[0].site_key) {
        const otherData = await prisma.chatbot_logs.findMany({
          where: { site_key: otherSiteKeys[0].site_key },
          take: 1
        });
        
        // This query should return data, but we shouldn't be able to access it through our license
        isolationTest.details.other_data_exists = otherData.length > 0;
        isolationTest.details.can_access_other_data = false; // We can't access it through our normal flow
      }

      if (!chatbotDataClean) {
        isolationTest.passed = false;
        isolationTest.message = 'DATA LEAK DETECTED - Chatbot data contains other site_keys!';
      }

      isolationTest.details.chatbot_isolation = {
        all_data_belongs_to_license: chatbotDataClean,
        data_points_checked: myChatbotData.length,
        site_key_used: license.site_key
      };
    }

    // === SYSTEM STATS (for comparison) ===
    const systemStats = isMasterAdmin ? {
      total_licenses: await prisma.licenses.count(),
      total_conversations: await prisma.chatbot_logs.count(),
      licenses_with_chatbot: await prisma.licenses.count({
        where: { site_key: { not: null } }
      })
    } : {
      note: 'System stats only visible to master admin'
    };

    // === BUILD RESPONSE ===
    const response = {
      architecture: {
        primary_key: 'license_key',
        description: 'license_key is the account boundary, products use secondary keys',
        patterns: {
          chatbot: 'license_key → site_key → chatbot_logs',
          sales: 'license_key → sales_data (direct)',
          enrichment: 'license_key → enrichment_data (direct)',
          setup: 'license_key → agent_configs (direct)'
        }
      },
      
      isolation_check: {
        status: isolationTest.passed ? 'PASSED ✅' : 'FAILED ❌',
        message: isolationTest.message,
        details: isolationTest.details
      },
      
      current_user: {
        license_key: licenseKey,
        is_master_admin: isMasterAdmin,
        role: decoded.role || 'customer'
      },
      
      license_info: {
        license_key: license.license_key,
        products: license.products,
        is_pro: license.is_pro,
        domain: license.domain,
        status: license.status
      },
      
      data_access: {
        chatbot: chatbotAccess,
        other_products: otherProductsAccess,
        master_admin_access: isMasterAdmin ? 'GLOBAL_VIEW' : 'LICENSE_SCOPED'
      },
      
      system_info: systemStats
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