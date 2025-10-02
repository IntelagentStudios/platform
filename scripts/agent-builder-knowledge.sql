-- Setup Agent Builder AI Knowledge Base
-- Run this in your database to configure the Agent Builder chatbot

-- 1. Create the product key for Agent Builder (if not exists)
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

-- 2. Clear existing knowledge for this product key
DELETE FROM custom_knowledge WHERE product_key = 'PK-AGENT-BUILDER-AI';

-- 3. Add Skills Catalog Knowledge
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
    'skills_catalog',
    E'# Intelagent Platform Skills Catalog\nTotal Available Skills: 539+\n\n## Skills by Category:\n\n### Sales & CRM (45 skills)\n- lead_generation: Lead Generation\n- lead_scoring: Lead Scoring\n- lead_nurturing: Lead Nurturing\n- contact_management: Contact Management\n- deal_tracking: Deal Tracking\n- pipeline_management: Pipeline Management\n- opportunity_tracking: Opportunity Tracking\n- sales_forecasting: Sales Forecasting\n- quote_generation: Quote Generation\n- proposal_builder: Proposal Builder\n- contract_management: Contract Management\n- account_management: Account Management\n- territory_management: Territory Management\n- commission_tracking: Commission Tracking\n- sales_analytics: Sales Analytics\n\n### Customer Support (40 skills)\n- ticket_management: Ticket Management\n- auto_response: Auto Response\n- knowledge_base: Knowledge Base\n- chat_support: Chat Support\n- faq_builder: FAQ Builder\n- customer_portal: Customer Portal\n- sla_management: SLA Management\n- escalation_rules: Escalation Rules\n- satisfaction_surveys: Satisfaction Surveys\n- help_desk: Help Desk\n- live_chat_widget: Live Chat Widget\n\n### Marketing & Social (50 skills)\n- email_campaigns: Email Campaign Manager\n- social_media_scheduler: Social Media Scheduler\n- content_generator: Content Generator\n- seo_analyzer: SEO Analyzer\n- keyword_research: Keyword Research\n- competitor_analysis: Competitor Analysis\n- ad_campaign_manager: Ad Campaign Manager\n- landing_page_builder: Landing Page Builder\n- ab_testing: A/B Testing\n- conversion_optimizer: Conversion Optimizer\n- influencer_outreach: Influencer Outreach\n- brand_monitoring: Brand Monitoring\n\n### Finance & Accounting (35 skills)\n- invoice_generator: Invoice Generator\n- payment_processor: Payment Processor\n- expense_tracker: Expense Tracker\n- budget_planner: Budget Planner\n- financial_reporter: Financial Reporter\n- tax_calculator: Tax Calculator\n- payroll_processor: Payroll Processor\n- accounts_receivable: Accounts Receivable\n- accounts_payable: Accounts Payable\n- cash_flow_analyzer: Cash Flow Analyzer\n- fraud_detector: Fraud Detector\n\n### Operations & Workflow (45 skills)\n- workflow_automation: Workflow Automation\n- task_scheduler: Task Scheduler\n- process_optimizer: Process Optimizer\n- resource_planner: Resource Planner\n- inventory_manager: Inventory Manager\n- supply_chain_tracker: Supply Chain Tracker\n- quality_control: Quality Control\n- compliance_monitor: Compliance Monitor\n- document_manager: Document Manager\n- approval_workflows: Approval Workflows\n\nAnd 300+ more specialized skills across AI/ML, Data Analytics, Security, Integration, and Industry-specific categories!',
    true,
    NOW()
);

-- 4. Add Pricing Knowledge
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
    'pricing',
    E'# Agent Pricing Structure\n\n## Base Platform Fee\n- £299/month - Includes platform access, dashboard, and core infrastructure\n\n## Skills Pricing with Volume Discounts\n- 1-9 skills: £5 per skill/month\n- 10-19 skills: £4.50 per skill/month (10% discount)\n- 20-29 skills: £4 per skill/month (20% discount)\n- 30+ skills: £3.50 per skill/month (30% discount)\n\n## Premium Features\n- AI Chatbot Widget: £150/month\n- Voice Assistant: £200/month\n- Multi-language Support: £100/month\n- White Label Options: £250/month\n- Advanced Security: £150/month\n- Priority Support: £100/month\n- API Access: £50/month\n- Webhooks: £40/month\n- Custom Reporting: £90/month\n- Mobile App: £200/month\n\n## Example Configurations\n- Starter (15 skills): £299 + £67.50 = £366.50/month\n- Professional (25 skills): £299 + £100 = £399/month\n- Enterprise (50 skills): £299 + £175 = £474/month',
    true,
    NOW()
);

-- 5. Add Industry Recommendations
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
    'industry_recommendations',
    E'# Industry-Specific Recommendations\n\n## For Sales Teams\nEssential: lead_generation, lead_scoring, pipeline_management, deal_tracking, quote_generation, commission_tracking\nIntegrations: Salesforce, HubSpot, Pipedrive\nBudget: £500-800/month\n\n## For E-commerce\nEssential: inventory_manager, order_processor, payment_processing, shipping_calculator, product_recommender, loyalty_program\nIntegrations: Shopify, WooCommerce, Stripe\nBudget: £600-900/month\n\n## For Customer Support\nEssential: ticket_management, auto_response, knowledge_base, chat_support, satisfaction_surveys\nIntegrations: Zendesk, Intercom, Slack\nBudget: £400-600/month\n\n## For Marketing\nEssential: email_campaigns, social_media_scheduler, content_generator, seo_analyzer, ab_testing, analytics_dashboard\nIntegrations: Mailchimp, Google Analytics\nBudget: £550-750/month',
    true,
    NOW()
);

-- 6. Add Configuration Guide
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
    'configuration_guide',
    E'# How to Build Your AI Agent\n\n## Step 1: Describe Your Needs\nTell me about:\n- Your industry and business type\n- Team size and structure\n- Main challenges you face\n- Current tools you use\n- Budget range\n\n## Step 2: I Will Recommend\n- Core skills for your use case\n- Compatible integrations\n- Optional premium features\n- Pricing with discounts applied\n\n## Step 3: You Can Customize\n- Add or remove skills\n- Select specific integrations\n- Choose premium features\n- See real-time pricing\n\n## Step 4: Preview & Deploy\n- See your dashboard preview\n- Review final configuration\n- Get implementation guide\n\nI can help you build agents for:\n- Sales automation\n- Customer support\n- Marketing campaigns\n- E-commerce operations\n- Financial management\n- Project management\n- HR & recruiting\n- And much more!\n\nJust describe what you need and I will create the perfect configuration!',
    true,
    NOW()
);

-- 7. Add chatbot configuration
INSERT INTO chatbot_config (
    product_key,
    license_key,
    domain,
    welcome_message,
    primary_color,
    secondary_color,
    position,
    auto_open_delay,
    notification_sound,
    collect_email,
    brand_name,
    is_active,
    allowed_domains,
    created_at,
    updated_at
) VALUES (
    'PK-AGENT-BUILDER-AI',
    'INTERNAL-AGENT-BUILDER',
    'agent-builder.intelagent.ai',
    E'👋 Hello! I''m your AI Configuration Expert. I have access to our complete library of 539+ skills.\n\nTell me about your business needs, and I''ll help you build the perfect AI agent with:\n• Optimal skill selection\n• Smart integrations\n• Volume discount pricing\n• Industry best practices\n\nWhat kind of AI agent would you like to build today?',
    '#667eea',
    '#764ba2',
    'embedded',
    0,
    false,
    false,
    'Intelagent Agent Builder',
    true,
    '{localhost,dashboard.intelagentstudios.com,intelagent.ai}',
    NOW(),
    NOW()
) ON CONFLICT (product_key) DO UPDATE
SET welcome_message = EXCLUDED.welcome_message,
    primary_color = EXCLUDED.primary_color,
    updated_at = NOW();

-- Verify the setup
SELECT
    'Product Key Created' as step,
    COUNT(*) as count
FROM product_keys
WHERE product_key = 'PK-AGENT-BUILDER-AI'
UNION ALL
SELECT
    'Knowledge Pieces Added' as step,
    COUNT(*) as count
FROM custom_knowledge
WHERE product_key = 'PK-AGENT-BUILDER-AI'
UNION ALL
SELECT
    'Chatbot Config Created' as step,
    COUNT(*) as count
FROM chatbot_config
WHERE product_key = 'PK-AGENT-BUILDER-AI';