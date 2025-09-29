export interface SkillPricing {
  id: string;
  name: string;
  basePrice: number;
  category: string;
}

export interface ProductWithSkills {
  id: string;
  name: string;
  skills: string[];
  basePrice: number;
  features?: string[];
}

export interface UnifiedBillingResult {
  totalMonthlyPrice: number;
  uniqueSkills: Set<string>;
  sharedSkills: Set<string>;
  savings: number;
  products: ProductWithSkills[];
  breakdown: {
    productName: string;
    basePrice: number;
    uniqueSkillsCount: number;
    sharedSkillsCount: number;
    effectivePrice: number;
  }[];
}

// Master skill catalog with pricing
export const SKILL_CATALOG: { [key: string]: SkillPricing } = {
  // Sales Skills
  'lead_generation': { id: 'lead_generation', name: 'Lead Generation', basePrice: 15, category: 'sales' },
  'email_outreach': { id: 'email_outreach', name: 'Email Outreach', basePrice: 20, category: 'sales' },
  'crm_sync': { id: 'crm_sync', name: 'CRM Sync', basePrice: 25, category: 'sales' },
  'lead_scoring': { id: 'lead_scoring', name: 'Lead Scoring', basePrice: 18, category: 'sales' },
  'pipeline_management': { id: 'pipeline_management', name: 'Pipeline Management', basePrice: 22, category: 'sales' },

  // Support Skills
  'ticket_management': { id: 'ticket_management', name: 'Ticket Management', basePrice: 15, category: 'support' },
  'auto_response': { id: 'auto_response', name: 'Auto Response', basePrice: 12, category: 'support' },
  'knowledge_base': { id: 'knowledge_base', name: 'Knowledge Base', basePrice: 20, category: 'support' },
  'chat_support': { id: 'chat_support', name: 'Chat Support', basePrice: 25, category: 'support' },

  // Marketing Skills
  'content_creation': { id: 'content_creation', name: 'Content Creation', basePrice: 30, category: 'marketing' },
  'social_media': { id: 'social_media', name: 'Social Media', basePrice: 20, category: 'marketing' },
  'email_campaigns': { id: 'email_campaigns', name: 'Email Campaigns', basePrice: 25, category: 'marketing' },
  'analytics': { id: 'analytics', name: 'Analytics', basePrice: 15, category: 'analytics' },

  // Data Skills
  'data_collection': { id: 'data_collection', name: 'Data Collection', basePrice: 20, category: 'data' },
  'data_visualization': { id: 'data_visualization', name: 'Data Visualization', basePrice: 25, category: 'data' },
  'predictive_analytics': { id: 'predictive_analytics', name: 'Predictive Analytics', basePrice: 40, category: 'data' },
  'reporting': { id: 'reporting', name: 'Reporting', basePrice: 15, category: 'data' },

  // Operations Skills
  'workflow_automation': { id: 'workflow_automation', name: 'Workflow Automation', basePrice: 25, category: 'operations' },
  'process_optimization': { id: 'process_optimization', name: 'Process Optimization', basePrice: 30, category: 'operations' },
  'task_management': { id: 'task_management', name: 'Task Management', basePrice: 15, category: 'operations' },
  'resource_planning': { id: 'resource_planning', name: 'Resource Planning', basePrice: 20, category: 'operations' },

  // Shared/Common Skills
  'api_integration': { id: 'api_integration', name: 'API Integration', basePrice: 15, category: 'technical' },
  'custom_workflows': { id: 'custom_workflows', name: 'Custom Workflows', basePrice: 20, category: 'technical' },
  'report_generation': { id: 'report_generation', name: 'Report Generation', basePrice: 12, category: 'technical' },
  'file_management': { id: 'file_management', name: 'File Management', basePrice: 10, category: 'technical' },
  'email_integration': { id: 'email_integration', name: 'Email Integration', basePrice: 15, category: 'technical' },
  'calendar_management': { id: 'calendar_management', name: 'Calendar Management', basePrice: 12, category: 'technical' },
  'notification_system': { id: 'notification_system', name: 'Notification System', basePrice: 10, category: 'technical' },
  'dashboard_creation': { id: 'dashboard_creation', name: 'Dashboard Creation', basePrice: 20, category: 'technical' },
};

/**
 * Calculate unified billing with skill deduplication
 * Skills that are used across multiple products are only charged once
 */
