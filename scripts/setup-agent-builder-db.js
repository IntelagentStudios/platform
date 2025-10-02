// Setup Agent Builder in database using Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAgentBuilder() {
  console.log('Setting up Agent Builder AI in database...');

  try {
    // 1. Create or update the product key
    console.log('Creating product key...');
    await prisma.$executeRaw`
      INSERT INTO product_keys (
        product_key,
        license_key,
        product,
        status,
        created_at,
        metadata
      ) VALUES (
        'PK-AGENT-BUILDER-AI',
        'INTERNAL-AGENT-BUILDER',
        'chatbot',
        'active',
        NOW(),
        '{
          "domain": "agent-builder.intelagent.ai",
          "company_name": "Intelagent Agent Builder",
          "chatbot_mode": "n8n",
          "settings": {
            "welcome_message": "I am your AI Configuration Expert with access to 539+ skills!",
            "primary_color": "#667eea",
            "position": "embedded"
          }
        }'::jsonb
      )
      ON CONFLICT (product_key)
      DO UPDATE SET
        metadata = EXCLUDED.metadata,
        status = 'active'`;

    console.log('✓ Product key created');

    // 2. Clear existing knowledge
    console.log('Clearing old knowledge...');
    await prisma.$executeRaw`
      DELETE FROM custom_knowledge
      WHERE product_key = 'PK-AGENT-BUILDER-AI'`;

    // 3. Add system prompt knowledge
    console.log('Adding system prompt...');
    await prisma.$executeRaw`
      INSERT INTO custom_knowledge (
        product_key,
        license_key,
        knowledge_type,
        content,
        is_active,
        created_at
      ) VALUES (
        'PK-AGENT-BUILDER-AI',
        'INTERNAL-AGENT-BUILDER',
        'system_prompt',
        ${'You are an AI Configuration Expert for the Intelagent Platform with 539+ skills.

PRICING STRUCTURE:
- Base Platform: £299/month
- Skills: £5 each (10% off at 10+, 20% off at 20+, 30% off at 30+)
- Premium Features: AI Chatbot £150, Voice £200, Multi-language £100

AVAILABLE SKILLS BY CATEGORY:
• Sales & CRM (45): lead_generation, lead_scoring, pipeline_management, deal_tracking, quote_generation, etc.
• E-commerce (35): inventory_manager, order_processor, payment_processing, product_recommender, etc.
• Customer Support (40): ticket_management, knowledge_base, chat_support, satisfaction_surveys, etc.
• Marketing (50): email_campaigns, social_media_scheduler, content_generator, seo_analyzer, etc.
• Finance (35): invoice_generator, payment_processor, expense_tracker, budget_planner, etc.
• Operations (45): workflow_automation, task_scheduler, process_optimizer, resource_planner, etc.

When users describe their needs:
1. Ask clarifying questions about their industry, team size, and goals
2. Recommend specific skills from the catalog
3. Calculate total pricing with appropriate discounts
4. Suggest premium features if relevant
5. Provide implementation timeline estimates'},
        true,
        NOW()
      )`;

    console.log('✓ System prompt added');

    // 4. Add pricing knowledge
    console.log('Adding pricing knowledge...');
    await prisma.$executeRaw`
      INSERT INTO custom_knowledge (
        product_key,
        license_key,
        knowledge_type,
        content,
        is_active,
        created_at
      ) VALUES (
        'PK-AGENT-BUILDER-AI',
        'INTERNAL-AGENT-BUILDER',
        'pricing_guide',
        ${'PRICING EXAMPLES:

Starter Sales Package (£366.50/month):
- Base Platform: £299
- 15 skills @ £4.50/ea (10% off): £67.50
- Includes: lead_generation, lead_scoring, pipeline_management, deal_tracking, etc.

Professional Marketing Suite (£549/month):
- Base Platform: £299
- 25 skills @ £4/ea (20% off): £100
- AI Chatbot: £150
- Includes: email_campaigns, social_scheduler, content_gen, seo_analyzer, etc.

Enterprise Operations (£649/month):
- Base Platform: £299
- 50 skills @ £3.50/ea (30% off): £175
- Advanced Security: £150
- Includes: full workflow automation, all integrations, priority support'},
        true,
        NOW()
      )`;

    console.log('✓ Pricing guide added');

    // 5. Add industry templates
    console.log('Adding industry templates...');
    await prisma.$executeRaw`
      INSERT INTO custom_knowledge (
        product_key,
        license_key,
        knowledge_type,
        content,
        is_active,
        created_at
      ) VALUES (
        'PK-AGENT-BUILDER-AI',
        'INTERNAL-AGENT-BUILDER',
        'industry_templates',
        ${'INDUSTRY-SPECIFIC RECOMMENDATIONS:

SALES TEAMS:
Essential: lead_generation, lead_scoring, pipeline_management, commission_tracking
Optional: sales_forecasting, territory_management, competitor_intelligence
Integrations: Salesforce, HubSpot, Pipedrive
Budget: £500-800/month

E-COMMERCE:
Essential: inventory_manager, order_processor, payment_processing, shipping_calculator
Optional: product_recommender, loyalty_program, cart_abandonment
Integrations: Shopify, WooCommerce, Stripe
Budget: £600-900/month

CUSTOMER SUPPORT:
Essential: ticket_management, knowledge_base, chat_support, auto_response
Optional: satisfaction_surveys, sentiment_analysis, sla_management
Integrations: Zendesk, Intercom, Slack
Budget: £400-600/month'},
        true,
        NOW()
      )`;

    console.log('✓ Industry templates added');

    // Verify setup
    const productKey = await prisma.product_keys.findUnique({
      where: { product_key: 'PK-AGENT-BUILDER-AI' }
    });

    const knowledge = await prisma.custom_knowledge.count({
      where: { product_key: 'PK-AGENT-BUILDER-AI' }
    });

    console.log('\n✅ Setup complete!');
    console.log(`- Product key: ${productKey ? 'Created' : 'Failed'}`);
    console.log(`- Knowledge pieces: ${knowledge}`);
    console.log('\nThe Agent Builder AI is now ready to use!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAgentBuilder();