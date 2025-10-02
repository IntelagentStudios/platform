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
    let context = {};

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
          response: `Brilliant! For the **Ultimate Marketing AI Agent**, here's your powerhouse configuration:

**Core Marketing Arsenal**:
• **content_generator** - AI-powered content creation for blogs, ads, social
• **social_scheduler** - Multi-platform posting automation
• **email_campaigns** - Personalized email marketing at scale
• **seo_optimizer** - Search engine optimization recommendations
• **analytics_dashboard** - Real-time campaign performance tracking

**Advanced Marketing Tools**:
• **competitor_analysis** - Monitor competitor strategies
• **influencer_finder** - Identify partnership opportunities
• **ad_optimizer** - PPC and social ad optimization
• **brand_monitoring** - Track brand mentions across the web
• **video_generator** - Automated video content creation
• **landing_page_builder** - A/B tested page creation

**Construction Industry Specialization**:
• **project_showcase** - Before/after portfolio automation
• **local_seo** - Dominate local search results
• **review_manager** - Automated review collection
• **referral_tracker** - Partner and referral management

**Ultimate Package Options**:
- Professional (20 skills): £379/month with 20% discount
- Enterprise (30 skills): £403.50/month with 30% discount
- Ultimate (40+ skills): £439/month with 30% discount

For construction, I especially recommend the project showcase and local SEO skills. What's your primary marketing goal?`,
          recommendations: {
            skills: ['content_generator', 'social_scheduler', 'email_campaigns', 'seo_optimizer', 'analytics_dashboard'],
            pricing: { base: 299, skills: 80, total: 379, discount: '20%' }
          }
        });
      }

      if (lowerMessage.includes('sales') || lowerMessage.includes('lead') || lowerMessage.includes('crm')) {
        return NextResponse.json({
          response: `Excellent choice! For a **Sales AI Agent**, I recommend our proven configuration:

**Core Sales Skills** (Must-have):
• **lead_generation** - Identify and qualify prospects automatically
• **lead_scoring** - AI-powered lead prioritization
• **pipeline_management** - Track deals through your sales funnel
• **email_campaigns** - Personalized outreach at scale
• **deal_tracking** - Monitor deal health and momentum

**Power-Up Skills** (Recommended):
• **crm_integration** - Seamless Salesforce/HubSpot sync
• **calendar_scheduling** - Automated meeting booking
• **proposal_generator** - Dynamic proposal creation
• **competitor_analysis** - Real-time market intelligence
• **sales_forecasting** - Predictive revenue modeling

**Package Pricing**:
- 10 skills: £345/month (£299 base + £46 for skills with 10% off)
- 15 skills: £366.50/month (£299 base + £67.50 for skills with 10% off)
- 20 skills: £379/month (£299 base + £80 for skills with 20% off)

Which skills interest you most? I can customize this further based on your sales process.`,
          recommendations: {
            skills: ['lead_generation', 'lead_scoring', 'pipeline_management', 'email_campaigns', 'deal_tracking'],
            pricing: { base: 299, skills: 67.5, total: 366.5, discount: '10%' }
          }
        });
      }

      if (lowerMessage.includes('ecommerce') || lowerMessage.includes('e-commerce') || lowerMessage.includes('shop') || lowerMessage.includes('store')) {
        return NextResponse.json({
          response: `Perfect! For an **E-commerce AI Agent**, here's the optimal setup:

**Essential E-commerce Skills**:
• **inventory_manager** - Real-time stock tracking and alerts
• **order_processor** - Automated order fulfillment
• **payment_processing** - Secure payment handling
• **shipping_tracker** - Live delivery updates
• **customer_notifications** - Order status communications

**Growth Accelerators**:
• **product_recommendations** - AI-powered upselling
• **price_optimizer** - Dynamic pricing strategy
• **review_manager** - Automated review collection
• **abandoned_cart** - Recovery campaigns
• **fraud_detection** - Protect against fraudulent orders

**Pricing Options**:
- Starter (10 skills): £345/month with 10% discount
- Growth (20 skills): £379/month with 20% discount
- Enterprise (30+ skills): £403.50/month with 30% discount

What's your monthly order volume? I can fine-tune this configuration.`,
          recommendations: {
            skills: ['inventory_manager', 'order_processor', 'payment_processing', 'shipping_tracker', 'customer_notifications'],
            pricing: { base: 299, skills: 80, total: 379, discount: '20%' }
          }
        });
      }

      if (lowerMessage.includes('construction') || lowerMessage.includes('build') || lowerMessage.includes('contractor')) {
        return NextResponse.json({
          response: `Perfect! For a **Construction Company AI Agent**, I'll configure a specialized solution:

**Construction Core Operations**:
• **project_manager** - Track multiple job sites and timelines
• **bid_calculator** - Automated cost estimation and proposals
• **permit_tracker** - Monitor permit applications and approvals
• **safety_compliance** - OSHA compliance and safety documentation
• **inventory_tracker** - Materials and equipment management

**Client & Sales Management**:
• **lead_generation** - Find new construction opportunities
• **quote_generator** - Professional estimates in minutes
• **client_portal** - Project updates for clients
• **invoice_generator** - Progress billing automation
• **review_manager** - Collect testimonials automatically

**Field Operations**:
• **scheduling_optimizer** - Crew and subcontractor scheduling
• **weather_monitor** - Job site weather alerts
• **photo_documenter** - Progress photo organization
• **quality_checklist** - Inspection automation
• **warranty_tracker** - Post-completion support

**Recommended Packages**:
- Residential (15 skills): £366.50/month with 10% off
- Commercial (25 skills): £399/month with 20% off
- Enterprise (35+ skills): £421.50/month with 30% off

What type of construction do you focus on? Residential, commercial, or both?`,
          recommendations: {
            skills: ['project_manager', 'bid_calculator', 'permit_tracker', 'safety_compliance', 'lead_generation'],
            pricing: { base: 299, skills: 100, total: 399, discount: '20%' }
          }
        });
      }

      if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('ticket')) {
        return NextResponse.json({
          response: `Great! For a **Customer Support AI Agent**, I recommend:

**Core Support Skills**:
• **ticket_management** - Intelligent ticket routing and prioritization
• **knowledge_base** - Self-service article suggestions
• **chat_support** - 24/7 automated responses
• **faq_automation** - Common question handling
• **escalation_manager** - Smart escalation to human agents

**Enhanced Capabilities**:
• **sentiment_analysis** - Detect customer emotions
• **language_translator** - Multi-language support
• **screen_recording** - Bug report capturing
• **sla_tracker** - Response time monitoring
• **customer_satisfaction** - CSAT survey automation

**Investment Levels**:
- Basic (8 skills): £339/month
- Professional (12 skills): £353/month with 10% off
- Advanced (18 skills): £372/month with 20% off

How many support tickets do you handle monthly?`,
          recommendations: {
            skills: ['ticket_management', 'knowledge_base', 'chat_support', 'faq_automation', 'escalation_manager'],
            pricing: { base: 299, skills: 54, total: 353, discount: '10%' }
          }
        });
      }

      // Default response for general queries
      return NextResponse.json({
        response: `I'm your AI Configuration Expert with access to **539+ skills** across all categories!

To build the perfect AI agent for you, tell me about your business:

**🚀 Sales & Marketing**
"I need to generate more leads" → Sales acceleration package
"I want to automate marketing" → Marketing automation suite

**🛍️ E-commerce**
"I run an online store" → E-commerce optimization kit
"I need inventory management" → Operations automation

**💬 Customer Service**
"I need 24/7 support" → Support automation package
"I want to reduce response times" → Intelligent helpdesk

**💼 Business Operations**
"I need to automate workflows" → Process automation suite
"I want better analytics" → Business intelligence package

What's your primary business challenge?`,
        recommendations: {}
      });
    }

    const systemPrompt = `You are the Intelagent AI Configuration Expert. You help users build custom AI agents from a catalog of 539+ skills.

PRICING: Base £299/month + skills (£5 each, discounts: 10+ skills 10% off, 20+ skills 20% off, 30+ skills 30% off)

TOP SKILLS:
- Sales: lead_generation, lead_scoring, pipeline_management, deal_tracking, email_campaigns
- E-commerce: inventory_manager, order_processor, payment_processing, shipping_tracker
- Support: ticket_management, knowledge_base, chat_support, faq_automation
- Marketing: email_campaigns, social_scheduler, content_generator, seo_optimizer

Current context: ${JSON.stringify(context, null, 2)}

IMPORTANT RULES:
1. Be VERY concise - 3-5 sentences max
2. List 3-5 relevant skills with one-line descriptions
3. Calculate price: £299 base + (skills × £5) for <10 skills, or with discount for 10+
4. End with a short question to guide them
5. Examples: 5 skills = £324/month, 10 skills = £344/month (10% off), 20 skills = £379/month (20% off)
6. Format: "For [need], I recommend: • skill_name - brief purpose. Total: £XXX/month. [Question]?"`;

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

    // Parse AI response for ALL skill recommendations
    // Match any word followed by " - " which is the pattern the AI uses
    const skillMatches: string[] = [];

    // First try to find skills in the format "skill_name - description"
    const bulletPattern = /•\s+(\w+(?:_\w+)*)\s+-/g;
    let match;
    while ((match = bulletPattern.exec(aiResponse)) !== null) {
      skillMatches.push(match[1].toLowerCase());
    }

    // If no matches found, fall back to looking for known skill names
    if (skillMatches.length === 0) {
      const skillPattern = /\b(lead_generation|lead_scoring|pipeline_management|deal_tracking|email_campaigns|inventory_manager|order_processor|payment_processing|ticket_management|knowledge_base|chat_support|email_sender|sms_notifications|content_generator|seo_optimizer|invoice_generator|payment_processor|expense_tracker|bookkeeping|financial_reporting|budget_planning|general_ledger|accounts_receivable|accounts_payable|payroll_processing|tax_preparation|financial_analysis|audit_management|cash_flow_management|crm_integration|calendar_scheduling|proposal_generator|analytics_dashboard|competitor_analysis|sales_forecasting|quote_generation|sales_analytics|data_visualization|report_generator|trend_analysis|predictive_analytics|slack_integration|teams_connector|customer_notifications|shipping_tracker|fraud_detection|review_manager|abandoned_cart|product_recommendations|price_optimizer)\b/gi;
      const matches = aiResponse.match(skillPattern);
      if (matches) {
        skillMatches.push(...Array.from(new Set(matches.map(s => s.toLowerCase()))));
      }
    }

    const recommendedSkills = Array.from(new Set(skillMatches));

    console.log('AI Response:', aiResponse);
    console.log('Extracted skills:', recommendedSkills);
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
      response: aiResponse,
      recommendations: {
        skills: recommendedSkills,
        pricing: pricing
      }
    });

  } catch (error: any) {
    console.error('Configurator error:', error);
    console.error('Error stack:', error.stack);

    // Check if it's a specific error we can handle
    if (error.message?.includes('sales')) {
      // User mentioned sales, provide sales-specific response
      return NextResponse.json({
        response: `Perfect! For a sales agent, I recommend our **Sales Acceleration Package**:

**Core Skills** (£299 base + skills):
• **lead_generation** - Find and qualify prospects
• **lead_scoring** - Prioritize high-value opportunities
• **pipeline_management** - Track deals through stages
• **email_campaigns** - Automated outreach sequences
• **deal_tracking** - Monitor deal progress

**Recommended Add-ons**:
• **crm_integration** - Sync with Salesforce/HubSpot
• **calendar_scheduling** - Automated meeting booking
• **proposal_generator** - Create custom proposals
• **analytics_dashboard** - Track performance metrics

**Pricing with 15 skills**: £366.50/month
(Base £299 + 15 skills @ £4.50 each with 10% discount)

Would you like me to activate these skills for your sales agent?`,
        recommendations: {
          skills: ['lead_generation', 'lead_scoring', 'pipeline_management', 'email_campaigns', 'deal_tracking'],
          pricing: { base: 299, skills: 67.5, total: 366.5, discount: '10%' }
        }
      });
    }

    // Generic fallback
    return NextResponse.json({
      response: `I can help you build a powerful AI agent! What type of business are you in?

**Popular Configurations**:
• Sales & Lead Generation
• E-commerce & Order Management
• Customer Support & Helpdesk
• Marketing Automation
• Financial Operations

Just tell me your industry or main business goal, and I'll recommend the perfect skill combination with optimal pricing.`,
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