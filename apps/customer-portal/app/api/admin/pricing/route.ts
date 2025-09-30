import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  SKILL_PRICING_TIERS,
  FEATURE_PRICING,
  getSkillTier,
  calculateUsageCost,
  getDetailedPricingBreakdown,
  SkillTier
} from '@/utils/skillPricing';

const prisma = new PrismaClient();

// GET - Retrieve pricing configuration and usage data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'pricing-tiers':
        // Return all pricing tiers
        return NextResponse.json({
          skillTiers: SKILL_PRICING_TIERS,
          featurePricing: FEATURE_PRICING,
          basePlatformPrice: 299
        });

      case 'user-usage':
        // Get usage data for a specific user
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const startDate = new Date(`${month}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const usageLogs = await prisma.skill_audit_log.findMany({
          where: {
            user_id: userId,
            created_at: {
              gte: startDate,
              lt: endDate
            },
            event_type: 'execution'
          },
          select: {
            skill_id: true,
            created_at: true
          }
        });

        // Count executions per skill
        const usageMap = new Map<string, number>();
        usageLogs.forEach(log => {
          const count = usageMap.get(log.skill_id) || 0;
          usageMap.set(log.skill_id, count + 1);
        });

        return NextResponse.json({
          userId,
          month,
          usage: Array.from(usageMap.entries()).map(([skillId, executions]) => ({
            skillId,
            executions
          })),
          totalExecutions: usageLogs.length
        });

      case 'billing-preview':
        // Calculate billing for a user
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get user's subscribed products and skills
        const licenses = await prisma.licenses.findMany({
          where: { user_id: userId },
          include: {
            product_keys: true
          }
        });

        // Get configured skills for each product
        const configuredSkills = new Set<string>();
        const configuredFeatures = new Set<string>();

        for (const license of licenses) {
          if (license.product_keys?.configuration) {
            const config = license.product_keys.configuration as any;
            if (config.skills) {
              config.skills.forEach((s: string) => configuredSkills.add(s));
            }
            if (config.features) {
              config.features.forEach((f: string) => configuredFeatures.add(f));
            }
          }
        }

        // Get usage for the month
        const usage = await prisma.skill_audit_log.groupBy({
          by: ['skill_id'],
          where: {
            user_id: userId,
            created_at: {
              gte: new Date(`${month}-01`),
              lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
            },
            event_type: 'execution'
          },
          _count: {
            id: true
          }
        });

        const billingUsageMap = new Map<string, number>();
        usage.forEach(u => {
          billingUsageMap.set(u.skill_id, u._count.id);
        });

        // Calculate costs
        const skillsArray = Array.from(configuredSkills);
        const skillDetails = skillsArray.map(id => ({
          id,
          name: id.replace(/_/g, ' '),
          tier: getSkillTier(id, id.replace(/_/g, ' '))
        }));

        const usageData = Array.from(billingUsageMap.entries()).map(([skillId, executions]) => ({
          skillId,
          executions,
          month
        }));

        const usageCost = calculateUsageCost(usageData, skillDetails);

        const breakdown = getDetailedPricingBreakdown(
          skillsArray,
          Array.from(configuredFeatures),
          skillDetails.map(s => ({ id: s.id, name: s.name })),
          billingUsageMap
        );

        return NextResponse.json({
          userId,
          month,
          breakdown,
          usageCost,
          totalMonthlyBill: breakdown.total + usageCost
        });

      case 'platform-analytics':
        // Get platform-wide pricing analytics
        const allUsers = await prisma.user.findMany({
          select: { id: true }
        });

        const platformStats = {
          totalUsers: allUsers.length,
          averageSkillsPerUser: 0,
          mostPopularTier: SkillTier.STANDARD,
          totalMonthlyRevenue: 0,
          usageBasedRevenue: 0
        };

        // Calculate average skills and revenue
        let totalSkills = 0;
        let tierCounts: Record<SkillTier, number> = {
          [SkillTier.BASIC]: 0,
          [SkillTier.STANDARD]: 0,
          [SkillTier.ADVANCED]: 0,
          [SkillTier.PREMIUM]: 0,
          [SkillTier.ENTERPRISE]: 0
        };

        for (const user of allUsers) {
          const licenses = await prisma.licenses.findMany({
            where: { user_id: user.id },
            include: { product_keys: true }
          });

          licenses.forEach(license => {
            if (license.product_keys?.configuration) {
              const config = license.product_keys.configuration as any;
              if (config.skills) {
                totalSkills += config.skills.length;
                config.skills.forEach((skillId: string) => {
                  const tier = getSkillTier(skillId, skillId);
                  tierCounts[tier]++;
                  platformStats.totalMonthlyRevenue += SKILL_PRICING_TIERS[tier].basePrice;
                });
              }
              if (config.features) {
                config.features.forEach((featureId: string) => {
                  const pricing = FEATURE_PRICING[featureId as keyof typeof FEATURE_PRICING];
                  if (pricing) {
                    platformStats.totalMonthlyRevenue += pricing.price;
                  }
                });
              }
            }
          });

          // Add base platform fee
          if (licenses.length > 0) {
            platformStats.totalMonthlyRevenue += 299;
          }
        }

        platformStats.averageSkillsPerUser = allUsers.length > 0 ? totalSkills / allUsers.length : 0;

        // Find most popular tier
        let maxCount = 0;
        Object.entries(tierCounts).forEach(([tier, count]) => {
          if (count > maxCount) {
            maxCount = count;
            platformStats.mostPopularTier = tier as SkillTier;
          }
        });

        return NextResponse.json(platformStats);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Pricing API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process pricing request' },
      { status: 500 }
    );
  }
}

// POST - Update pricing configuration
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'update-skill-tier':
        // Update skill tier mapping (store in database)
        const { skillId, tier } = data;

        // Store in a configuration table or cache
        // For now, we'll return success
        return NextResponse.json({
          success: true,
          skillId,
          tier,
          newPrice: SKILL_PRICING_TIERS[tier as SkillTier].basePrice
        });

      case 'update-feature-price':
        // Update feature pricing
        const { featureId, price } = data;

        // In production, store this in database
        return NextResponse.json({
          success: true,
          featureId,
          newPrice: price
        });

      case 'apply-discount':
        // Apply discount to user's subscription
        const { userId, discountPercent, reason } = data;

        // Store discount in skill_audit_log with special event type
        // In production, you'd want a dedicated billing_adjustments table
        const discount = await prisma.skill_audit_log.create({
          data: {
            user_id: userId,
            skill_id: 'billing_discount',
            event_type: 'discount_applied',
            event_data: {
              discount_percent: discountPercent,
              reason: reason,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } as any,
            license_key: 'system',
            created_at: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          discount
        });

      case 'set-usage-limits':
        // Set usage limits for a user
        const { userId: limitUserId, skillId: limitSkillId, monthlyLimit } = data;

        // Store usage limits (would need a new table in production)
        return NextResponse.json({
          success: true,
          userId: limitUserId,
          skillId: limitSkillId,
          monthlyLimit
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Pricing update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pricing' },
      { status: 500 }
    );
  }
}