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

    // Calculate date ranges for growth metrics
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch comprehensive platform statistics
    const [
      // License metrics
      totalLicenses,
      activeLicenses,
      trialLicenses,
      expiredLicenses,
      licensesLastMonth,

      // User metrics
      totalUsers,
      verifiedUsers,
      usersLastMonth,

      // Product key metrics
      totalProductKeys,
      activeProductKeys,
      productDistribution,

      // Revenue metrics
      totalRevenue,
      monthlyRevenue,
      revenueLastMonth,

      // Activity metrics
      recentActivity,
      activeInLast24h,
      totalApiCalls
    ] = await Promise.all([
      // License counts
      prisma.licenses.count({
        where: {
          AND: [
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.licenses.count({
        where: {
          AND: [
            { status: 'active' },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.licenses.count({ where: { status: 'trial' } }),
      prisma.licenses.count({ where: { status: 'expired' } }),
      prisma.licenses.count({
        where: {
          AND: [
            { created_at: { gte: oneMonthAgo } },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),

      // User counts
      prisma.users.count({
        where: {
          AND: [
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.users.count({
        where: {
          AND: [
            { email_verified: true },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.users.count({
        where: {
          AND: [
            { created_at: { gte: oneMonthAgo } },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),

      // Product key counts
      prisma.product_keys.count(),
      prisma.product_keys.count({ where: { status: 'active' } }),
      prisma.product_keys.groupBy({
        by: ['product'],
        _count: true
      }),

      // Revenue calculations (from licenses table)
      prisma.licenses.aggregate({
        _sum: { total_pence: true },
        where: {
          AND: [
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.licenses.aggregate({
        _sum: { total_pence: true },
        where: {
          AND: [
            { last_payment_date: { gte: oneMonthAgo } },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),
      prisma.licenses.aggregate({
        _sum: { total_pence: true },
        where: {
          AND: [
            { last_payment_date: { gte: twoMonthsAgo, lt: oneMonthAgo } },
            { NOT: { email: { contains: 'test' } } },
            { email: { not: 'admin@intelagentstudios.com' } }
          ]
        }
      }),

      // Activity metrics
      prisma.chatbot_logs.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          timestamp: true,
          product_key: true,
          conversation_id: true,
          session_id: true
        }
      }),
      prisma.chatbot_logs.count({
        where: {
          timestamp: { gte: oneDayAgo }
        }
      }),
      prisma.chatbot_logs.count()
    ]);

    // Calculate growth percentages
    const licenseGrowth = licensesLastMonth > 0 ?
      ((totalLicenses - (totalLicenses - licensesLastMonth)) / (totalLicenses - licensesLastMonth)) * 100 : 0;

    const userGrowth = usersLastMonth > 0 ?
      ((totalUsers - (totalUsers - usersLastMonth)) / (totalUsers - usersLastMonth)) * 100 : 0;

    const currentMonthRevenue = (monthlyRevenue._sum.total_pence || 0) / 100;
    const lastMonthRevenue = (revenueLastMonth._sum.total_pence || 0) / 100;
    const revenueGrowth = lastMonthRevenue > 0 ?
      ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return NextResponse.json({
      stats: {
        licenses: {
          total: totalLicenses,
          active: activeLicenses,
          trial: trialLicenses,
          expired: expiredLicenses,
          growth: Math.round(licenseGrowth * 100) / 100
        },
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          growth: Math.round(userGrowth * 100) / 100
        },
        productKeys: {
          total: totalProductKeys,
          active: activeProductKeys,
          distribution: productDistribution
        },
        revenue: {
          monthly: currentMonthRevenue,
          total: (totalRevenue._sum.total_pence || 0) / 100,
          currency: 'GBP',
          growth: Math.round(revenueGrowth * 100) / 100
        },
        systemHealth: {
          activeInLast24h,
          totalApiCalls,
          uptime: 99.9, // You'd calculate this from actual monitoring
          responseTime: 150 // ms - you'd get this from monitoring
        },
        recentActivity: recentActivity.map(log => ({
          timestamp: log.timestamp,
          productKey: log.product_key,
          conversationId: log.conversation_id,
          type: 'chatbot_interaction'
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json({ error: 'Failed to fetch platform statistics' }, { status: 500 });
  }
}