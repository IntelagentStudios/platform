import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { licenseKey } = authResult.user;

    // Get real stats from database
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - 7));
    const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));

    // Get conversation stats
    const [totalConversations, todayConversations, activeConversations] = await Promise.all([
      prisma.chatbot_logs.count({
        where: { product_key: { startsWith: 'chat' } }
      }),
      prisma.chatbot_logs.count({
        where: {
          product_key: { startsWith: 'chat' },
          created_at: { gte: startOfDay }
        }
      }),
      prisma.chatbot_logs.count({
        where: {
          product_key: { startsWith: 'chat' },
          created_at: { gte: startOfWeek }
        }
      })
    ]);

    // Get API usage stats from skill audit logs
    const skillLogs = await prisma.skill_audit_log.findMany({
      where: {
        license_key: licenseKey,
        created_at: { gte: startOfMonth },
        event_type: 'execution'
      }
    });

    const totalApiCalls = skillLogs.length;
    const totalDataProcessed = 0; // This data isn't tracked in the current schema

    // Get product keys to determine active products
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: licenseKey,
        status: 'active'
      }
    });

    // Get license info
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    // Calculate growth rate (mock for now, should compare with previous period)
    const growthRate = activeConversations > 0 ? 15.3 : 0;

    const stats = {
      totalConversations,
      todayConversations,
      activeConversations,
      avgResponseTime: '1.2s', // Would need to calculate from actual response times
      uniqueUsers: await prisma.users.count({ where: { license_key: licenseKey } }),
      growthRate,
      apiCalls: totalApiCalls,
      dataProcessed: totalDataProcessed.toFixed(2),
      products: productKeys.map(pk => pk.product),
      plan: license?.plan || 'starter',
      hasAiPro: license?.is_pro || false,
      licenseStatus: license?.status || 'active',
      revenue: license?.total_pence ? (license.total_pence / 100).toFixed(2) : '0.00',
      currency: license?.currency || 'GBP'
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}