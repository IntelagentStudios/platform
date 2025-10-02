import { PrismaClient } from '@prisma/client';
import { SKILLS_CATALOG, TOTAL_SKILLS } from '../apps/customer-portal/utils/skillsCatalog';

const prisma = new PrismaClient();

async function setupAgentBuilderKnowledge() {
  console.log('Setting up Agent Builder AI knowledge base...');

  const AGENT_BUILDER_KEY = 'PK-AGENT-BUILDER-AI';

  try {
    // First, ensure the product key exists
    const existingKey = await prisma.product_keys.findUnique({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    if (!existingKey) {
      // Create the product key for Agent Builder
      await prisma.product_keys.create({
        data: {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER', // Internal use
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
      console.log('Created Agent Builder product key');
    }

    // Generate comprehensive skills knowledge
    let skillsKnowledge = `# Intelagent Platform Skills Catalog
Total Available Skills: ${TOTAL_SKILLS}+

## Skills by Category:\n\n`;

    Object.entries(SKILLS_CATALOG).forEach(([category, skills]) => {
      skillsKnowledge += `### ${category} (${skills.length} skills)\n`;
      skills.forEach(skill => {
        skillsKnowledge += `- **${skill.id}**: ${skill.name}${skill.description ? ` - ${skill.description}` : ''}\n`;
      });
      skillsKnowledge += '\n';
    });

    // Add pricing knowledge
    const pricingKnowledge = `# Agent Pricing Structure

## Base Platform Fee
- £299/month - Includes platform access, dashboard, and core infrastructure

## Skills Pricing with Volume Discounts
- 1-9 skills: £5 per skill/month
- 10-19 skills: £4.50 per skill/month (10% discount)
- 20-29 skills: £4 per skill/month (20% discount)
- 30+ skills: £3.50 per skill/month (30% discount)

## Premium Features
- AI Chatbot Widget: £150/month - Full conversational AI with custom training
- Voice Assistant: £200/month - Natural voice interactions
- Multi-language Support: £100/month - Support for 50+ languages
- White Label Options: £250/month - Complete brand customization
- Advanced Security: £150/month - Enterprise-grade security features
- Priority Support: £100/month - 24/7 dedicated support
- API Access: £50/month - Full API for integrations
- Webhooks: £40/month - Real-time event notifications
- Custom Reporting: £90/month - Build custom reports and dashboards
- Mobile App: £200/month - iOS & Android companion apps

## Usage-Based Pricing (Optional)
- Pay-as-you-go option available for all skills
- Usage tracked per execution
- Volume discounts apply to usage tiers
`;

    // Add industry recommendations
    const industryKnowledge = `# Industry-Specific Recommendations

## Sales Teams
Essential Skills: lead_generation, lead_scoring, lead_nurturing, pipeline_management, deal_tracking, quote_generation, proposal_builder, contract_management, sales_forecasting, commission_tracking
Recommended Integrations: Salesforce, HubSpot, Pipedrive
Typical Investment: £500-800/month

## E-commerce
Essential Skills: inventory_manager, order_processor, payment_processing, shipping_calculator, product_recommender, cart_abandonment, discount_engine, loyalty_program, review_collector
Recommended Integrations: Shopify, WooCommerce, Stripe, PayPal
Typical Investment: £600-900/month

## Customer Support
Essential Skills: ticket_management, auto_response, knowledge_base, chat_support, faq_builder, sla_management, satisfaction_surveys, sentiment_analysis
Recommended Integrations: Zendesk, Freshdesk, Intercom, Slack
Typical Investment: £400-600/month

## Marketing Teams
Essential Skills: email_campaigns, social_media_scheduler, content_generator, seo_analyzer, ab_testing, conversion_tracker, analytics_dashboard, roi_calculator
Recommended Integrations: Mailchimp, Google Analytics, Facebook, LinkedIn
Typical Investment: £550-750/month

## Finance & Accounting
Essential Skills: invoice_generator, payment_processor, expense_tracker, budget_planner, financial_reporter, tax_calculator, fraud_detector
Recommended Integrations: QuickBooks, Xero, Stripe, PayPal
Typical Investment: £450-650/month
`;

    // Add configuration tips
    const configurationTips = `# Agent Configuration Best Practices

## Starting Points
1. Begin with 10-15 core skills for your primary use case
2. Add integrations for your existing tools
3. Consider premium features based on team size
4. Plan for 20-30% growth in first 6 months

## Optimization Tips
- Group related skills for better efficiency
- Use volume discounts by bundling skills
- Start with essential features, add premium later
- Monitor usage to identify underutilized skills

## Common Configurations

### Starter Sales Agent (£450/month)
- Base Platform: £299
- 15 sales skills: £52.50 (with 10% discount)
- 3 integrations: Included
- AI Chatbot: £150 (optional)

### Professional Marketing Suite (£650/month)
- Base Platform: £299
- 25 marketing skills: £100 (with 20% discount)
- 5 integrations: Included
- Multi-language: £100
- Custom Reporting: £90
- API Access: £50

### Enterprise Operations Platform (£1,200/month)
- Base Platform: £299
- 50 operations skills: £175 (with 30% discount)
- 10+ integrations: Included
- AI Chatbot: £150
- Voice Assistant: £200
- Advanced Security: £150
- Priority Support: £100
- White Label: £250

## How to Build Your Agent

1. **Describe Your Business Need**: Tell me about your industry, team size, and main challenges
2. **I'll Recommend Skills**: Based on your needs, I'll suggest the optimal skill combination
3. **Review Integrations**: We'll ensure compatibility with your existing tools
4. **Optimize Pricing**: I'll apply volume discounts to get you the best value
5. **Preview & Deploy**: See your dashboard preview before going live

I have access to all ${TOTAL_SKILLS}+ skills and can create any combination to meet your specific needs!`;

    // Clear existing knowledge for this product key
    await prisma.custom_knowledge.deleteMany({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    // Add all knowledge pieces
    const knowledgePieces = [
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
        knowledge_type: 'industry_recommendations',
        content: industryKnowledge,
        is_active: true,
        created_at: new Date()
      },
      {
        product_key: AGENT_BUILDER_KEY,
        license_key: 'INTERNAL-AGENT-BUILDER',
        knowledge_type: 'configuration_guide',
        content: configurationTips,
        is_active: true,
        created_at: new Date()
      }
    ];

    // Insert all knowledge
    await prisma.custom_knowledge.createMany({
      data: knowledgePieces
    });

    console.log(`✅ Successfully added ${knowledgePieces.length} knowledge pieces for Agent Builder AI`);

    // Also add a chatbot_config entry
    const existingConfig = await prisma.chatbot_config.findFirst({
      where: { product_key: AGENT_BUILDER_KEY }
    });

    if (!existingConfig) {
      await prisma.chatbot_config.create({
        data: {
          product_key: AGENT_BUILDER_KEY,
          license_key: 'INTERNAL-AGENT-BUILDER',
          domain: 'agent-builder.intelagent.ai',
          welcome_message: "👋 Hello! I'm your AI Configuration Expert. I have access to our complete library of 539+ skills. Tell me about your business needs, and I'll help you build the perfect AI agent!",
          primary_color: '#667eea',
          secondary_color: '#764ba2',
          position: 'embedded',
          auto_open_delay: 0,
          notification_sound: false,
          collect_email: false,
          brand_name: 'Intelagent Agent Builder',
          brand_logo: '/logo.png',
          is_active: true,
          custom_css: `
            .agent-builder-widget {
              font-family: 'Inter', -apple-system, sans-serif;
            }
            .agent-builder-widget .message.assistant {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
          `,
          allowed_domains: ['localhost', 'dashboard.intelagentstudios.com', 'intelagent.ai'],
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('✅ Created chatbot configuration for Agent Builder');
    }

    console.log('✅ Agent Builder AI knowledge base setup complete!');

  } catch (error) {
    console.error('Error setting up Agent Builder knowledge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAgentBuilderKnowledge();