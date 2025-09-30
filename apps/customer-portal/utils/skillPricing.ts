// Skill Pricing Configuration - Value-Based Tiers
export enum SkillTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface SkillPricingConfig {
  tier: SkillTier;
  basePrice: number;
  usageIncluded: number; // Included executions per month
  overageRate: number; // Price per execution after included
  description: string;
}

export const SKILL_PRICING_TIERS: Record<SkillTier, SkillPricingConfig> = {
  [SkillTier.BASIC]: {
    tier: SkillTier.BASIC,
    basePrice: 5,
    usageIncluded: 1000,
    overageRate: 0.005, // £0.005 per execution
    description: 'Simple automations, data fetching, basic operations'
  },
  [SkillTier.STANDARD]: {
    tier: SkillTier.STANDARD,
    basePrice: 15,
    usageIncluded: 5000,
    overageRate: 0.003,
    description: 'API integrations, data processing, standard workflows'
  },
  [SkillTier.ADVANCED]: {
    tier: SkillTier.ADVANCED,
    basePrice: 35,
    usageIncluded: 10000,
    overageRate: 0.002,
    description: 'AI/ML operations, complex integrations, analytics'
  },
  [SkillTier.PREMIUM]: {
    tier: SkillTier.PREMIUM,
    basePrice: 75,
    usageIncluded: 25000,
    overageRate: 0.0015,
    description: 'Advanced AI, real-time processing, enterprise features'
  },
  [SkillTier.ENTERPRISE]: {
    tier: SkillTier.ENTERPRISE,
    basePrice: 150,
    usageIncluded: 100000,
    overageRate: 0.001,
    description: 'Custom workflows, dedicated resources, priority execution'
  }
};

// Feature pricing adjusted to be more reasonable
export const FEATURE_PRICING = {
  // Communication Features
  ai_chatbot: { price: 25, tier: 'standard' },
  voice_assistant: { price: 45, tier: 'advanced' },

  // Integration Features
  api_access: { price: 35, tier: 'standard' },
  custom_integrations: { price: 75, tier: 'premium' },
  webhooks: { price: 15, tier: 'basic' },

  // Analytics Features
  advanced_analytics: { price: 45, tier: 'advanced' },
  custom_reporting: { price: 35, tier: 'standard' },

  // Security Features
  advanced_security: { price: 55, tier: 'advanced' },
  role_based_access: { price: 25, tier: 'standard' },
  audit_logs: { price: 20, tier: 'standard' },

  // Support Features
  priority_support: { price: 95, tier: 'premium' },
  sla_guarantee: { price: 75, tier: 'premium' },

  // Infrastructure
  dedicated_instance: { price: 195, tier: 'enterprise' },
  sandbox_environment: { price: 35, tier: 'standard' },

  // Platform Features
  mobile_app: { price: 85, tier: 'premium' },
  white_label: { price: 125, tier: 'enterprise' },
  multi_language: { price: 45, tier: 'advanced' },

  // Data Features
  data_export: { price: 15, tier: 'basic' },
  unlimited_usage: { price: 150, tier: 'enterprise' },
  custom_workflows: { price: 65, tier: 'advanced' }
};

// Map skills to their tiers
export const SKILL_TIER_MAPPING: Record<string, SkillTier> = {};

// Function to categorize skills by tier based on complexity
export function getSkillTier(skillId: string, skillName: string): SkillTier {
  const lowerName = skillName.toLowerCase();

  // Enterprise tier keywords
  if (lowerName.includes('custom') || lowerName.includes('enterprise') ||
      lowerName.includes('dedicated') || lowerName.includes('white label')) {
    return SkillTier.ENTERPRISE;
  }

  // Premium tier keywords
  if (lowerName.includes('advanced ai') || lowerName.includes('ml pipeline') ||
      lowerName.includes('real-time') || lowerName.includes('predictive') ||
      lowerName.includes('deep learning') || lowerName.includes('neural')) {
    return SkillTier.PREMIUM;
  }

  // Advanced tier keywords
  if (lowerName.includes('ai') || lowerName.includes('analytics') ||
      lowerName.includes('automation') || lowerName.includes('integration') ||
      lowerName.includes('processing') || lowerName.includes('optimization')) {
    return SkillTier.ADVANCED;
  }

  // Standard tier keywords
  if (lowerName.includes('api') || lowerName.includes('sync') ||
      lowerName.includes('workflow') || lowerName.includes('management') ||
      lowerName.includes('tracking') || lowerName.includes('monitoring')) {
    return SkillTier.STANDARD;
  }

  // Default to basic tier
  return SkillTier.BASIC;
}

