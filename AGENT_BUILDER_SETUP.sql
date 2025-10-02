-- AGENT BUILDER AI SETUP
-- Copy and paste this into Railway's PostgreSQL Query interface

-- Step 1: Create Product Key
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
) ON CONFLICT (product_key) DO UPDATE
SET status = 'active',
    metadata = EXCLUDED.metadata;

-- Step 2: Clear old knowledge (if any)
DELETE FROM custom_knowledge WHERE product_key = 'PK-AGENT-BUILDER-AI';

-- Step 3: Add Knowledge Base
INSERT INTO custom_knowledge (product_key, license_key, knowledge_type, content, is_active, created_at)
VALUES
(
    'PK-AGENT-BUILDER-AI',
    'INTERNAL-AGENT-BUILDER',
    'context',
    'You are the Intelagent AI Configuration Expert. You help users build custom AI agents from our catalog of 539+ skills.

PRICING:
- Base Platform: £299/month
- Skills: £5 each
  - 10+ skills: 10% off (£4.50 each)
  - 20+ skills: 20% off (£4.00 each)
  - 30+ skills: 30% off (£3.50 each)

TOP SKILLS BY CATEGORY:
Sales: lead_generation, lead_scoring, pipeline_management, deal_tracking
E-commerce: inventory_manager, order_processor, payment_processing
Support: ticket_management, knowledge_base, chat_support
Marketing: email_campaigns, social_scheduler, content_generator
Finance: invoice_generator, payment_processor, expense_tracker

When users describe their needs, recommend specific skills and calculate pricing with discounts.',
    true,
    NOW()
),
(
    'PK-AGENT-BUILDER-AI',
    'INTERNAL-AGENT-BUILDER',
    'examples',
    'EXAMPLE PACKAGES:

STARTER SALES (£366.50/month):
- Base Platform: £299
- 15 skills @ £4.50: £67.50
- Includes: lead_gen, pipeline, deals, quotes

PROFESSIONAL MARKETING (£549/month):
- Base Platform: £299
- 25 skills @ £4.00: £100
- AI Chatbot: £150
- Includes: email, social, content, SEO, analytics

ENTERPRISE (£649/month):
- Base Platform: £299
- 50 skills @ £3.50: £175
- Advanced Security: £150
- Priority Support: £25
- Full automation suite',
    true,
    NOW()
);

-- Step 4: Verify Setup
SELECT 'Setup Complete!' as status,
       (SELECT COUNT(*) FROM product_keys WHERE product_key = 'PK-AGENT-BUILDER-AI') as product_key_exists,
       (SELECT COUNT(*) FROM custom_knowledge WHERE product_key = 'PK-AGENT-BUILDER-AI') as knowledge_pieces;