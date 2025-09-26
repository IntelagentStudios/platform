import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user context from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    // Get user details if logged in
    let userIndustry = null;
    let userRole = null;
    if (licenseKey) {
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        select: {
          license_type: true,
          metadata: true
        }
      });
      
      if (license?.metadata && typeof license.metadata === 'object') {
        const metadata = license.metadata as any;
        userIndustry = metadata.industry || null;
        userRole = metadata.role || null;
      }
    }

    // Pre-built agents catalog
    const agents = [
      {
        id: 'sales-pro',
        name: 'Sales Pro Agent',
        description: 'Complete sales automation with lead generation, email outreach, and CRM integration',
        category: 'Sales',
        price: 299,
        features: [
          'Automated lead generation',
          'Personalized email campaigns',
          'CRM integration',
          'Performance analytics'
        ],
        skillsIncluded: 45,
        rating: 4.8,
        reviews: 234,
        recommended: userIndustry === 'ecommerce' || userIndustry === 'saas'
      },
      {
        id: 'customer-support',
        name: 'Customer Support AI',
        description: '24/7 automated customer support with intelligent ticket routing and resolution',
        category: 'Support',
        price: 199,
        features: [
          'Multi-channel support',
          'Ticket prioritization',
          'Knowledge base integration',
          'Sentiment analysis'
        ],
        skillsIncluded: 32,
        rating: 4.9,
        reviews: 189,
        recommended: userIndustry === 'ecommerce' || userIndustry === 'retail'
      },
      {
        id: 'marketing-genius',
        name: 'Marketing Genius',
        description: 'AI-powered marketing automation for content creation, SEO, and campaign management',
        category: 'Marketing',
        price: 249,
        features: [
          'Content generation',
          'SEO optimization',
          'Social media automation',
          'Campaign analytics'
        ],
        skillsIncluded: 38,
        rating: 4.7,
        reviews: 156,
        recommended: userIndustry === 'marketing' || userIndustry === 'agency'
      },
      {
        id: 'data-wizard',
        name: 'Data Analytics Wizard',
        description: 'Advanced data analysis and visualization with predictive insights',
        category: 'Analytics',
        price: 399,
        features: [
          'Real-time dashboards',
          'Predictive analytics',
          'Custom reports',
          'Data integration'
        ],
        skillsIncluded: 52,
        rating: 4.6,
        reviews: 98,
        recommended: userIndustry === 'finance' || userIndustry === 'healthcare'
      },
      {
        id: 'hr-assistant',
        name: 'HR Assistant Plus',
        description: 'Streamline recruitment, onboarding, and employee management',
        category: 'HR',
        price: 179,
        features: [
          'Resume screening',
          'Interview scheduling',
          'Onboarding automation',
          'Performance tracking'
        ],
        skillsIncluded: 28,
        rating: 4.5,
        reviews: 67,
        recommended: userIndustry === 'enterprise' || userIndustry === 'startup'
      },
      {
        id: 'finance-bot',
        name: 'Finance Bot Pro',
        description: 'Automated bookkeeping, invoicing, and financial reporting',
        category: 'Finance',
        price: 329,
        features: [
          'Automated bookkeeping',
          'Invoice processing',
          'Expense tracking',
          'Financial forecasting'
        ],
        skillsIncluded: 41,
        rating: 4.8,
        reviews: 143,
        recommended: userIndustry === 'accounting' || userIndustry === 'consulting'
      }
    ];

    // Sort by recommendation if user is logged in
    if (licenseKey) {
      agents.sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return b.rating - a.rating;
      });
    }

    return NextResponse.json({
      success: true,
      agents,
      userContext: {
        isLoggedIn: !!licenseKey,
        industry: userIndustry,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, action } = body;
    
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (action === 'purchase') {
      // Log the purchase intent
      await prisma.skill_audit_log.create({
        data: {
          event_type: 'marketplace_purchase_intent',
          skill_id: agentId,
          user_id: userId,
          license_key: licenseKey,
          event_data: {
            agent_id: agentId,
            timestamp: new Date()
          },
          created_at: new Date()
        }
      });
      
      // Return Stripe checkout URL (would be implemented with Stripe)
      return NextResponse.json({
        success: true,
        checkoutUrl: `/billing?agent=${agentId}`
      });
    }
    
    if (action === 'preview') {
      // Log preview event
      await prisma.skill_audit_log.create({
        data: {
          event_type: 'marketplace_preview',
          skill_id: agentId,
          user_id: userId,
          license_key: licenseKey,
          event_data: {
            agent_id: agentId
          },
          created_at: new Date()
        }
      });
      
      return NextResponse.json({
        success: true,
        previewUrl: `/marketplace/preview/${agentId}`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing marketplace action:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}