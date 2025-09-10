import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      baseProduct,
      selectedSkills = [],
      estimatedUsers = 1,
      estimatedInteractionsPerDay = 100,
      billingCycle = 'monthly'
    } = body;

    // Base prices (in pence)
    const basePrices: Record<string, number> = {
      chatbot: 29900, // £299
      sales_outreach: 49900, // £499
      onboarding: 39900, // £399
      custom_agent: 79900 // £799
    };

    let basePricePence = basePrices[baseProduct] || 29900;
    let skillsPricePence = 0;
    let complexityScore = 1;
    let totalMonthlyTokens = 0;
    let valueMultiplier = 1.0;

    // Get selected skills details
    if (selectedSkills.length > 0) {
      const skills = await prisma.skills.findMany({
        where: { id: { in: selectedSkills } }
      });

      const coreSkillsCount = skills.filter(s => s.is_core_skill).length;
      const additionalSkillsCount = skills.length - coreSkillsCount;

      // Calculate skill-based pricing
      for (const skill of skills) {
        if (!skill.is_core_skill) {
          // Additional skills cost extra
          skillsPricePence += skill.base_cost_pence || 2000; // £20 default
        }

        // Estimate token usage
        const dailyTokens = (skill.token_usage_estimate || 100) * estimatedInteractionsPerDay;
        totalMonthlyTokens += dailyTokens * 30;

        // Apply value multiplier for premium skills
        if (skill.value_multiplier) {
          valueMultiplier = Math.max(valueMultiplier, Number(skill.value_multiplier));
        }

        // Calculate complexity
        if (skill.skill_tier === 'premium') complexityScore += 0.5;
        if (skill.skill_tier === 'enterprise') complexityScore += 1;
      }

      // Get skill-product mappings for more accurate pricing
      const mappings = await prisma.skill_product_mappings.findMany({
        where: {
          base_product: baseProduct,
          skill_id: { in: selectedSkills }
        }
      });

      // Apply mapping-based pricing adjustments
      for (const mapping of mappings) {
        if (mapping.price_impact_pence > 2000) {
          // Use higher price if specified in mapping
          const skill = skills.find(s => s.id === mapping.skill_id);
          if (skill && !skill.is_core_skill) {
            skillsPricePence += (mapping.price_impact_pence - 2000);
          }
        }
        complexityScore += Number(mapping.complexity_impact) * 0.2;
      }
    }

    // Normalize complexity score (1-10)
    complexityScore = Math.min(10, Math.max(1, Math.round(complexityScore)));

    // Calculate token-based costs (£50 per million tokens)
    const tokenCostPence = Math.round((totalMonthlyTokens / 1000000) * 5000);

    // Apply complexity multiplier
    const complexityMultiplier = 1 + (complexityScore - 1) * 0.1; // 10% increase per complexity point

    // Calculate user-based scaling
    const userMultiplier = Math.sqrt(estimatedUsers); // Sublinear scaling for multiple users

    // Calculate subtotal
    let subtotalPence = Math.round(
      (basePricePence + skillsPricePence + tokenCostPence) * 
      complexityMultiplier * 
      valueMultiplier * 
      userMultiplier
    );

    // Apply billing cycle discount
    let discount = 0;
    if (billingCycle === 'annual') {
      discount = Math.round(subtotalPence * 0.2); // 20% discount for annual
      subtotalPence = subtotalPence * 12 - discount * 12; // Annual price with discount
    }

    // Check for active pricing rules
    const pricingRules = await prisma.skill_pricing_rules.findMany({
      where: {
        active: true,
        rule_type: { in: ['skill_count', 'base_product', 'complexity'] }
      },
      orderBy: { priority: 'desc' }
    });

    // Apply pricing rules
    for (const rule of pricingRules) {
      const condition = rule.condition as any;
      const action = rule.action as any;
      
      if (rule.rule_type === 'skill_count') {
        // Check if skill count matches condition
        const minSkills = condition.min_skill_count || 0;
        const maxSkills = condition.max_skill_count || 999;
        
        if (selectedSkills.length >= minSkills && selectedSkills.length <= maxSkills) {
          // Apply discount
          const volumeDiscount = Math.round(skillsPricePence * 0.1);
          subtotalPence -= volumeDiscount;
        }
      }
    }

    const totalPricePence = Math.max(basePricePence, subtotalPence); // Never go below base price

    // Format response
    const response = {
      baseProduct,
      pricing: {
        basePrice: basePricePence,
        skillsAddon: skillsPricePence,
        tokenCost: tokenCostPence,
        subtotal: basePricePence + skillsPricePence + tokenCostPence,
        discount: discount,
        total: totalPricePence,
        currency: 'GBP',
        billingCycle
      },
      metrics: {
        selectedSkillsCount: selectedSkills.length,
        complexityScore,
        estimatedMonthlyTokens: totalMonthlyTokens,
        valueMultiplier,
        userMultiplier: userMultiplier.toFixed(2),
        effectiveUsersCount: estimatedUsers
      },
      formatted: {
        monthly: billingCycle === 'monthly' 
          ? `£${(totalPricePence / 100).toFixed(2)}/month`
          : `£${(totalPricePence / 12 / 100).toFixed(2)}/month`,
        annual: billingCycle === 'annual'
          ? `£${(totalPricePence / 100).toFixed(2)}/year`
          : `£${((totalPricePence * 12 * 0.8) / 100).toFixed(2)}/year (with 20% discount)`,
        savings: billingCycle === 'annual' 
          ? `Save £${(discount * 12 / 100).toFixed(2)} per year`
          : null
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate price' },
      { status: 500 }
    );
  }
}