import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgent } from '@intelagent/skills-orchestrator';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma with error handling
let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Failed to initialize Prisma:', error);
  prisma = null as any;
}

// CORS headers for the chatbot widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      message,
      sessionId,
      productKey,
      chatHistory = []
    } = body;

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get product key details and custom knowledge (if database is available)
    let productKeyData = null;
    let customKnowledge = null;
    
    if (prisma && productKey) {
      try {
        // Look up product key
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
          productKeyData = {
            product_key: productKey,
            license_key: productKeyRecord.license_key,
            domain: productKeyRecord.metadata?.domain || 
                   productKeyRecord.licenses?.domain || 
                   'intelagentstudios.com',
            customer_name: productKeyRecord.licenses?.customer_name
          };
        }

        // Get custom knowledge for this product key
        const knowledge = await prisma.chatbot_knowledge.findMany({
          where: { product_key: productKey }
        });
        
        if (knowledge.length > 0) {
          customKnowledge = knowledge.map(k => k.content).join('\n');
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Continue without database data
      }
    }

    const domain = productKeyData?.domain || 'intelagentstudios.com';

    // Get orchestrator instance
    const orchestrator = OrchestratorAgent.getInstance();

    // Execute the chatbot workflow using skills
    const result = await orchestrator.execute({
      workflow: 'chatbot_conversation',
      params: {
        // Input validation params
        customer_message: message,
        session_id: sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        product_key: productKey,
        chat_history: formatChatHistory(chatHistory),
        
        // Domain and knowledge params
        domain: domain,
        custom_knowledge: customKnowledge,
        license_key: productKeyData?.license_key,
        customer_name: productKeyData?.customer_name,
        
        // Workflow configuration
        timestamp: new Date().toISOString()
      },
      skills: [
        'search_strategy',     // Agent 1: Determines what to search
        'web_scraper',        // Fetches website content
        'response_creator'    // Agent 2: Creates the response
      ],
      config: {
        maxRetries: 1,
        timeout: 15000,
        sequential: true  // Run skills in sequence like the n8n workflow
      }
    });

    // Extract the final response
    const chatbotResponse = result.results?.find(r => r.skillId === 'response_creator')?.data?.message ||
                          result.results?.find(r => r.data?.chatbot_response)?.data?.chatbot_response ||
                          'I apologize, but I encountered an error processing your request.';

    // Log conversation to database if available
    if (prisma) {
      try {
        await prisma.chatbot_logs.create({
          data: {
            session_id: sessionId,
            customer_message: message,
            chatbot_response: chatbotResponse,
            timestamp: new Date(),
            intent_detected: result.results?.find(r => r.skillId === 'search_strategy')?.data?.search_plan?.intent || 'unknown',
            conversation_id: sessionId,
            product_key: productKey,
            domain: domain,
            user_id: 'anonymous'
          }
        });
      } catch (logError) {
        console.error('Failed to log conversation:', logError);
        // Continue without logging
      }
    }

    // Return response in the format the widget expects
    return NextResponse.json(
      {
        message: chatbotResponse,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        metadata: {
          skills_used: result.skillsExecuted || [],
          intent: result.results?.find(r => r.skillId === 'search_strategy')?.data?.search_plan?.intent,
          execution_time: result.executionTime,
          powered_by: 'skills_system'
        }
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Chatbot skills API error:', error);
    
    // Return a user-friendly error message
    return NextResponse.json(
      {
        message: 'I apologize, but I\'m having trouble connecting. Please try again in a moment.',
        error: error.message,
        timestamp: new Date().toISOString(),
        powered_by: 'skills_system'
      },
      { status: 200, headers: corsHeaders }  // Return 200 to prevent widget errors
    );
  }
}

// Helper function to format chat history
function formatChatHistory(history: any[]): string {
  if (!history || history.length === 0) {
    return '';
  }

  return history
    .slice(-10)  // Last 10 messages for context
    .map(msg => {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
      const content = msg.content || msg.message || '';
      return `${role}: ${content}`;
    })
    .join('\n');
}