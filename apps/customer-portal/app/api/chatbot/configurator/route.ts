import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groqKey = process.env.GROQ_API_KEY || '';
const groq = groqKey ? new Groq({
  apiKey: groqKey,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Configurator proxy received request:', {
      message: body.message?.substring(0, 100),
      messageLength: body.message?.length,
      hasMessage: !!body.message
    });

    // Extract context from message
    let userMessage = body.message || '';
    let context: any = {};

    const contextMatch = userMessage.match(/\[CONTEXT: Agent Builder - ([\s\S]*)\]$/);
    if (contextMatch) {
      try {
        context = JSON.parse(contextMatch[1]);
        userMessage = userMessage.replace(contextMatch[0], '').trim();
        console.log('Extracted user message:', userMessage);
      } catch (e) {
        console.error('Failed to parse context:', e);
        console.error('Context string:', contextMatch[1]?.substring(0, 200));
      }
    }

    // First, try the n8n webhook (which uses the new action-plan workflow)
    try {
      const n8nResponse = await fetch('https://1ntelagent.up.railway.app/webhook/configurator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: body.message })
      });

      if (n8nResponse.ok) {
        const responseText = await n8nResponse.text();
        if (responseText) {
          try {
            const data = JSON.parse(responseText);
            console.log('n8n response received:', {
              success: data.success,
              hasConfigUpdate: !!data.configUpdate,
              hasResults: !!data.results,
              sessionId: data.sessionId
            });

            // Handle new action-plan response format
            if (data && data.success && data.configUpdate) {
              const config = data.configUpdate;

              // Extract response text from the original LLM output in results
              let responseText = '';
              if (data.results && data.results.processed) {
                // Build a response based on what was processed
                const processed = data.results.processed;
                const skillsAdded = processed.filter((p: any) => p.type === 'add_skill').flatMap((p: any) => p.skills || []);
                const integrationsSet = processed.filter((p: any) => p.type === 'set_integrations').flatMap((p: any) => p.integrations || []);
                const featuresSet = processed.filter((p: any) => p.type === 'set_features').flatMap((p: any) => p.features || []);

                const parts = [];
                if (skillsAdded.length > 0) parts.push(`Added ${skillsAdded.length} skill(s): ${skillsAdded.join(', ')}`);
                if (integrationsSet.length > 0) parts.push(`Configured integrations: ${integrationsSet.join(', ')}`);
                if (featuresSet.length > 0) parts.push(`Enabled features: ${featuresSet.join(', ')}`);

                responseText = parts.length > 0 ? parts.join('\n• ') : 'Configuration updated successfully';

                // Add pricing info
                if (config.pricing) {
                  responseText += `\n\nTotal: £${config.pricing.total} (${config.pricing.totalSkills} skills)`;
                }
              }

              // Determine action type from configUpdate
              const determineActionType = (config: any) => {
                if (config.skills?.length > 0) return 'add_skills';
                if (config.integrations?.length > 0 || config.features?.length > 0) return 'set_configuration';
                return 'NONE';
              };

              // Build recommendations from configUpdate
              const recommendations = {
                skills: config.skills || [],
                integrations: config.integrations || [],
                features: config.features || [],
                pricing: config.pricing || null,
                action: determineActionType(config)
              };

              console.log('Returning n8n-formatted response:', {
                responseLength: responseText.length,
                skillsCount: recommendations.skills.length,
                integrationsCount: recommendations.integrations.length,
                featuresCount: recommendations.features.length
              });

              // Only include configuration data if there are actual changes
              const hasChanges = recommendations.skills.length > 0 ||
                                recommendations.integrations.length > 0 ||
                                recommendations.features.length > 0;

              return NextResponse.json({
                response: responseText,
                recommendations: hasChanges ? recommendations : {},
                source: 'n8n',
                actions: data.actions || [],
                hasConfigurationChanges: hasChanges
              });
            }
          } catch (e) {
            console.log('n8n response parsing error:', e);
            console.log('n8n response text:', responseText.substring(0, 200));
          }
        }
      }
    } catch (n8nError) {
      console.log('n8n webhook failed, falling back to Groq directly:', n8nError);
    }

    console.log('Using Groq API with key present:', !!groqKey);

    // Fallback to Groq for intelligent configuration
    if (!groq) {
      // If no Groq key, provide intelligent responses based on user input
      const lowerMessage = userMessage.toLowerCase();

      // Check for specific keywords and provide tailored responses
      if (lowerMessage.includes('account') && (lowerMessage.includes('handle') || lowerMessage.includes('manage') || lowerMessage.includes('accounting'))) {
        return NextResponse.json({
          response: `Excellent! Let's create a robust accounting agent that streamlines your financial operations. Here's what I'd include:\n\n• Automated invoice processing and payment tracking\n• Accurate expense management and categorization\n• Real-time financial reporting and analytics\n• Seamless integration with QuickBooks or Xero\n• Advanced security for sensitive financial data\n\nWhat type of accounting tasks do you want the agent to prioritize - invoicing, expense tracking, or financial reporting?`,
          recommendations: {
            skills: ['invoice_generation', 'expense_tracking', 'financial_reporting', 'payment_processing', 'bookkeeping'],
            integrations: ['quickbooks', 'xero', 'stripe', 'paypal', 'bank_sync'],
            features: ['advanced_security', 'api_access', 'white_label'],
            pricing: { base: 299, skills: 25, total: 324, discount: '0%' }
          }
        });
      }

      if (lowerMessage.includes('data') && (lowerMessage.includes('analys') || lowerMessage.includes('analyt'))) {
        return NextResponse.json({
          response: `Excellent! A data analytics agent will transform your raw data into actionable insights:\n\n• Collect and centralize data from multiple sources\n• Clean and prepare data automatically\n• Visualize trends with interactive dashboards\n• Generate predictive models and forecasts\n\nWhat's your primary data source - databases, APIs, or spreadsheets?`,
          recommendations: {
            skills: ['data_collection', 'data_cleaning', 'data_visualization', 'predictive_analytics'],
            integrations: ['google_analytics', 'mixpanel', 'postgresql', 'mongodb'],
            features: ['api_access', 'custom_dashboards', 'real_time_processing'],
            pricing: { base: 299, skills: 20, total: 319, discount: '0%' }
          }
        });
      }

      if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign') || lowerMessage.includes('advertis') || lowerMessage.includes('social')) {
        return NextResponse.json({
          response: `Perfect! Marketing is where AI really shines. Here's what I'd set up for maximum impact:\n\n• Create compelling content across all channels automatically\n• Schedule and optimize social media posting\n• Run personalized email campaigns that convert\n• Optimize your SEO and track rankings\n• Monitor campaign performance in real-time\n• Analyze competitor strategies and stay ahead\n• Find and connect with influencers\n• Optimize ad spend across platforms\n• Track brand mentions and sentiment\n• Generate video content effortlessly\n\nFor construction specifically, I'd add portfolio showcases and local SEO dominance.\n\nWhat's your current marketing team size?`,
          recommendations: {
            skills: ['content_generator', 'social_scheduler', 'email_campaigns', 'seo_optimizer', 'analytics_dashboard', 'competitor_analysis', 'influencer_finder', 'ad_optimizer', 'brand_monitoring', 'video_generator'],
            integrations: ['mailchimp', 'hootsuite', 'buffer', 'google_analytics', 'facebook'],
            features: ['ai_chatbot', 'multi_language', 'api_access'],
            pricing: { base: 299, skills: 50, total: 349, discount: '10%' }
          }
        });
      }

      if (lowerMessage.includes('sales') || lowerMessage.includes('lead') || lowerMessage.includes('crm')) {
        return NextResponse.json({
          response: `Excellent! A sales agent is one of our most popular configurations. Your AI sales team will:\n\n• Find and qualify prospects on autopilot\n• Score leads based on conversion probability\n• Manage your entire pipeline seamlessly\n• Send personalized outreach that actually works\n• Track deal momentum and alert on risks\n• Sync everything with Salesforce or HubSpot\n• Book meetings without the back-and-forth\n• Generate proposals in minutes, not hours\n• Monitor competitors and market changes\n• Forecast revenue with AI precision\n\nAre you more focused on inbound or outbound sales?`,
          recommendations: {
            skills: ['lead_generation', 'lead_scoring', 'pipeline_management', 'email_campaigns', 'deal_tracking', 'crm_integration', 'calendar_scheduling', 'proposal_generator', 'competitor_analysis', 'sales_forecasting'],
            integrations: ['salesforce', 'hubspot', 'gmail', 'outlook', 'calendly'],
            features: ['api_access', 'custom_workflows', 'ai_chatbot'],
            pricing: { base: 299, skills: 45, total: 344, discount: '10%' }
          }
        });
      }

      if (lowerMessage.includes('ecommerce') || lowerMessage.includes('e-commerce') || lowerMessage.includes('shop') || lowerMessage.includes('store')) {
        return NextResponse.json({
          response: `Great choice! E-commerce is where automation really pays off. Your AI will handle:\n\n• Track inventory and alert on low stock\n• Process orders automatically\n• Handle payment processing securely\n• Update customers on shipping status\n• Send timely order notifications\n• Recommend products to increase cart value\n• Optimize pricing dynamically\n• Collect and manage reviews\n• Recover abandoned carts\n• Detect and prevent fraud\n\nWhat platform are you using - Shopify, WooCommerce, or something else?`,
          recommendations: {
            skills: ['inventory_manager', 'order_processor', 'payment_processing', 'shipping_tracker', 'customer_notifications', 'product_recommendations', 'price_optimizer', 'review_manager', 'abandoned_cart', 'fraud_detection'],
            integrations: ['shopify', 'woocommerce', 'stripe', 'paypal', 'shipstation'],
            features: ['api_access', 'webhook_support', 'multi_language'],
            pricing: { base: 299, skills: 45, total: 344, discount: '10%' }
          }
        });
      }

      if (lowerMessage.includes('construction') || lowerMessage.includes('build') || lowerMessage.includes('contractor')) {
        return NextResponse.json({
          response: `Perfect timing! Construction companies see huge efficiency gains with AI. Here's what your agent will manage:\n\n• Track multiple job sites and timelines\n• Calculate bids and generate proposals instantly\n• Monitor permits and compliance requirements\n• Ensure OSHA safety documentation\n• Manage materials and equipment inventory\n• Find new project opportunities\n• Create professional quotes in minutes\n• Keep clients updated on progress\n• Automate progress billing\n• Collect testimonials and reviews\n• Schedule crews and subcontractors\n• Monitor weather for job sites\n• Organize project photos\n• Manage quality checklists\n• Track warranties and service\n\nDo you primarily work on residential or commercial projects?`,
          recommendations: {
            skills: ['project_manager', 'bid_calculator', 'permit_tracker', 'safety_compliance', 'lead_generation'],
            pricing: { base: 299, skills: 100, total: 399, discount: '20%' }
          }
        });
      }

      if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('ticket')) {
        return NextResponse.json({
          response: `Smart thinking! Support automation dramatically improves customer satisfaction. Your agent will:\n\n• Route and prioritize tickets intelligently\n• Suggest relevant knowledge base articles\n• Provide 24/7 instant responses\n• Handle frequently asked questions\n• Escalate complex issues appropriately\n• Analyze customer sentiment in real-time\n• Support multiple languages\n• Capture screen recordings for bugs\n• Track SLA compliance\n• Automate satisfaction surveys\n\nWhat's your average daily ticket volume?`,
          recommendations: {
            skills: ['ticket_management', 'knowledge_base', 'chat_support', 'faq_automation', 'escalation_manager'],
            pricing: { base: 299, skills: 54, total: 353, discount: '10%' }
          }
        });
      }

      // Default response for general queries
      return NextResponse.json({
        response: `Hello! I'm your AI Configuration Expert. I have access to our complete library of 539+ skills across all categories.\n\nTell me about your business needs, and I'll help you build the perfect AI agent configuration with:\n• Optimal skill selection from our catalog\n• Smart integrations recommendations\n• Volume discount optimization\n• Feature suggestions based on your industry\n\nWhat kind of AI agent would you like to build today?`,
        recommendations: {}
      });
    }

    const systemPrompt = `You are the Intelagent AI Configuration Expert - conversational, helpful, and knowledgeable about building custom AI agents from a catalog of 539+ skills.

HOW THE AGENT BUILDER WORKS:
1. Users chat with you to configure their AI agent
2. You help them select skills, integrations, and features
3. As they chat, the configuration updates in real-time on the right side
4. They can preview how their agent's dashboard will look
5. The preview shows the actual UI their agent will have
6. Once configured, they can purchase and deploy their agent

YOUR ROLE:
- Guide users through skill selection based on their needs
- Recommend relevant integrations (Salesforce, HubSpot, etc.)
- Suggest features (API access, white label, etc.)
- Build configurations that solve real business problems
- Each message updates their live configuration

PRICING REFERENCE (for your knowledge, don't mention unless asked):
- Base: £299/month
- Skills: £5 each (10+ get 10% off, 20+ get 20% off, 30+ get 30% off)
- Common totals: 5 skills=£324, 10=£344, 20=£379, 30=£404

Current context: ${JSON.stringify(context, null, 2)}

CONVERSATIONAL GUIDELINES:
1. BE NATURAL & VARIED:
   - Mix up your opening phrases ("Excellent!", "Great choice!", "Perfect timing!", "I love it!", "Absolutely!")
   - Use conversational transitions ("Actually,", "Here's the thing,", "What's interesting is,")
   - Ask engaging follow-ups ("What's your biggest pain point?", "How many customers do you serve?", "What's taking up most of your time?")
   - Be enthusiastic but professional

2. UNDERSTAND INTENT:
   - Questions ("what", "how", "why", "will it", "does it") = Don't change config, just answer
   - Modifications ("add", "I want", "include", "upgrade") = Update config
   - Clarifications about existing config = Explain without changing
   ${context.skills && context.skills.length > 0 ? `- Currently has ${context.skills.length} skills selected` : '- No skills selected yet'}

3. RESPONSE STRUCTURE:
   - Start with enthusiasm/acknowledgment (1 sentence)
   - Present recommendations with bullet points
   - IMPORTANT: Format bullets as:\n\n• First point\n• Second point\n• Third point\n\n(Double line breaks before first bullet, single between bullets, double after last)
   - End with a specific, relevant question
   - NO PRICE IN RESPONSE (it's shown separately)
   - Keep it 3-5 sentences plus bullets

4. CRITICAL BULLET POINT RULES:
   - Use • for bullets with line breaks between each
   - Write in benefit-focused language
   - Be specific but not technical
   - MUST match EXACT count to skills being recommended:
     * If recommending 4 skills = show EXACTLY 4 bullets
     * If recommending 5 skills = show EXACTLY 5 bullets
     * If recommending 10 skills = show EXACTLY 10 bullets
   - NEVER show more bullets than skills you're selecting
   - Each bullet should represent one actual skill

5. VARY YOUR LANGUAGE:
   Instead of always "I recommend these capabilities":
   - "Here's what I'd include:"
   - "Your agent will be able to:"
   - "This configuration gives you:"
   - "You'll get these powers:"
   - "Your toolkit includes:"
   - "I've put together:"
   - "This setup handles:"

6. INDUSTRY-SPECIFIC LANGUAGE:
   - Sales: "close more deals", "pipeline velocity", "conversion rates"
   - Marketing: "engagement", "reach", "brand presence", "ROI"
   - Support: "response times", "satisfaction scores", "ticket resolution"
   - E-commerce: "cart value", "conversion", "fulfillment"

INTEGRATION & FEATURE RECOMMENDATIONS:
   - CRM users: salesforce, hubspot, pipedrive integrations
   - Marketing focus: mailchimp, hootsuite, buffer integrations
   - Tech-savvy: api_access, custom_workflows, webhook features
   - Enterprise: white_label, multi_language, advanced_security features
   - Support teams: zendesk, intercom integrations + ai_chatbot feature

7. TECHNICAL OUTPUT (hidden from user):
   End response with:
   SKILLS:[skill1,skill2,...] (actual skill IDs)
   INTEGRATIONS:[integration1,integration2,...] (integration IDs)
   FEATURES:[feature1,feature2,...] (feature IDs)
   ACTION:ADD/REPLACE/NONE

EXAMPLE RESPONSES:

For "I want the ultimate sales agent":
"Absolutely! Let's build a sales powerhouse that works 24/7. Your agent will:\n\n• Identify and qualify high-value prospects automatically\n• Score leads based on buying signals and engagement\n• Run personalized email sequences that actually convert\n• Track every deal through your pipeline stages\n• Sync seamlessly with your CRM (Salesforce, HubSpot, etc)\n\nWhat size deals do you typically close?"
SKILLS:[lead_generation,lead_scoring,email_campaigns,pipeline_management]
INTEGRATIONS:[salesforce,hubspot,gmail]
FEATURES:[ai_chatbot,api_access]
ACTION:REPLACE

For "Will it work with Salesforce?":
"Yes! The agent integrates directly with Salesforce - it'll sync contacts, deals, and activities in real-time. You can even trigger automations based on Salesforce events.\n\nAre you using Sales Cloud or Service Cloud?"
SKILLS:[]
INTEGRATIONS:[]
FEATURES:[]
ACTION:NONE

For "I want to spend a bit more":
"Smart move! Let me add some game-changers to really accelerate your results:\n\n• AI-powered sales forecasting for accurate projections\n• Opportunity scoring to focus on winnable deals\n• Automated quote and proposal generation\n• Contract lifecycle management\n• Deep analytics on team performance\n\nHow many sales reps are on your team?"
SKILLS:[sales_forecasting,opportunity_tracking,quote_generation,contract_management,sales_analytics]
INTEGRATIONS:[zapier,slack]
FEATURES:[custom_workflows,multi_language]
ACTION:ADD

For "I need data analytics":
"Perfect! A data analytics agent will transform your raw data into actionable insights:\n\n• Collect and centralize data from multiple sources\n• Clean and prepare data automatically\n• Visualize trends with interactive dashboards\n• Generate predictive models and forecasts\n\nWhat's your primary data source - databases, APIs, or spreadsheets?"
SKILLS:[data_collection,data_cleaning,data_visualization,predictive_analytics]
INTEGRATIONS:[google_analytics,mixpanel,postgresql]
FEATURES:[api_access,custom_dashboards]
ACTION:REPLACE`;

    // Use Groq's Llama model for fast, intelligent responses
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Latest and most versatile model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.9,
      stream: false
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I can help you build the perfect AI agent. What specific business needs do you have?';

    // Parse AI response for skill recommendations, integrations, features and action type
    const skillMatches: string[] = [];
    const integrationMatches: string[] = [];
    const featureMatches: string[] = [];
    let actionType = 'REPLACE'; // default

    // Look for ACTION type
    const actionMatch = aiResponse.match(/ACTION:(\w+)/);
    if (actionMatch) {
      actionType = actionMatch[1];
    }

    // Look for the SKILLS: block that contains the actual skill IDs
    const skillsBlockMatch = aiResponse.match(/SKILLS:\[([^\]]+)\]/);
    if (skillsBlockMatch) {
      const skillsList = skillsBlockMatch[1].split(',').map(s => s.trim());
      skillMatches.push(...skillsList);
    }

    // Look for INTEGRATIONS: block
    const integrationsBlockMatch = aiResponse.match(/INTEGRATIONS:\[([^\]]+)\]/);
    if (integrationsBlockMatch) {
      const integrationsList = integrationsBlockMatch[1].split(',').map(s => s.trim());
      integrationMatches.push(...integrationsList);
    }

    // Look for FEATURES: block
    const featuresBlockMatch = aiResponse.match(/FEATURES:\[([^\]]+)\]/);
    if (featuresBlockMatch) {
      const featuresList = featuresBlockMatch[1].split(',').map(s => s.trim());
      featureMatches.push(...featuresList);
    }

    // Fallback: try to extract skills from bullet points if AI didn't follow format
    if (skillMatches.length === 0) {
      // Fallback: try to extract skills from bullet points if AI didn't follow format
      // Look for known skill patterns - expanded list
      const skillPattern = /\b(lead_generation|lead_scoring|pipeline_management|deal_tracking|email_campaigns|inventory_manager|order_processor|payment_processing|ticket_management|knowledge_base|chat_support|email_sender|sms_notifications|content_generator|seo_optimizer|invoice_generator|payment_processor|expense_tracker|bookkeeping|financial_reporting|budget_planning|general_ledger|accounts_receivable|accounts_payable|payroll_processing|tax_preparation|financial_analysis|audit_management|cash_flow_management|crm_integration|calendar_scheduling|proposal_generator|analytics_dashboard|competitor_analysis|sales_forecasting|quote_generation|sales_analytics|data_visualization|report_generator|trend_analysis|predictive_analytics|slack_integration|teams_connector|customer_notifications|shipping_tracker|fraud_detection|review_manager|abandoned_cart|product_recommendations|price_optimizer|workflow_automation|task_automation|process_optimization|revenue_forecasting|financial_planning|operations_management|business_intelligence|performance_tracking|kpi_monitoring|custom_reporting)\b/gi;
      const matches = aiResponse.match(skillPattern);
      if (matches) {
        skillMatches.push(...Array.from(new Set(matches.map(s => s.toLowerCase()))));
      }
    }

    // Clean the response to remove the technical blocks before sending to user
    let cleanResponse = aiResponse.replace(/\nSKILLS:\[[^\]]+\]/, '').trim();
    cleanResponse = cleanResponse.replace(/\nINTEGRATIONS:\[[^\]]+\]/, '').trim();
    cleanResponse = cleanResponse.replace(/\nFEATURES:\[[^\]]+\]/, '').trim();
    cleanResponse = cleanResponse.replace(/\nACTION:\w+/, '').trim();

    // Also remove any price mentions since it's shown separately
    cleanResponse = cleanResponse.replace(/Total: £\d+\/month\.?/g, '');
    cleanResponse = cleanResponse.replace(/£\d+\/month/g, '');
    cleanResponse = cleanResponse.replace(/Your current config remains at £\d+\/month/g, '');
    cleanResponse = cleanResponse.trim();

    const recommendedSkills = Array.from(new Set(skillMatches));
    const recommendedIntegrations = Array.from(new Set(integrationMatches));
    const recommendedFeatures = Array.from(new Set(featureMatches));

    console.log('AI Response:', aiResponse);
    console.log('Extracted skills:', recommendedSkills);
    console.log('Extracted integrations:', recommendedIntegrations);
    console.log('Extracted features:', recommendedFeatures);
    console.log('Skills count:', recommendedSkills.length);

    // Calculate pricing - must match UI calculation exactly
    let pricing = null;
    if (recommendedSkills.length > 0) {
      const skillCount = recommendedSkills.length;
      let pricePerSkill = 5;
      let discountPercent = 0;

      if (skillCount >= 30) {
        pricePerSkill = 3.5;
        discountPercent = 30;
      } else if (skillCount >= 20) {
        pricePerSkill = 4;
        discountPercent = 20;
      } else if (skillCount >= 10) {
        pricePerSkill = 4.5;
        discountPercent = 10;
      }

      const skillsTotal = skillCount * pricePerSkill;

      pricing = {
        base: 299,
        skills: skillsTotal,
        total: 299 + skillsTotal,
        discount: discountPercent > 0 ? `${discountPercent}%` : null,
        pricePerSkill: pricePerSkill
      };

      console.log('Calculated pricing:', pricing);
    }

    return NextResponse.json({
      response: cleanResponse,
      recommendations: {
        skills: recommendedSkills,
        integrations: recommendedIntegrations,
        features: recommendedFeatures,
        pricing: pricing,
        action: actionType
      }
    });

  } catch (error: any) {
    console.error('Configurator error:', error);
    console.error('Error stack:', error.stack);

    // Check if it's a specific error we can handle
    if (error.message?.includes('sales')) {
      // User mentioned sales, provide sales-specific response
      return NextResponse.json({
        response: `Absolutely! Sales is where AI agents really prove their worth. Your sales machine will:\n\n• Find and qualify prospects automatically\n• Score leads by conversion probability\n• Track deals through your pipeline\n• Run automated outreach campaigns\n• Monitor deal health and momentum\n• Sync with your CRM seamlessly\n• Book meetings without the hassle\n• Generate proposals instantly\n• Track all performance metrics\n\nWhat's your typical sales cycle length?`,
        recommendations: {
          skills: ['lead_generation', 'lead_scoring', 'pipeline_management', 'email_campaigns', 'deal_tracking', 'crm_integration', 'calendar_scheduling', 'proposal_generator', 'analytics_dashboard'],
          integrations: ['salesforce', 'hubspot', 'gmail'],
          features: ['api_access', 'custom_workflows'],
          pricing: { base: 299, skills: 40.5, total: 339.5, discount: '10%' }
        }
      });
    }

    // Generic fallback
    return NextResponse.json({
      response: `Let's build something amazing together! I have 539+ skills to work with.\n\nTell me:\n• What industry are you in?\n• What's your biggest challenge right now?\n• What tasks eat up most of your time?\n\nI'll create the perfect AI agent configuration for your specific needs.`,
      recommendations: {}
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}