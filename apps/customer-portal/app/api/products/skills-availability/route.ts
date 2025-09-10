import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Check which skills are available for a user's products
export async function GET(request: NextRequest) {
  try {
    // Check for simple auth first
    const simpleAuth = request.cookies.get('auth');
    if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
      // Return mock skills data for simple auth
      return NextResponse.json({
        skills: {
          core: [],
          included: [],
          available: [],
          premium: [],
          locked: []
        },
        currentConfiguration: null,
        tierLimits: {
          maxSkills: 10,
          maxComplexity: 100
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const productKey = searchParams.get('productKey');
    const productType = searchParams.get('productType') || 'chatbot';
    
    const authHeader = request.headers.get('authorization');
    let userLicenseKey = null;
    let userTier = 'starter';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId }
        });
        
        if (user) {
          userLicenseKey = user.license_key;
          
          const license = await prisma.licenses.findUnique({
            where: { license_key: user.license_key }
          });
          
          userTier = license?.tier || 'starter';
        }
      } catch (error) {
        console.log('Auth error, continuing as guest');
      }
    }

    // Get all skills applicable to this product type
    const allSkills = await prisma.skills.findMany({
      where: {
        active: true,
        OR: [
          { applicable_products: { has: productType } },
          { applicable_products: { has: 'all' } }
        ]
      }
    });

    // Get skill-product mappings for better categorization
    const mappings = await prisma.skill_product_mappings.findMany({
      where: { base_product: productType }
    });

    // If a specific product key is provided, get its current configuration
    let currentSkills: string[] = [];
    let currentConfiguration = null;
    
    if (productKey && userLicenseKey) {
      const productKeyRecord = await prisma.product_keys.findUnique({
        where: { product_key: productKey }
      });
      
      if (productKeyRecord && productKeyRecord.license_key === userLicenseKey) {
        currentSkills = (productKeyRecord.assigned_skills as string[]) || [];
        
        const config = await prisma.product_configurations.findUnique({
          where: { product_key: productKey }
        });
        
        if (config) {
          currentConfiguration = {
            customizationType: config.customization_type,
            currentSkillsCount: (config.skills_enabled as string[]).length,
            complexityScore: config.complexity_score,
            monthlyPrice: config.total_price_pence / 100
          };
        }
      }
    }

    // Categorize skills by availability and tier
    const categorizedSkills = {
      core: [] as any[],
      included: [] as any[],
      available: [] as any[],
      premium: [] as any[],
      locked: [] as any[]
    };

    for (const skill of allSkills) {
      const mapping = mappings.find(m => m.skill_id === skill.id);
      const isCurrentlyEnabled = currentSkills.includes(skill.id);
      
      const skillInfo = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        tier: skill.skill_tier,
        enabled: isCurrentlyEnabled,
        tokenEstimate: skill.token_usage_estimate,
        executionTime: skill.execution_time_ms,
        dependencies: (skill.dependencies as string[]) || [],
        priceImpact: mapping?.price_impact_pence || skill.base_cost_pence,
        complexityImpact: mapping?.complexity_impact || 1,
        canToggle: !skill.is_core_skill,
        requiresUpgrade: false,
        unavailableReason: null as string | null
      };

      // Categorize based on skill properties and user tier
      if (skill.is_core_skill) {
        skillInfo.enabled = true; // Core skills are always enabled
        skillInfo.canToggle = false;
        categorizedSkills.core.push(skillInfo);
      } else if (skill.skill_tier === 'basic' || userTier === 'enterprise') {
        if (isCurrentlyEnabled) {
          categorizedSkills.included.push(skillInfo);
        } else {
          categorizedSkills.available.push(skillInfo);
        }
      } else if (skill.skill_tier === 'premium' && userTier === 'starter') {
        skillInfo.requiresUpgrade = true;
        skillInfo.unavailableReason = 'Requires Professional tier or higher';
        categorizedSkills.premium.push(skillInfo);
      } else if (skill.skill_tier === 'enterprise' && userTier !== 'enterprise') {
        skillInfo.requiresUpgrade = true;
        skillInfo.unavailableReason = 'Requires Enterprise tier';
        categorizedSkills.locked.push(skillInfo);
      } else {
        categorizedSkills.available.push(skillInfo);
      }
    }

    // Check for dependency conflicts
    const allEnabledSkillIds = new Set([
      ...categorizedSkills.core.map(s => s.id),
      ...categorizedSkills.included.map(s => s.id)
    ]);

    // Mark skills with unmet dependencies
    [...categorizedSkills.available, ...categorizedSkills.premium].forEach(skill => {
      const unmetDependencies = skill.dependencies.filter(
        (dep: string) => !allEnabledSkillIds.has(dep)
      );
      
      if (unmetDependencies.length > 0) {
        skill.unavailableReason = `Requires: ${unmetDependencies.join(', ')}`;
        skill.canToggle = false;
      }
    });

    // Calculate pricing impact of adding all available skills
    const availableSkillsCost = categorizedSkills.available.reduce(
      (sum, skill) => sum + (skill.priceImpact || 0),
      0
    );

    const premiumSkillsCost = categorizedSkills.premium.reduce(
      (sum, skill) => sum + (skill.priceImpact || 0),
      0
    );

    // Generate skill recommendations based on common patterns
    const recommendations = generateSkillRecommendations(
      productType,
      currentSkills,
      allSkills,
      userTier
    );

    return NextResponse.json({
      productType,
      productKey,
      userTier,
      currentConfiguration,
      skills: categorizedSkills,
      summary: {
        totalSkills: allSkills.length,
        coreSkills: categorizedSkills.core.length,
        includedSkills: categorizedSkills.included.length,
        availableSkills: categorizedSkills.available.length,
        premiumSkills: categorizedSkills.premium.length,
        lockedSkills: categorizedSkills.locked.length
      },
      pricing: {
        currentMonthly: currentConfiguration?.monthlyPrice || getBasePrice(productType),
        availableSkillsCost: availableSkillsCost / 100,
        premiumSkillsCost: premiumSkillsCost / 100,
        maxPossibleMonthly: (getBasePrice(productType) * 100 + availableSkillsCost + premiumSkillsCost) / 100
      },
      recommendations
    });

  } catch (error: any) {
    console.error('Error checking skills availability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check skills availability' },
      { status: 500 }
    );
  }
}

