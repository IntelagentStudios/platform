// Simple setup for Agent Builder using Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAgentBuilder() {
  console.log('Setting up Agent Builder AI...\n');

  try {
    // Create the product key
    console.log('1. Creating product key...');
    const productKey = await prisma.product_keys.upsert({
      where: { product_key: 'PK-AGENT-BUILDER-AI' },
      update: {
        status: 'active',
        metadata: {
          domain: 'agent-builder.intelagent.ai',
          company_name: 'Intelagent Agent Builder',
          chatbot_mode: 'n8n',
          settings: {
            welcome_message: 'I am your AI Configuration Expert with access to 539+ skills!',
            primary_color: '#667eea',
            position: 'embedded'
          }
        }
      },
      create: {
        product_key: 'PK-AGENT-BUILDER-AI',
        license_key: 'INTERNAL-AGENT-BUILDER',
        product: 'chatbot',
        status: 'active',
        metadata: {
          domain: 'agent-builder.intelagent.ai',
          company_name: 'Intelagent Agent Builder',
          chatbot_mode: 'n8n',
          settings: {
            welcome_message: 'I am your AI Configuration Expert with access to 539+ skills!',
            primary_color: '#667eea',
            position: 'embedded'
          }
        }
      }
    });
    console.log('✓ Product key created/updated');

    // Clear old knowledge
    console.log('\n2. Clearing old knowledge...');
    await prisma.custom_knowledge.deleteMany({
      where: { product_key: 'PK-AGENT-BUILDER-AI' }
    });
    console.log('✓ Old knowledge cleared');

    // Add knowledge pieces
    console.log('\n3. Adding knowledge base...');

    const knowledgePieces = [
      {
        product_key: 'PK-AGENT-BUILDER-AI',
        license_key: 'INTERNAL-AGENT-BUILDER',
        knowledge_type: 'system_context',
        content: `You are an AI Configuration Expert for Intelagent Platform.

Available: 539+ skills across Sales, E-commerce, Support, Marketing, Finance, Operations.

PRICING:
• Base: £299/month
• Skills: £5 each (10% off at 10+, 20% off at 20+, 30% off at 30+)
• Premium: AI Chatbot £150, Voice £200, Multi-language £100

Help users build optimal agent configurations.`,
        is_active: true,
        created_at: new Date()
      },
      {
        product_key: 'PK-AGENT-BUILDER-AI',
        license_key: 'INTERNAL-AGENT-BUILDER',
        knowledge_type: 'skills_list',
        content: `KEY SKILLS:

Sales: lead_generation, lead_scoring, pipeline_management, deal_tracking, quote_generation
E-commerce: inventory_manager, order_processor, payment_processing, product_recommender
Support: ticket_management, knowledge_base, chat_support, satisfaction_surveys
Marketing: email_campaigns, social_scheduler, content_generator, seo_analyzer
Finance: invoice_generator, payment_processor, expense_tracker, budget_planner
Operations: workflow_automation, task_scheduler, process_optimizer, resource_planner`,
        is_active: true,
        created_at: new Date()
      },
      {
        product_key: 'PK-AGENT-BUILDER-AI',
        license_key: 'INTERNAL-AGENT-BUILDER',
        knowledge_type: 'examples',
        content: `PACKAGE EXAMPLES:

Starter Sales (£366.50/mo):
- Base: £299
- 15 skills: £67.50 (with 10% discount)

Professional Marketing (£549/mo):
- Base: £299
- 25 skills: £100 (with 20% discount)
- AI Chatbot: £150

Enterprise (£649/mo):
- Base: £299
- 50 skills: £175 (with 30% discount)
- Advanced Security: £150
- Priority Support: £25`,
        is_active: true,
        created_at: new Date()
      }
    ];

    const result = await prisma.custom_knowledge.createMany({
      data: knowledgePieces
    });

    console.log(`✓ Added ${result.count} knowledge pieces`);

    // Verify
    console.log('\n4. Verifying setup...');
    const verify = await prisma.product_keys.findUnique({
      where: { product_key: 'PK-AGENT-BUILDER-AI' }
    });

    const knowledgeCount = await prisma.custom_knowledge.count({
      where: { product_key: 'PK-AGENT-BUILDER-AI' }
    });

    console.log('\n✅ SETUP COMPLETE!');
    console.log('------------------------');
    console.log(`Product Key: ${verify ? 'Active' : 'Failed'}`);
    console.log(`Knowledge Pieces: ${knowledgeCount}`);
    console.log('\nAgent Builder AI is ready at: PK-AGENT-BUILDER-AI');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. DATABASE_URL is set in .env');
    console.error('2. Database is accessible');
    console.error('3. Tables exist (product_keys, custom_knowledge)');
  } finally {
    await prisma.$disconnect();
  }
}

setupAgentBuilder();