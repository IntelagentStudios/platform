import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Product templates (in production, these would come from the product-framework package)
const productTemplates = [
  {
    id: 'chatbot',
    name: 'AI Chatbot',
    description: 'Intelligent conversational AI for customer support and engagement',
    icon: 'MessageSquare',
    category: 'communication',
    basePrice: 299,
    minTier: 'starter',
    coreSkills: [
      'natural_language_processing',
      'conversation_management',
      'response_generation',
      'context_retention'
    ],
    availableSkills: [
      'sentiment_analysis',
      'language_detection',
      'translation_service',
      'knowledge_base_search'
    ]
  },
  {
    id: 'sales-outreach',
    name: 'Sales Outreach Agent',
    description: 'Automated sales prospecting and outreach campaigns',
    icon: 'Users',
    category: 'sales',
    basePrice: 499,
    minTier: 'pro',
    coreSkills: [
      'email_automation',
      'lead_generation',
      'campaign_management',
      'response_tracking'
    ],
    availableSkills: [
      'lead_scoring',
      'crm_integration',
      'linkedin_automation',
      'sales_analytics'
    ]
  },
  {
    id: 'onboarding-automation',
    name: 'Onboarding Automation',
    description: 'Streamline employee and customer onboarding with automated workflows',
    icon: 'UserPlus',
    category: 'automation',
    basePrice: 399,
    minTier: 'starter',
    coreSkills: [
      'workflow_orchestration',
      'task_automation',
      'email_automation',
      'document_management'
    ],
    availableSkills: [
      'calendar_integration',
      'slack_integration',
      'e_signature',
      'video_tutorials'
    ]
  },
  {
    id: 'customer-success',
    name: 'Customer Success Portal',
    description: 'Complete customer support and success management platform',
    icon: 'HeartHandshake',
    category: 'communication',
    basePrice: 599,
    minTier: 'pro',
    coreSkills: [
      'ticket_management',
      'knowledge_base',
      'customer_communication',
      'sla_tracking'
    ],
    availableSkills: [
      'live_chat',
      'chatbot_integration',
      'customer_satisfaction',
      'reporting_dashboard'
    ]
  },
  {
    id: 'analytics-platform',
    name: 'Analytics Platform',
    description: 'Unified analytics and reporting across all products',
    icon: 'ChartBar',
    category: 'analytics',
    basePrice: 399,
    minTier: 'pro',
    coreSkills: [
      'data_aggregation',
      'report_generation',
      'dashboard_creation',
      'metric_tracking'
    ],
    availableSkills: [
      'custom_metrics',
      'scheduled_reports',
      'predictive_analytics',
      'data_visualization'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Agent',
    description: 'Build your own custom AI agent with selected skills',
    icon: 'Cube',
    category: 'custom',
    basePrice: 199,
    minTier: 'enterprise',
    coreSkills: [],
    availableSkills: [] // All skills available for custom
  }
];

// GET: Fetch available product templates
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's license tier
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    const userTier = license?.tier || 'starter';
    
    // Filter templates based on user's tier
    const tierHierarchy: Record<string, number> = {
      starter: 1,
      pro: 2,
      enterprise: 3
    };

    const userTierLevel = tierHierarchy[userTier] || 1;

    const availableTemplates = productTemplates.filter(template => {
      const requiredLevel = tierHierarchy[template.minTier] || 1;
      return userTierLevel >= requiredLevel;
    });

    // Get user's active products
    const activeProducts = await prisma.product_keys.findMany({
      where: {
        license_key: user.license_key,
        status: 'active'
      },
      select: {
        product: true,
        product_key: true,
        metadata: true
      }
    });

    // Mark which templates are already active
    const templatesWithStatus = availableTemplates.map(template => {
      const activeProduct = activeProducts.find(p => 
        p.product === template.id || 
        (p.metadata as any)?.templateId === template.id
      );

      return {
        ...template,
        isActive: !!activeProduct,
        productKey: activeProduct?.product_key,
        customName: activeProduct ? (activeProduct.metadata as any)?.name : undefined
      };
    });

    return NextResponse.json({
      templates: templatesWithStatus,
      userTier,
      activeCount: activeProducts.length,
      maxProducts: userTier === 'enterprise' ? 999 : userTier === 'pro' ? 10 : 3
    });

  } catch (error: any) {
    console.error('Error fetching product templates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST: Create a product instance from template
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { templateId, customName, selectedSkills, customSettings } = body;

    // Validate template exists
    const template = productTemplates.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user already has this product
    const existingProduct = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        product: templateId,
        status: 'active'
      }
    });

    if (existingProduct && templateId !== 'custom') {
      return NextResponse.json(
        { error: 'Product already active' },
        { status: 409 }
      );
    }

    // Create product key
    const productKey = `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Combine core skills with selected skills
    const allSkills = [
      ...template.coreSkills,
      ...(selectedSkills || [])
    ];

    // Calculate pricing
    const additionalSkillsCount = selectedSkills ? selectedSkills.length : 0;
    const skillPricePerMonth = 20; // £20 per additional skill
    const monthlyPrice = template.basePrice + (additionalSkillsCount * skillPricePerMonth);

    // Create the product instance
    const product = await prisma.product_keys.create({
      data: {
        product_key: productKey,
        license_key: user.license_key,
        product: templateId,
        assigned_skills: allSkills,
        metadata: {
          templateId,
          name: customName || template.name,
          description: template.description,
          category: template.category,
          monthlyPrice,
          customSettings: customSettings || {},
          createdFrom: 'template',
          activatedAt: new Date()
        },
        status: 'active',
        created_at: new Date()
      }
    });

    // Log activation
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'product_activated',
        resource_type: 'product',
        resource_id: product.id,
        changes: {
          template: templateId,
          name: customName || template.name,
          skills: allSkills
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      product,
      message: 'Product activated successfully',
      dashboardUrl: `/dashboard/${templateId.replace('-', '_')}`
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}