// Helper function to get base price
function getBasePrice(type: string): number {
  const prices: Record<string, number> = {
    chatbot: 299,
    sales_outreach: 499,
    onboarding: 399
  };
  return prices[type] || 299;
}

// Generate skill recommendations
function generateSkillRecommendations(
  productType: string,
  currentSkills: string[],
  allSkills: any[],
  userTier: string
): any[] {
  const recommendations = [];
  
  // Product-specific recommendations
  if (productType === 'chatbot' && currentSkills.length < 40) {
    recommendations.push({
      title: 'Enhanced Natural Language',
      description: 'Add advanced NLP skills for better conversation understanding',
      skills: ['nlp_advanced', 'sentiment_analysis', 'intent_classification'],
      impact: 'Improve response accuracy by 30%',
      priceIncrease: 60
    });
  }

  if (productType === 'sales_outreach' && currentSkills.length < 70) {
    recommendations.push({
      title: 'Lead Scoring Package',
      description: 'Intelligent lead qualification and scoring',
      skills: ['lead_scoring', 'company_enrichment', 'buyer_intent'],
      impact: 'Increase conversion rates by 25%',
      priceIncrease: 80
    });
  }

  if (productType === 'onboarding' && currentSkills.length < 50) {
    recommendations.push({
      title: 'Compliance Suite',
      description: 'Ensure regulatory compliance in onboarding',
      skills: ['compliance_check', 'document_verification', 'audit_trail'],
      impact: 'Reduce compliance risks by 90%',
      priceIncrease: 100
    });
  }

  // Tier-based recommendations
  if (userTier === 'starter') {
    recommendations.push({
      title: 'Upgrade to Professional',
      description: 'Unlock 50+ premium skills',
      impact: 'Access advanced automation capabilities',
      upgradeRequired: true,
      targetTier: 'professional'
    });
  }

  return recommendations.slice(0, 2); // Return top 2 recommendations
}