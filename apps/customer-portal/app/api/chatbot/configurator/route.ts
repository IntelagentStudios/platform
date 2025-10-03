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

    // First, try the n8n webhook (which also uses Groq)
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
            if (data && data.response) {
              return NextResponse.json(data);
            }
          } catch (e) {
            console.log('n8n response not JSON:', responseText.substring(0, 100));
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
      if (lowerMessage.includes('marketing') || lowerMessage.includes('campaign') || lowerMessage.includes('advertis') || lowerMessage.includes('social')) {
        return NextResponse.json({
          response: `Perfect! Marketing is where AI really shines. Here's what I'd set up for maximum impact:

• Create compelling content across all channels automatically
• Schedule and optimize social media posting
• Run personalized email campaigns that convert
• Optimize your SEO and track rankings
• Monitor campaign performance in real-time
• Analyze competitor strategies and stay ahead
• Find and connect with influencers
• Optimize ad spend across platforms
• Track brand mentions and sentiment
• Generate video content effortlessly

For construction specifically, I'd add portfolio showcases and local SEO dominance.

What's your current marketing team size?`,
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
          response: `Excellent! A sales agent is one of our most popular configurations. Your AI sales team will:

• Find and qualify prospects on autopilot
• Score leads based on conversion probability
• Manage your entire pipeline seamlessly
• Send personalized outreach that actually works
• Track deal momentum and alert on risks
• Sync everything with Salesforce or HubSpot
• Book meetings without the back-and-forth
• Generate proposals in minutes, not hours
• Monitor competitors and market changes
• Forecast revenue with AI precision

Are you more focused on inbound or outbound sales?`,
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
          response: `Great choice! E-commerce is where automation really pays off. Your AI will handle:

• Track inventory and alert on low stock
• Process orders automatically
• Handle payment processing securely
• Update customers on shipping status
• Send timely order notifications
• Recommend products to increase cart value
• Optimize pricing dynamically
• Collect and manage reviews
• Recover abandoned carts
• Detect and prevent fraud

What platform are you using - Shopify, WooCommerce, or something else?`,
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
          response: `Perfect timing! Construction companies see huge efficiency gains with AI. Here's what your agent will manage:

• Track multiple job sites and timelines
• Calculate bids and generate proposals instantly
• Monitor permits and compliance requirements
• Ensure OSHA safety documentation
• Manage materials and equipment inventory
• Find new project opportunities
• Create professional quotes in minutes
• Keep clients updated on progress
• Automate progress billing
• Collect testimonials and reviews
• Schedule crews and subcontractors
• Monitor weather for job sites
• Organize project photos
• Manage quality checklists
• Track warranties and service

Do you primarily work on residential or commercial projects?`,
          recommendations: {
            skills: ['project_manager', 'bid_calculator', 'permit_tracker', 'safety_compliance', 'lead_generation'],
            pricing: { base: 299, skills: 100, total: 399, discount: '20%' }
          }
        });
      }

      if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('ticket')) {
        return NextResponse.json({
          response: `Smart thinking! Support automation dramatically improves customer satisfaction. Your agent will:

• Route and prioritize tickets intelligently
• Suggest relevant knowledge base articles
• Provide 24/7 instant responses
• Handle frequently asked questions
• Escalate complex issues appropriately
• Analyze customer sentiment in real-time
• Support multiple languages
• Capture screen recordings for bugs
• Track SLA compliance
• Automate satisfaction surveys

What's your average daily ticket volume?`,
          recommendations: {
            skills: ['ticket_management', 'knowledge_base', 'chat_support', 'faq_automation', 'escalation_manager'],
            pricing: { base: 299, skills: 54, total: 353, discount: '10%' }
          }
        });
      }

      // Default response for general queries
      return NextResponse.json({
        response: `Hello! I'm your AI Configuration Expert. I have access to our complete library of 539+ skills across all categories.

Tell me about your business needs, and I'll help you build the perfect AI agent configuration with:
• Optimal skill selection from our catalog
• Smart integrations recommendations
• Volume discount optimization
• Feature suggestions based on your industry

What kind of AI agent would you like to build today?`,
        recommendations: {}
      });
    }

    const systemPrompt = `You are the Intelagent AI Configuration Expert - conversational, helpful, and knowledgeable about building custom AI agents from a catalog of 539+ skills.

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
   - End with a specific, relevant question
   - NO PRICE IN RESPONSE (it's shown separately)
   - Keep it 3-5 sentences plus bullets

4. BULLET POINT RULES:
   - Use • for bullets
   - Write in benefit-focused language
   - Be specific but not technical
   - Match count to skills being recommended:
     * 5 skills = 5 bullets
     * 10 skills = 10 bullets (can group related ones)
     * 20+ skills = Group into categories with sub-bullets

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
"Absolutely! Let's build a sales powerhouse that works 24/7. Your agent will:

• Identify and qualify high-value prospects automatically
• Score leads based on buying signals and engagement
• Run personalized email sequences that actually convert
• Track every deal through your pipeline stages
• Sync seamlessly with your CRM (Salesforce, HubSpot, etc)

What size deals do you typically close?"
SKILLS:[lead_generation,lead_scoring,email_campaigns,pipeline_management]
INTEGRATIONS:[salesforce,hubspot,gmail]
FEATURES:[ai_chatbot,api_access]
ACTION:REPLACE

For "Will it work with Salesforce?":
"Yes! The agent integrates directly with Salesforce - it'll sync contacts, deals, and activities in real-time. You can even trigger automations based on Salesforce events. Are you using Sales Cloud or Service Cloud?"
SKILLS:[]
INTEGRATIONS:[]
FEATURES:[]
ACTION:NONE

For "I want to spend a bit more":
"Smart move! Let me add some game-changers to really accelerate your results:

• AI-powered sales forecasting for accurate projections
• Opportunity scoring to focus on winnable deals
• Automated quote and proposal generation
• Contract lifecycle management
• Deep analytics on team performance
• Advanced workflow automation
• Multi-language support

How many sales reps are on your team?"
SKILLS:[sales_forecasting,opportunity_tracking,quote_generation,contract_management,sales_analytics]
INTEGRATIONS:[zapier,slack]
FEATURES:[custom_workflows,multi_language]
ACTION:ADD`;

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
        response: `Absolutely! Sales is where AI agents really prove their worth. Your sales machine will:

• Find and qualify prospects automatically
• Score leads by conversion probability
• Track deals through your pipeline
• Run automated outreach campaigns
• Monitor deal health and momentum
• Sync with your CRM seamlessly
• Book meetings without the hassle
• Generate proposals instantly
• Track all performance metrics

What's your typical sales cycle length?`,
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
      response: `Let's build something amazing together! I have 539+ skills to work with.

Tell me:
• What industry are you in?
• What's your biggest challenge right now?
• What tasks eat up most of your time?

I'll create the perfect AI agent configuration for your specific needs.`,
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