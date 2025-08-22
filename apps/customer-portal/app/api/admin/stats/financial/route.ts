import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@intelagent/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Plan pricing
    const planPricing = {
      basic: 29,
      starter: 19,
      pro: 99,
      enterprise: 299
    };

    // Fetch all active licenses
    const licenses = await prisma.licenses.findMany({
      where: { status: 'active' },
      select: { 
        plan: true,
        subscription_status: true,
        created_at: true
      }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = licenses.reduce((sum, license) => {
      if (license.subscription_status === 'active') {
        const plan = (license.plan || 'basic').toLowerCase();
        return sum + (planPricing[plan as keyof typeof planPricing] || 29);
      }
      return sum;
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate monthly revenue (for current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyLicenses = licenses.filter(license => {
      const createdAt = new Date(license.created_at);
      return createdAt >= currentMonth;
    });

    const monthlyRevenue = monthlyLicenses.reduce((sum, license) => {
      const plan = (license.plan || 'basic').toLowerCase();
      return sum + (planPricing[plan as keyof typeof planPricing] || 29);
    }, 0);

    // Calculate churn rate (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const expiredLastMonth = await prisma.licenses.count({
      where: {
        status: 'expired',
        created_at: {
          gte: lastMonth
        }
      }
    });

    const activeLastMonth = await prisma.licenses.count({
      where: {
        created_at: {
          lt: lastMonth
        }
      }
    });

    const churnRate = activeLastMonth > 0 ? 
      Math.round((expiredLastMonth / activeLastMonth) * 100 * 10) / 10 : 0;

    // Get revenue by plan
    const revenueByPlan = {};
    Object.keys(planPricing).forEach(plan => {
      const planLicenses = licenses.filter(l => 
        (l.plan || 'basic').toLowerCase() === plan && 
        l.subscription_status === 'active'
      );
      revenueByPlan[plan] = planLicenses.length * planPricing[plan as keyof typeof planPricing];
    });

    // Calculate growth metrics
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const previousMonthLicenses = await prisma.licenses.count({
      where: {
        status: 'active',
        created_at: {
          lt: currentMonth,
          gte: previousMonth
        }
      }
    });

    const growthRate = previousMonthLicenses > 0 ?
      Math.round(((licenses.length - previousMonthLicenses) / previousMonthLicenses) * 100) : 0;

    return NextResponse.json({
      monthlyRevenue,
      annualRevenue: arr,
      mrr,
      arr,
      churnRate,
      revenueByPlan,
      growthRate,
      totalCustomers: licenses.length,
      newCustomersThisMonth: monthlyLicenses.length,
      averageRevenuePerUser: licenses.length > 0 ? Math.round(mrr / licenses.length) : 0
    });

  } catch (error) {
    console.error('Admin financial stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial stats' },
      { status: 500 }
    );
  }
}