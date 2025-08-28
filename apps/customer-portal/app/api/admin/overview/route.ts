import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Fetch real statistics
    const [
      totalLicenses,
      activeLicenses,
      trialLicenses,
      expiredLicenses,
      totalUsers,
      verifiedUsers,
      totalProductKeys,
      activeProductKeys,
      recentActivity,
      monthlyRevenue
    ] = await Promise.all([
      prisma.licenses.count(),
      prisma.licenses.count({ where: { status: 'active' } }),
      prisma.licenses.count({ where: { status: 'trial' } }),
      prisma.licenses.count({ where: { status: 'expired' } }),
      prisma.users.count(),
      prisma.users.count({ where: { email_verified: true } }),
      prisma.product_keys.count(),
      prisma.product_keys.count({ where: { status: 'active' } }),
      // Recent activity (last 10 logs)
      prisma.chatbot_logs.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        select: {
          timestamp: true,
          product_key: true,
          conversation_id: true,
          session_id: true
        }
      }),
      // Calculate monthly revenue (simplified - you'd need actual payment data)
      prisma.licenses.aggregate({
        where: {
          status: 'active',
          created_at: {
            gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _count: true
      })
    ]);
    
    // Get product distribution
    const productDistribution = await prisma.product_keys.groupBy({
      by: ['product'],
      _count: true
    });
    
    // Get recent user signups
    const recentUsers = await prisma.users.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        email: true,
        created_at: true,
        email_verified: true,
        license_key: true
      }
    });
    
    // Calculate system health metrics
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeInLast24h = await prisma.chatbot_logs.count({
      where: {
        timestamp: { gte: oneDayAgo }
      }
    });
    
    return NextResponse.json({
      overview: {
        licenses: {
          total: totalLicenses,
          active: activeLicenses,
          trial: trialLicenses,
          expired: expiredLicenses
        },
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers
        },
        productKeys: {
          total: totalProductKeys,
          active: activeProductKeys,
          distribution: productDistribution
        },
        revenue: {
          monthly: monthlyRevenue._count * 300, // Assuming $300 per license
          currency: 'GBP'
        },
        systemHealth: {
          activeInLast24h,
          totalApiCalls: recentActivity.length,
          uptime: 99.9, // You'd calculate this from actual monitoring
          responseTime: 150 // ms - you'd get this from monitoring
        },
        recentActivity: recentActivity.map(log => ({
          timestamp: log.timestamp,
          productKey: log.product_key,
          conversationId: log.conversation_id,
          type: 'chatbot_interaction'
        })),
        recentUsers
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json({ error: 'Failed to fetch overview data' }, { status: 500 });
  }
}