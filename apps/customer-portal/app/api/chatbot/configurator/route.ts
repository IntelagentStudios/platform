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
      messageLength: body.message?.length,
      hasMessage: !!body.message
    });

    // Extract context from message
    let userMessage = body.message || '';
    let context = {};

    const contextMatch = userMessage.match(/\[CONTEXT: Agent Builder - (.*?)\]$/);
    if (contextMatch) {
      try {
        context = JSON.parse(contextMatch[1]);
        userMessage = userMessage.replace(contextMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse context:', e);
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
        const data = await n8nResponse.json();
        if (data && data.response) {
          return NextResponse.json(data);
        }
      }
    } catch (n8nError) {
      console.log('n8n webhook failed, falling back to Groq directly:', n8nError);
    }

    // Fallback to Groq for intelligent configuration
    if (!groq) {
      // If no Groq key, return a helpful response
      return NextResponse.json({
        response: `I'm your AI Configuration Expert with access to 539+ skills.

Based on your needs, I recommend starting with these popular packages:

**Sales Package** (£366.50/month):
• lead_generation, lead_scoring, pipeline_management
• 15 skills total with 10% volume discount

**E-commerce Package** (£419/month):
• inventory_manager, order_processor, payment_processing
• 20 skills total with 20% volume discount

**Support Package** (£384.50/month):
• ticket_management, knowledge_base, chat_support
• 12 skills total with 10% volume discount

Tell me more about your specific needs and I'll customize the perfect configuration!`,
        recommendations: {}
      });
    }

    const systemPrompt = `You are the Intelagent AI Configuration Expert. You help users build custom AI agents from a catalog of 539+ skills.

PRICING STRUCTURE:
- Base Platform: £299/month
- Each skill: £5
- Volume discounts:
  - 10-19 skills: 10% off (£4.50 each)
  - 20-29 skills: 20% off (£4.00 each)
  - 30+ skills: 30% off (£3.50 each)

TOP SKILLS BY CATEGORY:
- Sales: lead_generation, lead_scoring, pipeline_management, deal_tracking, email_campaigns
- E-commerce: inventory_manager, order_processor, payment_processing, shipping_tracker
- Support: ticket_management, knowledge_base, chat_support, faq_automation
- Marketing: email_campaigns, social_scheduler, content_generator, seo_optimizer
- Finance: invoice_generator, payment_processor, expense_tracker, financial_reports
- Analytics: data_visualization, report_generator, trend_analysis, predictive_analytics
- Communication: email_sender, sms_notifications, slack_integration, teams_connector

When users describe their needs:
1. Recommend specific skills that match their requirements
2. Calculate total pricing with appropriate volume discounts
3. Suggest complementary skills that work well together
4. Provide clear pricing breakdowns

Current context:
${JSON.stringify(context, null, 2)}

Be concise, helpful, and focus on building the best configuration for their needs.`;

    // Use Groq's Llama model for fast, intelligent responses
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192', // Fast and powerful model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I can help you build the perfect AI agent. What specific business needs do you have?';

    // Parse AI response for skill recommendations
    const skillPattern = /\b(lead_generation|lead_scoring|pipeline_management|deal_tracking|email_campaigns|inventory_manager|order_processor|payment_processing|ticket_management|knowledge_base|chat_support|email_sender|sms_notifications|content_generator|seo_optimizer|invoice_generator|payment_processor|expense_tracker)\b/gi;
    const recommendedSkills: string[] = [];
    const matches = aiResponse.match(skillPattern);
    if (matches) {
      recommendedSkills.push(...Array.from(new Set(matches.map(s => s.toLowerCase()))));
    }

    // Calculate pricing
    let pricing = null;
    if (recommendedSkills.length > 0) {
      const skillCount = recommendedSkills.length;
      let pricePerSkill = 5;
      if (skillCount >= 30) pricePerSkill = 3.5;
      else if (skillCount >= 20) pricePerSkill = 4;
      else if (skillCount >= 10) pricePerSkill = 4.5;

      pricing = {
        base: 299,
        skills: skillCount * pricePerSkill,
        total: 299 + (skillCount * pricePerSkill),
        discount: skillCount >= 10 ? `${((5 - pricePerSkill) / 5 * 100).toFixed(0)}%` : null
      };
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

    // Simple fallback response
    return NextResponse.json({
      response: `I'm your AI Configuration Expert with access to 539+ skills across all categories.

Tell me about your business needs and I'll help you build the perfect AI agent with:
• Optimal skill selection from our catalog
• Smart integration recommendations
• Volume discount optimization (up to 30% off)
• Industry-specific feature suggestions

What kind of AI agent would you like to build today?`,
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