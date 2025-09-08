import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Skill categories mapping
const skillCategories: Record<string, string[]> = {
  sales: [
    'email_automation',
    'lead_generation',
    'lead_scoring',
    'crm_integration',
    'salesforce_connector',
    'hubspot_integration',
    'email_composer',
    'response_creator',
    'meeting_scheduler',
    'pipeline_manager',
    'campaign_manager',
    'social_media_outreach',
    'linkedin_automation',
    'cold_email_generator',
    'follow_up_automation',
    'prospect_research',
    'data_enrichment',
    'contact_finder',
    'email_verifier',
    'sales_analytics'
  ],
  communication: [
    'email_composer',
    'response_creator',
    'chatbot_analytics',
    'chatbot_knowledge_manager',
    'chatbot_configuration',
    'natural_language_processing',
    'sentiment_analysis',
    'language_detection',
    'translation_service',
    'text_to_speech',
    'speech_to_text'
  ],
  automation: [
    'workflow_orchestration',
    'task_automation',
    'process_automation',
    'scheduling_automation',
    'bulk_operations',
    'batch_processing',
    'queue_management',
    'event_triggered_automation',
    'conditional_logic',
    'multi_step_workflows'
  ],
  analytics: [
    'sales_analytics',
    'performance_metrics',
    'conversion_tracking',
    'roi_calculator',
    'forecasting',
    'reporting_dashboard',
    'custom_reports',
    'data_visualization',
    'trend_analysis',
    'predictive_analytics'
  ],
  integration: [
    'api_connector',
    'webhook_handler',
    'database_sync',
    'file_import_export',
    'third_party_integration',
    'oauth_integration',
    'rest_api_client',
    'graphql_client',
    'websocket_connection',
    'event_streaming'
  ]
};

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

    // Get category from query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category || !skillCategories[category]) {
      return NextResponse.json({ 
        error: 'Invalid category. Available categories: ' + Object.keys(skillCategories).join(', ') 
      }, { status: 400 });
    }

    // Get user's license tier for skill availability
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    const tier = license?.tier || 'starter';
    const skillIds = skillCategories[category];

    // Create skill objects with proper metadata
    const skills = skillIds.map(skillId => {
      const skill = createSkillMetadata(skillId, tier);
      return skill;
    });

    // Check which skills are already enabled for this user's products
    const productKeys = await prisma.product_keys.findMany({
      where: { 
        license_key: user.license_key,
        status: 'active'
      }
    });

    const enabledSkills = new Set<string>();
    productKeys.forEach(pk => {
      const assignedSkills = pk.assigned_skills as string[];
      if (assignedSkills) {
        assignedSkills.forEach(s => enabledSkills.add(s));
      }
    });

    // Mark enabled skills
    const enrichedSkills = skills.map(skill => ({
      ...skill,
      enabled: enabledSkills.has(skill.id),
      available: canUseSkill(skill.tier, tier)
    }));

    return NextResponse.json({
      category,
      skills: enrichedSkills,
      totalSkills: enrichedSkills.length,
      enabledCount: enrichedSkills.filter(s => s.enabled).length,
      userTier: tier
    });

  } catch (error: any) {
    console.error('Error fetching skills by category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

function createSkillMetadata(skillId: string, userTier: string) {
  // Create metadata for each skill
  const skillMetadata: Record<string, any> = {
    email_automation: {
      id: 'email_automation',
      name: 'Email Automation',
      description: 'Automated email sequences and follow-ups',
      tier: 'standard',
      complexity: 3,
      priceImpact: 50
    },
    lead_generation: {
      id: 'lead_generation',
      name: 'Lead Generation',
      description: 'Find and qualify new prospects',
      tier: 'standard',
      complexity: 4,
      priceImpact: 75
    },
    lead_scoring: {
      id: 'lead_scoring',
      name: 'Lead Scoring',
      description: 'Score and prioritize leads based on behavior',
      tier: 'premium',
      complexity: 3,
      priceImpact: 60
    },
    crm_integration: {
      id: 'crm_integration',
      name: 'CRM Integration',
      description: 'Connect with your CRM system',
      tier: 'standard',
      complexity: 3,
      priceImpact: 40
    },
    salesforce_connector: {
      id: 'salesforce_connector',
      name: 'Salesforce Connector',
      description: 'Direct integration with Salesforce CRM',
      tier: 'premium',
      complexity: 4,
      priceImpact: 100
    },
    hubspot_integration: {
      id: 'hubspot_integration',
      name: 'HubSpot Integration',
      description: 'Connect with HubSpot CRM and Marketing',
      tier: 'premium',
      complexity: 4,
      priceImpact: 100
    },
    email_composer: {
      id: 'email_composer',
      name: 'Email Composer',
      description: 'AI-powered email writing assistant',
      tier: 'standard',
      complexity: 2,
      priceImpact: 30
    },
    response_creator: {
      id: 'response_creator',
      name: 'Response Creator',
      description: 'Generate personalized responses',
      tier: 'standard',
      complexity: 2,
      priceImpact: 30
    },
    meeting_scheduler: {
      id: 'meeting_scheduler',
      name: 'Meeting Scheduler',
      description: 'Automated meeting booking and calendar sync',
      tier: 'standard',
      complexity: 3,
      priceImpact: 40
    },
    pipeline_manager: {
      id: 'pipeline_manager',
      name: 'Pipeline Manager',
      description: 'Manage sales pipeline stages',
      tier: 'premium',
      complexity: 4,
      priceImpact: 80
    },
    campaign_manager: {
      id: 'campaign_manager',
      name: 'Campaign Manager',
      description: 'Create and manage outreach campaigns',
      tier: 'standard',
      complexity: 3,
      priceImpact: 60
    },
    social_media_outreach: {
      id: 'social_media_outreach',
      name: 'Social Media Outreach',
      description: 'Engage prospects on social platforms',
      tier: 'premium',
      complexity: 3,
      priceImpact: 70
    },
    linkedin_automation: {
      id: 'linkedin_automation',
      name: 'LinkedIn Automation',
      description: 'Automate LinkedIn outreach and connections',
      tier: 'enterprise',
      complexity: 4,
      priceImpact: 120
    },
    sales_analytics: {
      id: 'sales_analytics',
      name: 'Sales Analytics',
      description: 'Track sales performance and metrics',
      tier: 'standard',
      complexity: 2,
      priceImpact: 40
    },
    data_enrichment: {
      id: 'data_enrichment',
      name: 'Data Enrichment',
      description: 'Enrich lead data with additional information',
      tier: 'premium',
      complexity: 3,
      priceImpact: 80
    }
  };

  // Return default if not found
  return skillMetadata[skillId] || {
    id: skillId,
    name: skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Skill for ' + skillId.replace(/_/g, ' '),
    tier: 'standard',
    complexity: 2,
    priceImpact: 20
  };
}

function canUseSkill(skillTier: string, userTier: string): boolean {
  const tierHierarchy: Record<string, number> = {
    starter: 1,
    pro: 2,
    enterprise: 3
  };

  const skillTierLevel: Record<string, number> = {
    core: 0,
    standard: 1,
    premium: 2,
    enterprise: 3
  };

  const userLevel = tierHierarchy[userTier] || 1;
  const requiredLevel = skillTierLevel[skillTier] || 1;

  return userLevel >= requiredLevel;
}