export function calculateUnifiedBilling(products: ProductWithSkills[]): UnifiedBillingResult {
  // Track skill usage across products
  const skillUsageMap = new Map<string, string[]>(); // skill -> product IDs using it
  const uniqueSkills = new Set<string>();
  const sharedSkills = new Set<string>();

  // Build skill usage map
  products.forEach(product => {
    product.skills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
      if (!skillUsageMap.has(normalizedSkill)) {
        skillUsageMap.set(normalizedSkill, []);
      }
      skillUsageMap.get(normalizedSkill)!.push(product.id);
      uniqueSkills.add(normalizedSkill);
    });
  });

  // Identify shared skills (used by 2+ products)
  skillUsageMap.forEach((productIds, skill) => {
    if (productIds.length > 1) {
      sharedSkills.add(skill);
    }
  });

  // Calculate pricing breakdown
  const breakdown = products.map(product => {
    const productSkills = product.skills.map(s => s.toLowerCase().replace(/\s+/g, '_'));
    const uniqueToProduct = productSkills.filter(skill => {
      const usage = skillUsageMap.get(skill) || [];
      return usage.length === 1 && usage[0] === product.id;
    });
    const sharedByProduct = productSkills.filter(skill => sharedSkills.has(skill));

    // Calculate skill costs
    let skillCost = 0;
    uniqueToProduct.forEach(skill => {
      const catalogSkill = SKILL_CATALOG[skill];
      skillCost += catalogSkill ? catalogSkill.basePrice : 10; // Default price if not in catalog
    });

    // Shared skills are charged to the first product that uses them
    const isFirstProduct = products[0].id === product.id;
    if (isFirstProduct) {
      sharedByProduct.forEach(skill => {
        const catalogSkill = SKILL_CATALOG[skill];
        skillCost += catalogSkill ? catalogSkill.basePrice : 10;
      });
    }

    const effectivePrice = product.basePrice + skillCost;

    return {
      productName: product.name,
      basePrice: product.basePrice,
      uniqueSkillsCount: uniqueToProduct.length,
      sharedSkillsCount: sharedByProduct.length,
      effectivePrice
    };
  });

  // Calculate total and savings
  const totalMonthlyPrice = breakdown.reduce((sum, item) => sum + item.effectivePrice, 0);

  // Calculate what the price would be without deduplication
  let priceWithoutDedup = 0;
  products.forEach(product => {
    priceWithoutDedup += product.basePrice;
    product.skills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
      const catalogSkill = SKILL_CATALOG[normalizedSkill];
      priceWithoutDedup += catalogSkill ? catalogSkill.basePrice : 10;
    });
  });

  const savings = priceWithoutDedup - totalMonthlyPrice;

  return {
    totalMonthlyPrice,
    uniqueSkills,
    sharedSkills,
    savings,
    products,
    breakdown
  };
}

/**
 * Get skill overlap between products
 */
export function getSkillOverlap(products: ProductWithSkills[]): {
  overlapMatrix: { [key: string]: { [key: string]: string[] } };
  totalOverlap: number;
} {
  const overlapMatrix: { [key: string]: { [key: string]: string[] } } = {};
  let totalOverlap = 0;

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const product1 = products[i];
      const product2 = products[j];

      const skills1 = new Set(product1.skills.map(s => s.toLowerCase().replace(/\s+/g, '_')));
      const skills2 = new Set(product2.skills.map(s => s.toLowerCase().replace(/\s+/g, '_')));

      const overlap: string[] = [];
      skills1.forEach(skill => {
        if (skills2.has(skill)) {
          overlap.push(skill);
          totalOverlap++;
        }
      });

      if (overlap.length > 0) {
        if (!overlapMatrix[product1.id]) overlapMatrix[product1.id] = {};
        overlapMatrix[product1.id][product2.id] = overlap;
      }
    }
  }

  return { overlapMatrix, totalOverlap };
}

/**
 * Recommend products based on current selection to maximize skill sharing
 */
export function recommendComplementaryProducts(
  currentProducts: ProductWithSkills[],
  availableProducts: ProductWithSkills[]
): {
  product: ProductWithSkills;
  sharedSkillsCount: number;
  potentialSavings: number;
}[] {
  const currentSkills = new Set<string>();
  currentProducts.forEach(product => {
    product.skills.forEach(skill => {
      currentSkills.add(skill.toLowerCase().replace(/\s+/g, '_'));
    });
  });

  const recommendations = availableProducts.map(product => {
    let sharedCount = 0;
    let potentialSavings = 0;

    product.skills.forEach(skill => {
      const normalizedSkill = skill.toLowerCase().replace(/\s+/g, '_');
      if (currentSkills.has(normalizedSkill)) {
        sharedCount++;
        const catalogSkill = SKILL_CATALOG[normalizedSkill];
        potentialSavings += catalogSkill ? catalogSkill.basePrice : 10;
      }
    });

    return {
      product,
      sharedSkillsCount: sharedCount,
      potentialSavings
    };
  });

  // Sort by potential savings (highest first)
  return recommendations
    .filter(rec => rec.sharedSkillsCount > 0)
    .sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Calculate usage-based billing with token credits
 */
export interface UsageBasedBilling {
  monthlyTokenAllocation: number;
  pricePerMillionTokens: number;
  includedAPIcalls: number;
  pricePerThousandAPICalls: number;
}

export function calculateUsageBasedPricing(
  products: ProductWithSkills[],
  platformIntelligence: boolean = false
): UsageBasedBilling {
  // Base allocation per product type
  const tokenAllocations: { [key: string]: number } = {
    chatbot: 1000000, // 1M tokens
    sales_outreach: 2000000, // 2M tokens
    onboarding: 1500000, // 1.5M tokens
    custom: 1000000, // 1M tokens base
  };

  let totalTokenAllocation = 0;
  let totalAPIcalls = 0;

  products.forEach(product => {
    const baseAllocation = tokenAllocations[product.id] || 1000000;
    // Add 10% more tokens for each shared skill (efficiency bonus)
    const sharedSkillBonus = Math.floor(baseAllocation * 0.1 * (product.skills.length / 10));
    totalTokenAllocation += baseAllocation + sharedSkillBonus;

    // API calls based on product complexity
    totalAPIcalls += product.skills.length * 1000; // 1000 calls per skill per month
  });

  // Platform Intelligence bonus: 50% more tokens and API calls
  if (platformIntelligence) {
    totalTokenAllocation = Math.floor(totalTokenAllocation * 1.5);
    totalAPIcalls = Math.floor(totalAPIcalls * 1.5);
  }

  return {
    monthlyTokenAllocation: totalTokenAllocation,
    pricePerMillionTokens: 15, // £15 per million tokens after allocation
    includedAPIcalls: totalAPIcalls,
    pricePerThousandAPICalls: 2, // £2 per 1000 API calls after included
  };
}