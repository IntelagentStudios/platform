import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Check Platform Intelligence eligibility and status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Check if user already has Platform Intelligence
    const existingSubscription = await prisma.platform_subscriptions.findUnique({
      where: { license_key: user.license_key }
    });

    // Get user's active products
    const activeProducts = await prisma.product_keys.findMany({
      where: {
        license_key: user.license_key,
        status: 'active'
      }
    });

    // Get product configurations for detailed info
    const configurations = await prisma.product_configurations.findMany({
      where: {
        license_key: user.license_key,
        status: 'active'
      }
    });

    // Calculate cross-product synergies
    const synergies = calculateSynergies(activeProducts, configurations);

    // Generate intelligence insights preview
    const insightsPreview = generateInsightsPreview(activeProducts, configurations);

    // Calculate potential ROI
    const roi = calculatePlatformROI(activeProducts, configurations);

    if (existingSubscription) {
      // User has Platform Intelligence - show current status and usage
      const usage = await calculatePlatformUsage(user.license_key);
      
      return NextResponse.json({
        hasSubscription: true,
        subscription: {
          tier: existingSubscription.subscription_tier,
          status: existingSubscription.status,
          productsConnected: existingSubscription.product_count,
          features: existingSubscription.intelligence_features,
          monthlyPrice: existingSubscription.monthly_price_pence / 100,
          activeSince: existingSubscription.activated_at,
          limits: {
            maxProducts: existingSubscription.max_products,
            maxWorkflows: existingSubscription.max_workflows,
            maxApiCalls: existingSubscription.max_api_calls
          }
        },
        usage,
        insights: await getActualInsights(user.license_key),
        recommendations: generatePlatformRecommendations(usage, activeProducts)
      });
    } else {
      // User doesn't have Platform Intelligence - show what they could get
      return NextResponse.json({
        hasSubscription: false,
        eligible: activeProducts.length >= 2,
        eligibilityReason: activeProducts.length < 2 
          ? `You need at least 2 active products (currently have ${activeProducts.length})`
          : null,
        preview: {
          productsToConnect: activeProducts.length,
          potentialSynergies: synergies,
          insightsPreview,
          estimatedROI: roi,
          features: {
            unifiedAnalytics: {
              name: 'Unified Analytics Dashboard',
              description: 'See all your product metrics in one place',
              value: 'Save 5+ hours per week on reporting'
            },
            crossProductInsights: {
              name: 'Cross-Product Intelligence',
              description: 'Discover patterns across all your tools',
              value: 'Identify opportunities you\'re missing'
            },
            workflowOrchestration: {
              name: 'Intelligent Workflow Orchestration',
              description: 'Automate complex multi-product workflows',
              value: 'Reduce manual work by 70%'
            },
            intelligentRouting: {
              name: 'Smart Task Routing',
              description: 'Automatically route tasks to the best agent',
              value: 'Improve response times by 50%'
            },
            predictiveAnalytics: {
              name: 'Predictive Analytics',
              description: 'Forecast trends and prevent issues',
              value: 'Reduce churn by 30%',
              tier: 'premium'
            },
            customReporting: {
              name: 'Custom Report Builder',
              description: 'Create any report from unified data',
              value: 'Executive-ready insights',
              tier: 'premium'
            },
            apiAccess: {
              name: 'Full API Access',
              description: 'Programmatic control of all products',
              value: 'Integrate with any system',
              tier: 'enterprise'
            }
          }
        },
        pricing: {
          standard: {
            monthlyPrice: 999,
            features: ['unifiedAnalytics', 'crossProductInsights', 'workflowOrchestration', 'intelligentRouting'],
            maxProducts: 10,
            maxWorkflows: 100
          },
          premium: {
            monthlyPrice: 1499,
            features: ['all_standard', 'predictiveAnalytics', 'customReporting'],
            maxProducts: 25,
            maxWorkflows: 500
          },
          enterprise: {
            monthlyPrice: 2999,
            features: ['all_premium', 'apiAccess', 'dedicated_support'],
            maxProducts: -1, // Unlimited
            maxWorkflows: -1 // Unlimited
          }
        }
      });
    }

  } catch (error: any) {
    console.error('Error checking Platform Intelligence:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check Platform Intelligence' },
      { status: 500 }
    );
  }
}

