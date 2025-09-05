import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { N8NChatbotSkill } from '@intelagent/skills-orchestrator/src/skills/impl/N8NChatbotSkill';

// Initialize Prisma
const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Modular Chatbot Endpoint
 * Can use n8n workflow or other skills based on configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, productKey, chatHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get configuration from product key
    let domain = 'intelagentstudios.com';
    let companyName = 'Intelagent Studios';
    let customKnowledge = null;
    let chatbotMode = 'n8n'; // Default to n8n for proven efficacy
    let webhookUrl = null;
    
    if (productKey) {
      try {
        const productKeyRecord = await prisma.product_keys.findFirst({
          where: {
            product_key: productKey,
            product: 'chatbot',
            status: 'active'
          },
          include: {
            licenses: true
          }
        });

        if (productKeyRecord) {
          const metadata = productKeyRecord.metadata as any;
          domain = metadata?.domain || productKeyRecord.licenses?.domain || domain;
          companyName = metadata?.company_name || productKeyRecord.licenses?.customer_name || companyName;
          customKnowledge = metadata?.custom_knowledge || null;
          chatbotMode = metadata?.chatbot_mode || 'n8n';
          webhookUrl = metadata?.webhook_url || null;
        }
      } catch (error) {
        console.log('Could not fetch product key:', error);
      }
    }

    let response = '';
    let intent = 'general';
    let confidence = 0.8;

    // Route to appropriate chatbot implementation
    console.log('Chatbot mode:', chatbotMode);
    console.log('Webhook URL from metadata:', webhookUrl);
    
    if (chatbotMode === 'n8n') {
      // Use the proven n8n workflow
      console.log('Using N8NChatbotSkill with message:', message);
      const n8nSkill = new N8NChatbotSkill();
      
      const result = await n8nSkill.execute({
        message,
        sessionId,
        productKey,
        domain,
        chatHistory,
        customKnowledge,
        webhookUrl
      });
      
      console.log('N8N Skill result:', result);

      if (result.success) {
        response = result.data.response;
        intent = result.data.intent || 'general';
        confidence = result.data.confidence || 0.8;
      } else {
        // If n8n fails, provide a helpful fallback response
        console.error('N8N chatbot failed, using fallback response');
        
        // Simple but helpful fallback responses based on common intents
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('product') || lowerMessage.includes('service') || lowerMessage.includes('offer')) {
          response = `We offer innovative AI-powered solutions including chatbots, data enrichment, and sales automation tools. Visit ${domain || 'our website'} to learn more about our products, or feel free to ask specific questions!`;
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
          response = `I'd be happy to help! You can reach our support team at support@${domain || 'intelagentstudios.com'} or visit our help center. What specific issue can I assist you with?`;
        } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
          response = `For pricing information, please visit ${domain || 'our website'}/pricing or contact our sales team. We offer flexible plans tailored to your needs.`;
        } else if (lowerMessage.includes('contact')) {
          response = `You can reach us at info@${domain || 'intelagentstudios.com'} or through the contact form on our website. We typically respond within 24 hours.`;
        } else {
          response = `Thank you for your message. For the best experience, please visit ${domain || 'our website'} or contact us at info@${domain || 'intelagentstudios.com'}. How else can I help you today?`;
        }
        
        intent = 'fallback';
        confidence = 0.5;
      }
      
    } else if (chatbotMode === 'intelligent') {
      // Use the intelligent scraper implementation
      const intelligentResponse = await fetch(`${request.nextUrl.origin}/api/chatbot-skills/intelligent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, productKey, chatHistory })
      });
      
      const data = await intelligentResponse.json();
      response = data.response;
      
    } else if (chatbotMode === 'custom' && webhookUrl) {
      // Use a custom webhook
      try {
        const customResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message, 
            sessionId, 
            productKey, 
            domain,
            companyName,
            chatHistory 
          }),
          signal: AbortSignal.timeout(8000)
        });
        
        const data = await customResponse.json();
        response = data.response || data.message || 'I can help you with that. Please visit our website for more information.';
      } catch (error) {
        console.error('Custom webhook error:', error);
        response = 'I can help you with that. Please visit our website for more information.';
      }
      
    } else {
      // Default simple response
      response = `Thank you for your message. Please visit https://${domain} for more information. How else can I help you?`;
    }

    // Log conversation
    try {
      await prisma.chatbot_logs.create({
        data: {
          session_id: sessionId || 'anonymous',
          customer_message: message,
          chatbot_response: response,
          timestamp: new Date(),
          intent_detected: intent,
          conversation_id: sessionId || 'anonymous',
          product_key: productKey,
          domain: domain,
          user_id: 'anonymous'
        }
      });
    } catch (error) {
      console.log('Could not log conversation:', error);
    }

    return NextResponse.json(
      { 
        response,
        sessionId,
        timestamp: new Date().toISOString(),
        mode: chatbotMode,
        confidence
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Modular chatbot error:', error);
    return NextResponse.json(
      { 
        response: "I'm experiencing technical difficulties. Please try again in a moment or contact support directly.",
        error: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}