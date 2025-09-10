import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Fetch available skills for product customization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user's license
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const baseProduct = searchParams.get('product') || 'chatbot';

    // Get all skills applicable to this product
    const skills = await prisma.skills.findMany({
      where: {
        active: true,
        OR: [
          { applicable_products: { has: baseProduct } },
          { applicable_products: { has: 'all' } }
        ]
      },
      orderBy: [
        { is_core_skill: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group skills by category
    const groupedSkills = skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          name: category,
          skills: [],
          coreSkillsCount: 0,
          optionalSkillsCount: 0
        };
      }
      
      acc[category].skills.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        isCore: skill.is_core_skill,
        tier: skill.skill_tier,
        tokenEstimate: skill.token_usage_estimate,
        costImpact: skill.base_cost_pence,
        valueMultiplier: skill.value_multiplier?.toString() || '1.0',
        dependencies: skill.dependencies || []
      });

      if (skill.is_core_skill) {
        acc[category].coreSkillsCount++;
      } else {
        acc[category].optionalSkillsCount++;
      }

      return acc;
    }, {} as Record<string, any>);

    // Get skill-product mappings for pricing
    const mappings = await prisma.skill_product_mappings.findMany({
      where: { base_product: baseProduct }
    });

    const pricingInfo = mappings.reduce((acc, mapping) => {
      acc[mapping.skill_id] = {
        priceImpact: mapping.price_impact_pence,
        complexityImpact: mapping.complexity_impact,
        avgTokensPerUse: mapping.avg_tokens_per_use,
        avgCallsPerMonth: mapping.avg_calls_per_month
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      baseProduct,
      categories: Object.values(groupedSkills),
      totalSkills: skills.length,
      coreSkills: skills.filter(s => s.is_core_skill).length,
      pricingInfo
    });

  } catch (error: any) {
    console.error('Error fetching customization options:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customization options' },
      { status: 500 }
    );
  }
}

// POST: Save product customization
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
    const {
      productKey,
      baseProduct,
      customizationType,
      customName,
      description,
      selectedSkills,
      customSettings,
      uiPreferences,
      integrations
    } = body;

    // Calculate complexity score based on selected skills
    const skills = await prisma.skills.findMany({
      where: { id: { in: selectedSkills } }
    });

    let complexityScore = 1;
    let totalTokenEstimate = 0;
    let basePricePence = 0;
    let addonPricePence = 0;

    // Base prices for products
    const basePrices: Record<string, number> = {
      chatbot: 29900, // £299
      sales_outreach: 49900, // £499
      onboarding: 39900 // £399
    };

    basePricePence = basePrices[baseProduct] || 29900;

    // Calculate pricing based on skills
    for (const skill of skills) {
      if (!skill.is_core_skill) {
        addonPricePence += skill.base_cost_pence || 2000; // £20 per additional skill
      }
      totalTokenEstimate += (skill.token_usage_estimate || 100) * 30; // Monthly estimate
      
      // Increase complexity based on skill tier
      if (skill.skill_tier === 'premium') complexityScore += 1;
      if (skill.skill_tier === 'enterprise') complexityScore += 2;
    }

    // Adjust complexity score (1-10 scale)
    complexityScore = Math.min(10, Math.max(1, Math.floor(complexityScore / 5)));

    const totalPricePence = basePricePence + addonPricePence;

    // Create or update product configuration
    const configuration = await prisma.product_configurations.upsert({
      where: { product_key: productKey },
      create: {
        product_key: productKey,
        license_key: user.license_key,
        base_product: baseProduct,
        customization_type: customizationType,
        custom_name: customName,
        description,
        skills_enabled: selectedSkills,
        custom_settings: customSettings || {},
        ui_preferences: uiPreferences || {},
        integrations: integrations || [],
        complexity_score: complexityScore,
        estimated_tokens: totalTokenEstimate,
        base_price_pence: basePricePence,
        addon_price_pence: addonPricePence,
        total_price_pence: totalPricePence,
        status: 'draft',
        created_by: decoded.userId
      },
      update: {
        customization_type: customizationType,
        custom_name: customName,
        description,
        skills_enabled: selectedSkills,
        custom_settings: customSettings || {},
        ui_preferences: uiPreferences || {},
        integrations: integrations || [],
        complexity_score: complexityScore,
        estimated_tokens: totalTokenEstimate,
        addon_price_pence: addonPricePence,
        total_price_pence: totalPricePence,
        updated_at: new Date()
      }
    });

    // Update product_keys table with skills configuration
    await prisma.product_keys.update({
      where: { product_key: productKey },
      data: {
        assigned_skills: selectedSkills,
        skill_config: {
          customizationType,
          complexityScore,
          estimatedTokens: totalTokenEstimate
        },
        metadata: {
          customized: true,
          customizedAt: new Date().toISOString(),
          customizedBy: decoded.userId
        }
      }
    });

    return NextResponse.json({
      success: true,
      configuration: {
        id: configuration.id,
        productKey: configuration.product_key,
        baseProduct: configuration.base_product,
        customizationType: configuration.customization_type,
        customName: configuration.custom_name,
        skillsCount: selectedSkills.length,
        complexityScore: configuration.complexity_score,
        monthlyPrice: `£${(configuration.total_price_pence / 100).toFixed(2)}`,
        status: configuration.status
      }
    });

  } catch (error: any) {
    console.error('Error saving customization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save customization' },
      { status: 500 }
    );
  }
}

// PUT: Activate customized product
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const body = await request.json();
    const { productKey, action } = body;

    const configuration = await prisma.product_configurations.findUnique({
      where: { product_key: productKey }
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Verify ownership
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (user?.license_key !== configuration.license_key) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let updateData: any = {};

    switch (action) {
      case 'activate':
        updateData = {
          status: 'active',
          activated_at: new Date()
        };
        break;
      case 'pause':
        updateData = {
          status: 'paused',
          paused_at: new Date()
        };
        break;
      case 'cancel':
        updateData = {
          status: 'cancelled',
          cancelled_at: new Date()
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.product_configurations.update({
      where: { product_key: productKey },
      data: updateData
    });

    // Update product_keys status
    await prisma.product_keys.update({
      where: { product_key: productKey },
      data: {
        status: action === 'activate' ? 'active' : action === 'cancel' ? 'inactive' : 'paused'
      }
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: `Product ${action}d successfully`
    });

  } catch (error: any) {
    console.error('Error updating product status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product status' },
      { status: 500 }
    );
  }
}