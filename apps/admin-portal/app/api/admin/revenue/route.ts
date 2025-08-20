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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(2020); // All time
    }

    // Get active licenses with payment information
    const licenses = await prisma.licenses.findMany({
      where: {
        status: 'active',
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        license_key: true,
        customer_name: true,
        email: true,
        plan: true,
        products: true,
        created_at: true,
        subscription_id: true
      }
    });

    // Calculate revenue metrics (mock data - replace with actual Stripe data)
    const mrr = licenses.length * 99; // Average $99/month
    const arr = mrr * 12;
    const totalRevenue = licenses.length * 297; // Assuming 3 months average
    const arpu = licenses.length > 0 ? mrr / licenses.length : 0;
    const ltv = arpu * 24; // 24 months average lifetime
    const churnRate = 5.2; // Mock 5.2% monthly churn
    const growthRate = 15.3; // Mock 15.3% growth

    // Revenue by product (mock data)
    const revenueByProduct: Record<string, number> = {
      chatbot: mrr * 0.4,
      sales_agent: mrr * 0.35,
      setup_agent: mrr * 0.1,
      enrichment: mrr * 0.1,
      ai_insights: mrr * 0.05
    };

    // Revenue by plan (mock data)
    const revenueByPlan: Record<string, number> = {
      starter: mrr * 0.2,
      professional: mrr * 0.5,
      enterprise: mrr * 0.3
    };

    // Monthly revenue trend (mock data)
    const monthlyRevenue = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      monthlyRevenue.push({
        month: months[monthIndex],
        revenue: Math.floor(mrr * (0.8 + Math.random() * 0.4)),
        new_customers: Math.floor(5 + Math.random() * 10),
        churned_customers: Math.floor(1 + Math.random() * 3),
        net_revenue_change: Math.floor(-500 + Math.random() * 2000)
      });
    }

    // Top customers (mock data - replace with actual data)
    const topCustomers = licenses.slice(0, 10).map(license => ({
      customer_name: license.customer_name || 'Unknown',
      email: license.email || '',
      total_spent: Math.floor(500 + Math.random() * 5000),
      products: license.products,
      plan: license.plan || 'starter',
      customer_since: license.created_at?.toISOString() || new Date().toISOString()
    }));

    // Cohort data (mock data)
    const cohortData = [
      { cohort: 'Jan 2024', month_0: 100, month_1: 92, month_2: 85, month_3: 80, month_6: 70, month_12: 60 },
      { cohort: 'Feb 2024', month_0: 100, month_1: 94, month_2: 88, month_3: 83, month_6: 73, month_12: 0 },
      { cohort: 'Mar 2024', month_0: 100, month_1: 91, month_2: 86, month_3: 81, month_6: 71, month_12: 0 },
      { cohort: 'Apr 2024', month_0: 100, month_1: 93, month_2: 87, month_3: 82, month_6: 0, month_12: 0 },
      { cohort: 'May 2024', month_0: 100, month_1: 95, month_2: 89, month_3: 84, month_6: 0, month_12: 0 },
      { cohort: 'Jun 2024', month_0: 100, month_1: 94, month_2: 88, month_3: 0, month_6: 0, month_12: 0 }
    ];

    return NextResponse.json({
      mrr,
      mrr_growth: growthRate,
      arr,
      total_revenue: totalRevenue,
      average_revenue_per_user: arpu,
      lifetime_value: ltv,
      churn_rate: churnRate,
      growth_rate: growthRate,
      paying_customers: licenses.length,
      trial_customers: Math.floor(licenses.length * 0.3),
      revenue_by_product: revenueByProduct,
      revenue_by_plan: revenueByPlan,
      monthly_revenue: monthlyRevenue,
      top_customers: topCustomers,
      cohort_data: cohortData
    });

  } catch (error: any) {
    console.error('Revenue data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data', details: error.message },
      { status: 500 }
    );
  }
}