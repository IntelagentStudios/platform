import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get license statistics (excluding admin and test accounts)
    const baseFilter = {
      AND: [
        { email: { not: 'admin@intelagentstudios.com' } },
        { NOT: { email: { contains: 'test' } } }
      ]
    };

    const [
      totalLicenses,
      activeLicenses,
      suspendedLicenses,
      productStats,
      planStats,
      revenueStats
    ] = await Promise.all([
      // Total licenses
      prisma.licenses.count({
        where: baseFilter
      }),
      
      // Active licenses
      prisma.licenses.count({
        where: {
          ...baseFilter,
          status: 'active'
        }
      }),
      
      // Suspended licenses
      prisma.licenses.count({
        where: {
          ...baseFilter,
          status: { in: ['suspended', 'expired', 'revoked'] }
        }
      }),
      
      // Products distribution
      prisma.$queryRaw`
        SELECT 
          product,
          COUNT(*) as count
        FROM licenses,
        LATERAL unnest(products) AS product
        WHERE email != 'admin@intelagentstudios.com'
          AND email NOT LIKE '%test%'
        GROUP BY product
      `,
      
      // Plan distribution
      prisma.licenses.groupBy({
        by: ['plan'],
        where: baseFilter,
        _count: true
      }),
      
      // Revenue stats (mock data for now - replace with Stripe integration)
      Promise.resolve({
        total_revenue: 125000,
        mrr: 12500
      })
    ]);

    // Calculate products distribution
    const products_distribution: Record<string, number> = {};
    (productStats as any[]).forEach(stat => {
      products_distribution[stat.product] = parseInt(stat.count);
    });

    // Calculate plan distribution
    const plan_distribution: Record<string, number> = {};
    planStats.forEach(stat => {
      if (stat.plan) {
        plan_distribution[stat.plan] = stat._count;
      }
    });

    return NextResponse.json({
      total_licenses: totalLicenses,
      active_licenses: activeLicenses,
      suspended_licenses: suspendedLicenses,
      products_distribution,
      plan_distribution,
      total_revenue: revenueStats.total_revenue,
      mrr: revenueStats.mrr
    });

  } catch (error: any) {
    console.error('License stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch license statistics', details: error.message },
      { status: 500 }
    );
  }
}