import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get license key from cookie or header
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value || 
                      request.headers.get('x-license-key');

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'No license key provided' },
        { status: 401 }
      );
    }

    // Fetch license details
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        customer_name: true,
        email: true,
        plan: true,
        products: true,
        status: true,
        created_at: true,
        used_at: true
      }
    });

    if (!license || license.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive license' },
        { status: 403 }
      );
    }

    // Update last used
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: { used_at: new Date() }
    });

    // Get usage data (mock for now - replace with real data)
    const usage = {
      chatbot: { current: 450, limit: 1000 },
      sales_agent: { current: 75, limit: 100 },
      setup_agent: { current: 12, limit: 50 },
      enrichment: { current: 234, limit: 500 },
      ai_insights: { current: 5, limit: 10 }
    };

    // Define all available products
    const allProducts = [
      { id: 'chatbot', name: 'Chatbot', description: 'AI-powered customer support' },
      { id: 'sales_agent', name: 'Sales Agent', description: 'Automated lead generation' },
      { id: 'setup_agent', name: 'Setup Agent', description: 'Conversational forms' },
      { id: 'enrichment', name: 'Data Enrichment', description: 'Company and contact data' },
      { id: 'ai_insights', name: 'AI Insights', description: 'Predictive analytics' }
    ];

    // Determine product status
    const products = allProducts.map(product => ({
      ...product,
      status: license.products.includes(product.id) ? 'active' : 'not_purchased',
      metrics: license.products.includes(product.id) ? getProductMetrics(product.id) : undefined
    }));

    // Get recent activity (mock data)
    const activity = [
      {
        icon: '💬',
        color: 'blue',
        title: 'New chatbot conversation',
        description: '15 messages exchanged with visitor',
        time: '2 minutes ago',
        product: 'chatbot'
      },
      {
        icon: '📧',
        color: 'green',
        title: 'Email campaign sent',
        description: '250 emails delivered successfully',
        time: '1 hour ago',
        product: 'sales_agent'
      },
      {
        icon: '📝',
        color: 'yellow',
        title: 'Form completed',
        description: 'Onboarding form submitted by new user',
        time: '3 hours ago',
        product: 'setup_agent'
      },
      {
        icon: '🔍',
        color: 'purple',
        title: 'Data enriched',
        description: '50 new contacts added to database',
        time: '5 hours ago',
        product: 'enrichment'
      },
      {
        icon: '🧠',
        color: 'pink',
        title: 'New insight available',
        description: 'Conversion rate trend analysis ready',
        time: '1 day ago',
        product: 'ai_insights'
      }
    ];

    // Check if user has access to AI insights
    const isPremium = license.plan === 'professional' || license.plan === 'enterprise';
    const insights = isPremium ? {
      available: true,
      summary: 'Your chatbot engagement is up 23% this week. Customer satisfaction scores have improved.',
      recommendations: [
        {
          title: 'Optimize Response Time',
          description: 'Your chatbot response time has increased. Consider simplifying complex flows.',
          priority: 'high',
          impact: '+15% satisfaction score',
          product: 'chatbot'
        },
        {
          title: 'Expand Email Campaigns',
          description: 'Tuesday mornings show 40% higher open rates for your audience.',
          priority: 'medium',
          impact: '+25% open rate',
          product: 'sales_agent'
        }
      ]
    } : {
      available: false
    };

    return NextResponse.json({
      license: {
        key: license.license_key,
        plan: license.plan,
        status: license.status,
        products: license.products,
        usage,
        expiration: null // Add if you have expiration dates
      },
      products,
      insights,
      activity
    });

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

function getProductMetrics(productId: string) {
  // Mock metrics - replace with real data
  const metrics: Record<string, any> = {
    chatbot: {
      primary: '1,234',
      trend: 12,
      label: 'Total Conversations'
    },
    sales_agent: {
      primary: '456',
      trend: 8,
      label: 'Leads Generated'
    },
    setup_agent: {
      primary: '89',
      trend: -3,
      label: 'Forms Completed'
    },
    enrichment: {
      primary: '2,345',
      trend: 15,
      label: 'Data Points'
    },
    ai_insights: {
      primary: '23',
      trend: 5,
      label: 'Insights Generated'
    }
  };

  return metrics[productId] || { primary: '0', trend: 0, label: 'N/A' };
}