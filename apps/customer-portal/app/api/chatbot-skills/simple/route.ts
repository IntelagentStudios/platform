import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

// Company knowledge base (mimicking n8n workflow)
const COMPANY_INFO = {
  name: "Intelagent Studios",
  description: "We specialize in developing intelligent business solutions using AI. Our modular tools adapt to your workflows, helping you streamline processes and make data-driven decisions.",
  services: [
    "AI Chatbots for customer support",
    "Business automation tools",
    "Data analytics and insights",
    "Custom AI integrations",
    "Workflow optimization",
    "Sales automation",
    "Marketing automation"
  ],
  products: [
    "AI Chatbot - Intelligent customer support",
    "Sales Agent - Automated sales assistant",
    "Data Enrichment - Enhance your data",
    "Setup Agent - Configuration wizard",
    "Skills Platform - 310+ automation skills"
  ],
  benefits: [
    "24/7 automated customer support",
    "Reduced operational costs",
    "Increased efficiency",
    "Data-driven insights",
    "Scalable solutions"
  ]
};

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

    // Simple intent detection
    const lowerMessage = message.toLowerCase();
    let response = "";

    // Check for specific intents
    if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('do')) {
      response = `${COMPANY_INFO.name} ${COMPANY_INFO.description}\n\nOur services include:\n${COMPANY_INFO.services.map(s => `• ${s}`).join('\n')}\n\nHow can we help you leverage AI in your business?`;
    } 
    else if (lowerMessage.includes('product')) {
      response = `We offer several AI-powered products:\n\n${COMPANY_INFO.products.map(p => `• ${p}`).join('\n')}\n\nWhich product interests you the most?`;
    }
    else if (lowerMessage.includes('benefit') || lowerMessage.includes('why')) {
      response = `Here are the key benefits of using our AI solutions:\n\n${COMPANY_INFO.benefits.map(b => `• ${b}`).join('\n')}\n\nWould you like to learn more about any specific benefit?`;
    }
    else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      response = "Our pricing is flexible and based on your specific needs. We offer both subscription and one-time license options. Would you like to schedule a consultation to discuss pricing for your requirements?";
    }
    else if (lowerMessage.includes('contact') || lowerMessage.includes('speak') || lowerMessage.includes('human')) {
      response = "You can reach our team at support@intelagentstudios.com or schedule a demo through our website. How else can I assist you today?";
    }
    else if (lowerMessage.includes('ai') && (lowerMessage.includes('automation') || lowerMessage.includes('automate'))) {
      response = "AI automation can transform your business by handling repetitive tasks, providing instant customer support, analyzing data patterns, and making intelligent decisions. Our platform offers 310+ skills that can be combined to create powerful automation workflows. What specific processes are you looking to automate?";
    }
    else if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
      response = "Our AI solutions work by:\n\n1. **Integration** - Connect with your existing systems\n2. **Learning** - Understand your business context and requirements\n3. **Automation** - Execute tasks based on intelligent decision-making\n4. **Optimization** - Continuously improve based on results\n\nWould you like a demo to see it in action?";
    }
    else if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
      response = "Yes! We offer a free trial so you can experience our AI solutions firsthand. You can start with our chatbot on your website immediately. Would you like me to help you get started?";
    }
    else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = "Hello! I'm the AI assistant for Intelagent Studios. I can help you learn about our AI solutions, answer questions about our products, or assist with getting started. What would you like to know?";
    }
    else {
      // Default response for unmatched intents
      response = `I understand you're asking about "${message}". ${COMPANY_INFO.description} \n\nI can help you with:\n• Learning about our AI services\n• Understanding our products\n• Discussing automation needs\n• Getting started with a free trial\n\nWhat specific information would you like?`;
    }

    // Log conversation if database available
    try {
      await prisma.chatbot_logs.create({
        data: {
          session_id: sessionId || 'anonymous',
          customer_message: message,
          chatbot_response: response,
          timestamp: new Date(),
          intent_detected: 'general',
          conversation_id: sessionId || 'anonymous',
          product_key: productKey,
          domain: 'intelagentstudios.com',
          user_id: 'anonymous'
        }
      });
    } catch (error) {
      console.log('Could not log conversation:', error);
    }

    // Return response
    return NextResponse.json(
      { 
        response,
        sessionId,
        timestamp: new Date().toISOString()
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Simple chatbot error:', error);
    return NextResponse.json(
      { 
        response: "I apologize, but I'm having technical difficulties. Please try again in a moment.",
        error: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}