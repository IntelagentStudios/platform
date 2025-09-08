import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Get marketplace context for user (or guest)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Initialize context response
    let context = {
      isAuthenticated: false,
      userTier: null as string | null,
      currentProducts: [] as any[],
      availableProducts: [] as any[],
      recommendedUpgrades: [] as any[],
      platformIntelligence: {
        eligible: false,
        hasMinimumProducts: false,
        currentProductCount: 0,
        potentialValue: null as any
      },
      customAgentBuilder: {
        available: false,
        skillsAvailable: 0,
        suggestedTemplates: [] as any[]
      },
      pricing: {
        currency: 'GBP',
        hasActiveSubscription: false,
        currentMonthlySpend: 0,
        potentialSavings: null as any
      }
    };

    // If user is authenticated, get their context
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId }
        });

        if (user && user.license_key) {
          context.isAuthenticated = true;

          // Get user's license and products
          const license = await prisma.licenses.findUnique({
            where: { license_key: user.license_key }
          });

          if (license) {
            context.userTier = license.tier || 'starter';
            context.pricing.hasActiveSubscription = license.status === 'active';
            context.pricing.currentMonthlySpend = (license.total_pence || 0) / 100;

            // Get user's current products
            const productKeys = await prisma.product_keys.findMany({
              where: { 
                license_key: user.license_key,
                status: 'active'
              }
            });

            // Get product configurations
            const configurations = await prisma.product_configurations.findMany({
              where: {
                license_key: user.license_key,
                status: { in: ['active', 'draft'] }
              }
            });

            // Map current products with their configurations
            context.currentProducts = productKeys.map(pk => {
              const config = configurations.find(c => c.product_key === pk.product_key);
              return {
                productKey: pk.product_key,
                productType: pk.product,
                status: pk.status,
                hasCustomization: !!config,
                customization: config ? {
                  name: config.custom_name,
                  type: config.customization_type,
                  skillsCount: (config.skills_enabled as any[]).length,
                  monthlyPrice: config.total_price_pence / 100
                } : null,
                canUpgrade: true
              };
            });

            context.platformIntelligence.currentProductCount = context.currentProducts.length;

            // Check Platform Intelligence eligibility
            const hasPlatformSubscription = await prisma.platform_subscriptions.findUnique({
              where: { license_key: user.license_key }
            });

            if (!hasPlatformSubscription && context.currentProducts.length >= 2) {
              context.platformIntelligence.eligible = true;
              context.platformIntelligence.hasMinimumProducts = true;
              context.platformIntelligence.potentialValue = {
                unifiedAnalytics: true,
                crossProductInsights: true,
                workflowOrchestration: true,
                estimatedEfficiencyGain: '40%',
                monthlyPrice: 999 // £999
              };
            }

            // Check custom agent availability
            const skillsCount = await prisma.skills.count({
              where: { active: true }
            });

            context.customAgentBuilder.available = true;
            context.customAgentBuilder.skillsAvailable = skillsCount;

            // Get suggested templates based on user's industry/products
            const templates = getCustomAgentTemplates(context.currentProducts);
            context.customAgentBuilder.suggestedTemplates = templates;

            // Calculate available products (not already owned)
            const ownedProductTypes = new Set(productKeys.map(pk => pk.product));
            const allProductTypes = ['chatbot', 'sales_outreach', 'onboarding'];
            
            context.availableProducts = allProductTypes
              .filter(type => !ownedProductTypes.has(type))
              .map(type => ({
                productType: type,
                displayName: getProductDisplayName(type),
                description: getProductDescription(type),
                basePrice: getBasePrice(type),
                customizable: true,
                skillsIncluded: getCoreSkillsCount(type)
              }));

            // Generate upgrade recommendations
            context.recommendedUpgrades = generateUpgradeRecommendations(
              context.currentProducts,
              context.platformIntelligence.eligible,
              hasPlatformSubscription !== null
            );

            // Calculate potential savings with annual billing or bundles
            if (context.pricing.currentMonthlySpend > 0) {
              const annualSavings = context.pricing.currentMonthlySpend * 12 * 0.2; // 20% discount
              const bundleSavings = calculateBundleSavings(context.currentProducts);
              
              context.pricing.potentialSavings = {
                annual: {
                  amount: annualSavings,
                  percentage: 20,
                  description: 'Switch to annual billing'
                },
                bundle: bundleSavings > 0 ? {
                  amount: bundleSavings,
                  description: 'Bundle your products'
                } : null
              };
            }
          }
        }
      } catch (error) {
        // Invalid token, treat as guest
        console.log('Auth token invalid, treating as guest');
      }
    }

    // Add guest-specific context if not authenticated
    if (!context.isAuthenticated) {
      context.availableProducts = [
        {
          productType: 'chatbot',
          displayName: 'AI Chatbot',
          description: 'Intelligent conversational AI for customer support',
          basePrice: 299,
          customizable: true,
          skillsIncluded: 30
        },
        {
          productType: 'sales_outreach',
          displayName: 'Sales Outreach Agent',
          description: 'Automated sales and lead generation',
          basePrice: 499,
          customizable: true,
          skillsIncluded: 60
        },
        {
          productType: 'onboarding',
          displayName: 'Onboarding Agent',
          description: 'Streamline employee and customer onboarding',
          basePrice: 399,
          customizable: true,
          skillsIncluded: 40
        }
      ];

      context.recommendedUpgrades = [
        {
          type: 'starter_bundle',
          title: 'Starter Bundle',
          description: 'Get started with our most popular product',
          products: ['chatbot'],
          monthlyPrice: 299,
          savings: 0
        },
        {
          type: 'growth_bundle',
          title: 'Growth Bundle',
          description: 'Perfect for scaling businesses',
          products: ['chatbot', 'sales_outreach'],
          monthlyPrice: 699,
          savings: 99
        }
      ];
    }

    return NextResponse.json(context);

  } catch (error: any) {
    console.error('Error getting marketplace context:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get marketplace context' },
      { status: 500 }
    );
  }
}

