/**
 * Admin Products API
 * Manages products and their skill mappings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/auth-validator';
import { SkillFactory } from '@intelagent/skills-orchestrator';

// Product-Skill Mappings
const PRODUCT_SKILLS = {
  chatbot: [
    'intent_classifier',
    'sentiment_analyzer',
    'entity_extractor',
    'text_summarizer',
    'language_detector',
    'translation',
    'webhook_sender',
    'email_composer'
  ],
  sales_agent: [
    'email_composer',
    'email_parser',
    'salesforce_connector',
    'hubspot_connector',
    'data_enricher',
    'lead_scorer',
    'calendar_scheduler',
    'slack_integration'
  ],
  enrichment: [
    'data_enricher',
    'web_scraper',
    'data_validator',
    'data_cleaner',
    'deduplicator',
    'geocoder',
    'social_analyzer'
  ],
  email_tool: [
    'email_composer',
    'email_parser',
    'mailchimp_connector',
    'sendgrid_connector',
    'signature_generator',
    'ab_testing',
    'analytics_tracker'
  ],
  automation: [
    'workflow_engine',
    'task_scheduler',
    'webhook_sender',
    'file_monitor',
    'approval_workflow',
    'data_pipeline',
    'alert_system'
  ],
  analytics: [
    'google_analytics',
    'mixpanel_tracker',
    'segment_tracker',
    'heatmap_generator',
    'funnel_analyzer',
    'cohort_analyzer',
    'revenue_tracker'
  ]
};

// Product definitions
const PRODUCTS = [
  {
    id: 'chatbot',
    name: 'Intelligent Chatbot',
    description: 'AI-powered chatbot with natural language understanding',
    category: 'communication',
    basePrice: 99,
    icon: 'MessageSquare',
    features: [
      'Natural language processing',
      'Multi-language support',
      'Sentiment analysis',
      'Custom training'
    ]
  },
  {
    id: 'sales_agent',
    name: 'Sales Agent',
    description: 'Automated sales outreach and lead management',
    category: 'sales',
    basePrice: 199,
    icon: 'Users',
    features: [
      'Lead enrichment',
      'Email automation',
      'CRM integration',
      'Campaign management'
    ]
  },
  {
    id: 'enrichment',
    name: 'Data Enrichment',
    description: 'Enrich and validate customer data',
    category: 'data',
    basePrice: 149,
    icon: 'Database',
    features: [
      'Email finder',
      'Company data',
      'Social profiles',
      'Data validation'
    ]
  },
  {
    id: 'email_tool',
    name: 'Email Marketing',
    description: 'Advanced email marketing automation',
    category: 'marketing',
    basePrice: 79,
    icon: 'Mail',
    features: [
      'Campaign builder',
      'A/B testing',
      'Analytics',
      'Template library'
    ]
  },
  {
    id: 'automation',
    name: 'Workflow Automation',
    description: 'Build custom automation workflows',
    category: 'automation',
    basePrice: 249,
    icon: 'Cpu',
    features: [
      'Visual workflow builder',
      'Conditional logic',
      'Scheduling',
      'Multi-step workflows'
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics Suite',
    description: 'Comprehensive analytics and reporting',
    category: 'analytics',
    basePrice: 129,
    icon: 'TrendingUp',
    features: [
      'Real-time analytics',
      'Custom dashboards',
      'Funnel analysis',
      'Cohort tracking'
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeSkills = searchParams.get('includeSkills') === 'true';
    const productId = searchParams.get('id');

    if (productId) {
      // Get specific product
      const product = PRODUCTS.find(p => p.id === productId);
      
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Get skills for this product
      const skillIds = PRODUCT_SKILLS[productId as keyof typeof PRODUCT_SKILLS] || [];
      const skills = includeSkills ? skillIds.map(id => {
        const skill = SkillFactory.getSkillDefinition(id);
        return skill ? {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          category: skill.category,
          isPremium: skill.isPremium
        } : null;
      }).filter(Boolean) : [];

      // Get usage statistics
      const stats = await getProductStats(productId, 'default');

      return NextResponse.json({
        ...product,
        skills,
        skillCount: skillIds.length,
        stats
      });
    }

    // Get all products with their skill mappings
    const productsWithSkills = await Promise.all(PRODUCTS.map(async (product) => {
      const skillIds = PRODUCT_SKILLS[product.id as keyof typeof PRODUCT_SKILLS] || [];
      
      const skills = includeSkills ? skillIds.map(id => {
        const skill = SkillFactory.getSkillDefinition(id);
        return skill ? {
          id: skill.id,
          name: skill.name,
          category: skill.category
        } : null;
      }).filter(Boolean) : undefined;

      const stats = await getProductStats(product.id, 'default');

      return {
        ...product,
        skillCount: skillIds.length,
        skills,
        stats
      };
    }));

    return NextResponse.json({
      products: productsWithSkills,
      total: productsWithSkills.length,
      categories: [...new Set(PRODUCTS.map(p => p.category))]
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

async function getProductStats(productId: string, tenantId?: string) {
  // Stats functionality disabled until skill_executions table is created
  return {
    totalExecutions: 0,
    successRate: 100,
    activeUsers: 0
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { action, productId, skillIds } = data;

    switch (action) {
      case 'updateSkills':
        // Update product-skill mapping
        if (!productId || !Array.isArray(skillIds)) {
          return NextResponse.json(
            { error: 'Product ID and skill IDs are required' },
            { status: 400 }
          );
        }

        // Validate all skills exist
        const validSkills = skillIds.filter(id => 
          SkillFactory.getSkillDefinition(id) !== undefined
        );

        // Update the mapping (in production, this would be stored in DB)
        PRODUCT_SKILLS[productId as keyof typeof PRODUCT_SKILLS] = validSkills;

        return NextResponse.json({
          success: true,
          productId,
          skills: validSkills,
          message: `Updated ${productId} with ${validSkills.length} skills`
        });

      case 'createProduct':
        // Create a new product (would be stored in DB in production)
        const { name, description, category, basePrice, skillIds: newSkillIds } = data;

        if (!name || !description || !category) {
          return NextResponse.json(
            { error: 'Name, description, and category are required' },
            { status: 400 }
          );
        }

        const newProductId = name.toLowerCase().replace(/\s+/g, '_');
        
        // Add to products array (in production, save to DB)
        const newProduct = {
          id: newProductId,
          name,
          description,
          category,
          basePrice: basePrice || 99,
          icon: 'Package',
          features: []
        };

        PRODUCTS.push(newProduct);
        PRODUCT_SKILLS[newProductId as keyof typeof PRODUCT_SKILLS] = newSkillIds || [];

        return NextResponse.json({
          success: true,
          product: newProduct,
          message: 'Product created successfully'
        });

      case 'calculatePrice':
        // Calculate product price based on selected skills
        if (!Array.isArray(skillIds)) {
          return NextResponse.json(
            { error: 'Skill IDs are required' },
            { status: 400 }
          );
        }

        const baseProductPrice = data.basePrice || 99;
        const premiumSkills = skillIds.filter(id => {
          const skill = SkillFactory.getSkillDefinition(id);
          return skill?.isPremium;
        });

        // Add $20 for each premium skill
        const totalPrice = baseProductPrice + (premiumSkills.length * 20);

        return NextResponse.json({
          basePrice: baseProductPrice,
          premiumSkillCount: premiumSkills.length,
          premiumSkillCost: premiumSkills.length * 20,
          totalPrice,
          breakdown: {
            base: baseProductPrice,
            skills: premiumSkills.map(id => ({
              id,
              name: SkillFactory.getSkillDefinition(id)?.name,
              cost: 20
            }))
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing products:', error);
    return NextResponse.json(
      { error: 'Failed to manage products' },
      { status: 500 }
    );
  }
}