import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SKILLS_CATALOG, TOTAL_SKILLS } from '@/utils/skillsCatalog';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const AGENT_BUILDER_KEY = 'PK-AGENT-BUILDER-AI';
    console.log('Setting up Agent Builder AI knowledge base...');

    // 1. Ensure product key exists
    const existingKey = await prisma.product_keys.findUnique({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    if (!existingKey) {
      await prisma.product_keys.create({
        data: {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          product: 'chatbot',
          status: 'active',
          created_at: new Date(),
          metadata: {
            domain: 'agent-builder.intelagent.ai',
            company_name: 'Intelagent Agent Builder',
            chatbot_mode: 'n8n',
            settings: {
              welcome_message: "I'm your AI Configuration Expert with access to 539+ skills!",
              primary_color: '#667eea',
              position: 'embedded'
            }
          }
        }
      });
    }

    // 2. Generate comprehensive skills knowledge
    let skillsKnowledge = `# Intelagent Platform Skills Catalog\nTotal Available Skills: ${TOTAL_SKILLS}+\n\n## Skills by Category:\n\n`;

    Object.entries(SKILLS_CATALOG).forEach(([category, skills]) => {
      skillsKnowledge += `### ${category} (${skills.length} skills)\n`;
      skills.slice(0, 10).forEach(skill => {
        skillsKnowledge += `- **${skill.id}**: ${skill.name}\n`;
      });
      if (skills.length > 10) {
        skillsKnowledge += `... and ${skills.length - 10} more ${category} skills\n`;
      }
      skillsKnowledge += '\n';
    });

    // 3. Pricing knowledge
    const pricingKnowledge = `# Agent Pricing Structure

## Base Platform: £299/month

## Skills Pricing with Volume Discounts:
- 1-9 skills: £5 per skill/month
- 10-19 skills: £4.50 per skill/month (10% off)
- 20-29 skills: £4 per skill/month (20% off)
- 30+ skills: £3.50 per skill/month (30% off)

## Premium Features:
- AI Chatbot Widget: £150/month
- Voice Assistant: £200/month
- Multi-language Support: £100/month
- White Label: £250/month
- Advanced Security: £150/month
- Priority Support: £100/month
- API Access: £50/month

## Example Packages:
- Starter (15 skills): £366.50/month
- Professional (25 skills): £399/month
- Enterprise (50 skills): £474/month`;

    // 4. Industry recommendations
    const industryKnowledge = `# Industry Recommendations

## Sales Teams
Skills: lead_generation, lead_scoring, pipeline_management, deal_tracking, commission_tracking
Integrations: Salesforce, HubSpot
Budget: £500-800/month

## E-commerce
Skills: inventory_manager, order_processor, payment_processing, product_recommender
Integrations: Shopify, Stripe
Budget: £600-900/month

## Customer Support
Skills: ticket_management, knowledge_base, chat_support, satisfaction_surveys
Integrations: Zendesk, Slack
Budget: £400-600/month`;

    // 5. Clear existing knowledge
    await prisma.custom_knowledge.deleteMany({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    // 6. Add knowledge pieces
    const knowledge = await prisma.custom_knowledge.createMany({
      data: [
        {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          knowledge_type: 'skills_catalog',
          content: skillsKnowledge,
          is_active: true,
          created_at: new Date()
        },
        {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          knowledge_type: 'pricing',
          content: pricingKnowledge,
          is_active: true,
          created_at: new Date()
        },
        {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          knowledge_type: 'industry',
          content: industryKnowledge,
          is_active: true,
          created_at: new Date()
        }
      ]
    });

    // 7. Ensure chatbot config exists
    const existingConfig = await prisma.chatbot_config.findFirst({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    if (!existingConfig) {
      await prisma.chatbot_config.create({
        data: {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          domain: 'agent-builder.intelagent.ai',
          welcome_message: "👋 I'm your AI Configuration Expert with access to 539+ skills!",
          primary_color: '#667eea',
          secondary_color: '#764ba2',
          position: 'embedded',
          auto_open_delay: 0,
          notification_sound: false,
          collect_email: false,
          brand_name: 'Agent Builder AI',
          is_active: true,
          allowed_domains: ['localhost', 'dashboard.intelagentstudios.com'],
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent Builder AI setup complete',
      knowledgePieces: knowledge.count,
      productKey: AGENT_BUILDER_KEY
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to setup Agent Builder'
    }, { status: 500 });
  }
}