// Calculate skill pricing
export function calculateSkillPrice(skillIds: string[], skillDetails: Array<{id: string, name: string}>): number {
  let totalPrice = 0;

  skillIds.forEach(skillId => {
    const skill = skillDetails.find(s => s.id === skillId);
    if (skill) {
      const tier = getSkillTier(skill.id, skill.name);
      const pricing = SKILL_PRICING_TIERS[tier];
      totalPrice += pricing.basePrice;
    }
  });

  return totalPrice;
}

// Calculate usage-based costs
export interface UsageData {
  skillId: string;
  executions: number;
  month: string;
}

export function calculateUsageCost(
  usageData: UsageData[],
  subscribedSkills: Array<{id: string, name: string, tier: SkillTier}>
): number {
  let totalUsageCost = 0;

  // Group usage by skill
  const usageBySkill = new Map<string, number>();
  usageData.forEach(usage => {
    const current = usageBySkill.get(usage.skillId) || 0;
    usageBySkill.set(usage.skillId, current + usage.executions);
  });

  // Calculate overage costs
  subscribedSkills.forEach(skill => {
    const usage = usageBySkill.get(skill.id) || 0;
    const pricing = SKILL_PRICING_TIERS[skill.tier];

    if (usage > pricing.usageIncluded) {
      const overage = usage - pricing.usageIncluded;
      totalUsageCost += overage * pricing.overageRate;
    }
  });

  return totalUsageCost;
}

// Get pricing breakdown for display
export interface PricingBreakdown {
  base: number;
  skills: {
    total: number;
    byTier: Record<SkillTier, { count: number; subtotal: number }>;
  };
  features: {
    total: number;
    items: Array<{ name: string; price: number }>;
  };
  usage: {
    estimated: number;
    included: number;
    overage: number;
  };
  total: number;
}

export function getDetailedPricingBreakdown(
  selectedSkills: string[],
  selectedFeatures: string[],
  skillDetails: Array<{id: string, name: string}>,
  estimatedUsage?: Map<string, number>
): PricingBreakdown {
  const base = 299;

  // Calculate skills by tier
  const skillsByTier: Record<SkillTier, { count: number; subtotal: number }> = {
    [SkillTier.BASIC]: { count: 0, subtotal: 0 },
    [SkillTier.STANDARD]: { count: 0, subtotal: 0 },
    [SkillTier.ADVANCED]: { count: 0, subtotal: 0 },
    [SkillTier.PREMIUM]: { count: 0, subtotal: 0 },
    [SkillTier.ENTERPRISE]: { count: 0, subtotal: 0 }
  };

  let totalSkillPrice = 0;
  let totalIncludedUsage = 0;

  selectedSkills.forEach(skillId => {
    const skill = skillDetails.find(s => s.id === skillId);
    if (skill) {
      const tier = getSkillTier(skill.id, skill.name);
      const pricing = SKILL_PRICING_TIERS[tier];

      skillsByTier[tier].count++;
      skillsByTier[tier].subtotal += pricing.basePrice;
      totalSkillPrice += pricing.basePrice;
      totalIncludedUsage += pricing.usageIncluded;
    }
  });

  // Calculate features
  const featureItems: Array<{ name: string; price: number }> = [];
  let totalFeaturePrice = 0;

  selectedFeatures.forEach(featureId => {
    const featurePricing = FEATURE_PRICING[featureId as keyof typeof FEATURE_PRICING];
    if (featurePricing) {
      featureItems.push({
        name: featureId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        price: featurePricing.price
      });
      totalFeaturePrice += featurePricing.price;
    }
  });

  // Estimate usage costs
  let estimatedUsageCost = 0;
  if (estimatedUsage) {
    selectedSkills.forEach(skillId => {
      const skill = skillDetails.find(s => s.id === skillId);
      if (skill) {
        const tier = getSkillTier(skill.id, skill.name);
        const pricing = SKILL_PRICING_TIERS[tier];
        const usage = estimatedUsage.get(skillId) || 0;

        if (usage > pricing.usageIncluded) {
          const overage = usage - pricing.usageIncluded;
          estimatedUsageCost += overage * pricing.overageRate;
        }
      }
    });
  }

  return {
    base,
    skills: {
      total: totalSkillPrice,
      byTier: skillsByTier
    },
    features: {
      total: totalFeaturePrice,
      items: featureItems
    },
    usage: {
      estimated: estimatedUsageCost,
      included: totalIncludedUsage,
      overage: estimatedUsageCost
    },
    total: base + totalSkillPrice + totalFeaturePrice
  };
}