// POST: Activate Platform Intelligence subscription
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const body = await request.json();
    const { tier = 'standard' } = body;

    // Check eligibility
    const activeProducts = await prisma.product_keys.findMany({
      where: {
        license_key: user.license_key,
        status: 'active'
      }
    });

    if (activeProducts.length < 2) {
      return NextResponse.json(
        { error: 'You need at least 2 active products to enable Platform Intelligence' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.platform_subscriptions.findUnique({
      where: { license_key: user.license_key }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Platform Intelligence already active' },
        { status: 400 }
      );
    }

    // Define tier features
    const tierFeatures: Record<string, any> = {
      standard: {
        price: 99900,
        features: {
          unified_analytics: true,
          cross_product_insights: true,
          workflow_orchestration: true,
          intelligent_routing: true,
          predictive_analytics: false,
          custom_reporting: false,
          api_access: false
        },
        maxProducts: 10,
        maxWorkflows: 100,
        maxApiCalls: 10000
      },
      premium: {
        price: 149900,
        features: {
          unified_analytics: true,
          cross_product_insights: true,
          workflow_orchestration: true,
          intelligent_routing: true,
          predictive_analytics: true,
          custom_reporting: true,
          api_access: false
        },
        maxProducts: 25,
        maxWorkflows: 500,
        maxApiCalls: 50000
      },
      enterprise: {
        price: 299900,
        features: {
          unified_analytics: true,
          cross_product_insights: true,
          workflow_orchestration: true,
          intelligent_routing: true,
          predictive_analytics: true,
          custom_reporting: true,
          api_access: true
        },
        maxProducts: 999,
        maxWorkflows: 9999,
        maxApiCalls: 999999
      }
    };

    const selectedTier = tierFeatures[tier] || tierFeatures.standard;

    // Create Platform Intelligence subscription
    const subscription = await prisma.platform_subscriptions.create({
      data: {
        license_key: user.license_key,
        subscription_tier: tier,
        monthly_price_pence: selectedTier.price,
        products_connected: activeProducts.map(p => p.product_key),
        product_count: activeProducts.length,
        intelligence_features: selectedTier.features,
        max_products: selectedTier.maxProducts,
        max_workflows: selectedTier.maxWorkflows,
        max_api_calls: selectedTier.maxApiCalls,
        status: 'active'
      }
    });

    // Initialize cross-product data sync
    await initializeCrossProductSync(user.license_key, activeProducts);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: subscription.subscription_tier,
        monthlyPrice: subscription.monthly_price_pence / 100,
        productsConnected: subscription.product_count,
        features: subscription.intelligence_features,
        activatedAt: subscription.activated_at
      },
      message: 'Platform Intelligence activated successfully'
    });

  } catch (error: any) {
    console.error('Error activating Platform Intelligence:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate Platform Intelligence' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateSynergies(products: any[], configurations: any[]): any[] {
  const synergies = [];
  
  const productTypes = new Set(products.map(p => p.product));
  
  if (productTypes.has('chatbot') && productTypes.has('sales_outreach')) {
    synergies.push({
      products: ['chatbot', 'sales_outreach'],
      type: 'Lead Qualification Pipeline',
      description: 'Chatbot qualifies leads and automatically hands off to sales agent',
      efficiency: '+45% conversion rate'
    });
  }

  if (productTypes.has('sales_outreach') && productTypes.has('onboarding')) {
    synergies.push({
      products: ['sales_outreach', 'onboarding'],
      type: 'Seamless Customer Journey',
      description: 'Closed deals automatically trigger onboarding workflows',
      efficiency: '3x faster time-to-value'
    });
  }

  if (productTypes.has('chatbot') && productTypes.has('onboarding')) {
    synergies.push({
      products: ['chatbot', 'onboarding'],
      type: 'Self-Service Onboarding',
      description: 'Chatbot guides users through intelligent onboarding',
      efficiency: '80% reduction in support tickets'
    });
  }

  if (products.length >= 3) {
    synergies.push({
      products: ['all'],
      type: 'Complete Business Automation',
      description: 'End-to-end automation from first contact to customer success',
      efficiency: '10x operational efficiency'
    });
  }

  return synergies;
}

function generateInsightsPreview(products: any[], configurations: any[]): any[] {
  return [
    {
      type: 'pattern',
      title: 'Peak Usage Pattern Detected',
      description: 'Your chatbot sees 3x traffic between 2-4 PM. Consider scaling resources.',
      actionable: true
    },
    {
      type: 'opportunity',
      title: 'Untapped Lead Source',
      description: '40% of chatbot conversations could be qualified as sales leads',
      actionable: true
    },
    {
      type: 'efficiency',
      title: 'Workflow Optimization Available',
      description: 'Combining 3 separate workflows could save 5 hours per week',
      actionable: true
    }
  ];
}

function calculatePlatformROI(products: any[], configurations: any[]): any {
  const productCount = products.length;
  const monthlySpend = configurations.reduce((sum, c) => sum + (c.total_price_pence || 0), 0) / 100;
  
  return {
    timeSavings: productCount * 5, // Hours per week
    efficiencyGain: productCount * 15, // Percentage
    costReduction: monthlySpend * 0.3, // 30% operational cost reduction
    revenueIncrease: monthlySpend * 0.5, // 50% revenue increase potential
    paybackPeriod: 2, // Months
    yearOneROI: 320 // Percentage
  };
}

async function calculatePlatformUsage(licenseKey: string): Promise<any> {
  // This would calculate actual usage metrics
  // For now, return sample data
  return {
    productsActive: 3,
    workflowsRunning: 15,
    apiCallsToday: 1250,
    dataPointsAnalyzed: 50000,
    insightsGenerated: 25,
    automationsTriggered: 180
  };
}

async function getActualInsights(licenseKey: string): Promise<any[]> {
  // This would fetch real insights from the system
  // For now, return sample insights
  return [
    {
      id: '1',
      type: 'anomaly',
      severity: 'medium',
      title: 'Unusual spike in failed sales outreach',
      description: 'Success rate dropped by 30% in the last 24 hours',
      suggestedAction: 'Review email templates and sending reputation',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'optimization',
      severity: 'low',
      title: 'Chatbot response time can be improved',
      description: 'Average response time is 2.3s, could be reduced to 0.8s',
      suggestedAction: 'Enable response caching for common queries',
      timestamp: new Date()
    }
  ];
}

function generatePlatformRecommendations(usage: any, products: any[]): any[] {
  const recommendations = [];
  
  if (usage.workflowsRunning < 5) {
    recommendations.push({
      type: 'underutilization',
      title: 'Create more workflows',
      description: 'You\'re using only 5% of your workflow capacity',
      action: 'Build cross-product automations'
    });
  }

  if (usage.apiCallsToday < 100) {
    recommendations.push({
      type: 'integration',
      title: 'Connect external systems',
      description: 'API access is barely being used',
      action: 'Integrate with your existing tools'
    });
  }

  return recommendations;
}

async function initializeCrossProductSync(licenseKey: string, products: any[]): Promise<void> {
  // This would set up the actual cross-product data synchronization
  // For now, just log the initialization
  console.log(`Initializing cross-product sync for license ${licenseKey} with ${products.length} products`);
}