// Helper functions
function getProductDisplayName(type: string): string {
  const names: Record<string, string> = {
    chatbot: 'AI Chatbot',
    sales_outreach: 'Sales Outreach Agent',
    onboarding: 'Onboarding Agent'
  };
  return names[type] || type;
}

function getProductDescription(type: string): string {
  const descriptions: Record<string, string> = {
    chatbot: 'Intelligent conversational AI that can be customized for support, knowledge management, or sales',
    sales_outreach: 'Automated sales engine for lead generation, email campaigns, and CRM automation',
    onboarding: 'Streamline any onboarding process with intelligent form processing and workflow automation'
  };
  return descriptions[type] || '';
}

function getBasePrice(type: string): number {
  const prices: Record<string, number> = {
    chatbot: 299,
    sales_outreach: 499,
    onboarding: 399
  };
  return prices[type] || 299;
}

function getCoreSkillsCount(type: string): number {
  const skills: Record<string, number> = {
    chatbot: 30,
    sales_outreach: 60,
    onboarding: 40
  };
  return skills[type] || 30;
}

function getCustomAgentTemplates(currentProducts: any[]): any[] {
  const templates = [];
  
  // Suggest templates based on what they already have
  if (currentProducts.some(p => p.productType === 'chatbot')) {
    templates.push({
      id: 'advanced_support',
      name: 'Advanced Support Agent',
      description: 'Escalation handling and complex query resolution',
      estimatedSkills: 45,
      monthlyPrice: 599
    });
  }

  if (currentProducts.some(p => p.productType === 'sales_outreach')) {
    templates.push({
      id: 'account_manager',
      name: 'Account Management Agent',
      description: 'Nurture existing customers and identify upsell opportunities',
      estimatedSkills: 55,
      monthlyPrice: 699
    });
  }

  // Always suggest these
  templates.push({
    id: 'data_analyst',
    name: 'Data Analysis Agent',
    description: 'Extract insights from your business data',
    estimatedSkills: 70,
    monthlyPrice: 899
  });

  templates.push({
    id: 'workflow_automator',
    name: 'Workflow Automation Agent',
    description: 'Connect and automate any business process',
    estimatedSkills: 80,
    monthlyPrice: 999
  });

  return templates.slice(0, 3); // Return top 3 suggestions
}

function generateUpgradeRecommendations(
  currentProducts: any[],
  platformEligible: boolean,
  hasPlatform: boolean
): any[] {
  const recommendations = [];

  // Recommend Platform Intelligence if eligible
  if (platformEligible && !hasPlatform) {
    recommendations.push({
      type: 'platform_intelligence',
      priority: 'high',
      title: 'Unlock Platform Intelligence',
      description: 'Connect all your products for unified insights and 10x efficiency',
      monthlyPrice: 999,
      value: 'Transform isolated tools into an intelligent system',
      cta: 'Upgrade Now'
    });
  }

  // Recommend skill upgrades for existing products
  currentProducts.forEach(product => {
    if (product.hasCustomization && product.customization.skillsCount < 50) {
      recommendations.push({
        type: 'skill_expansion',
        priority: 'medium',
        productKey: product.productKey,
        title: `Enhance your ${getProductDisplayName(product.productType)}`,
        description: `Add more skills to unlock advanced capabilities`,
        additionalSkills: 20,
        monthlyPriceIncrease: 400,
        cta: 'Add Skills'
      });
    }
  });

  // Recommend missing products
  const hasChat = currentProducts.some(p => p.productType === 'chatbot');
  const hasSales = currentProducts.some(p => p.productType === 'sales_outreach');
  const hasOnboarding = currentProducts.some(p => p.productType === 'onboarding');

  if (!hasSales && hasChat) {
    recommendations.push({
      type: 'new_product',
      priority: 'medium',
      productType: 'sales_outreach',
      title: 'Add Sales Automation',
      description: 'Convert more leads with AI-powered sales outreach',
      monthlyPrice: 499,
      synergyWith: ['chatbot'],
      cta: 'Add Product'
    });
  }

  return recommendations.sort((a, b) => {
    const priority: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });
}

function calculateBundleSavings(products: any[]): number {
  if (products.length < 2) return 0;
  
  const totalIndividual = products.reduce((sum, p) => {
    return sum + (p.customization?.monthlyPrice || getBasePrice(p.productType));
  }, 0);

  // Bundle discounts
  if (products.length === 2) return totalIndividual * 0.1; // 10% off
  if (products.length === 3) return totalIndividual * 0.15; // 15% off
  return totalIndividual * 0.2; // 20% off for 4+
}