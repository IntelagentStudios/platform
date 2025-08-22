import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { getChatbotResponse, searchKnowledgeBase } from '@intelagent/vector-store';
import { websiteIndexer } from '@/services/enrichment/src/modules/websiteIndexer';
import crypto from 'crypto';

// Generate session ID
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle chatbot messages
export async function POST(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    const body = await request.json();
    const { message, sessionId = generateSessionId(), chatHistory = [] } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Validate site key
    const productSetup = await prisma.product_setups.findUnique({
      where: { site_key: siteKey },
      select: {
        domain: true,
        is_active: true,
        indexing_completed: true,
        setup_data: true
      }
    });
    
    if (!productSetup) {
      return NextResponse.json(
        { error: 'Invalid site key' },
        { status: 401 }
      );
    }
    
    if (!productSetup.is_active) {
      return NextResponse.json(
        { error: 'Chatbot is not active' },
        { status: 403 }
      );
    }
    
    // Log the conversation
    const conversationId = crypto.randomBytes(16).toString('hex');
    await prisma.chatbot_logs.create({
      data: {
        id: conversationId,
        site_key: siteKey,
        session_id: sessionId,
        customer_message: message,
        created_at: new Date()
      }
    });
    
    let response: string;
    let metadata: any = {};
    
    try {
      if (productSetup.indexing_completed) {
        // Use Pinecone vector search for response
        response = await getChatbotResponse(message, siteKey);
        
        // Also get search results for transparency
        const searchResults = await searchKnowledgeBase(message, siteKey);
        metadata = {
          sources: searchResults.slice(0, 3).map(r => ({
            url: r.metadata?.url,
            title: r.metadata?.title,
            relevance: Math.round(r.score * 100)
          })),
          method: 'vector_search'
        };
      } else {
        // Fallback response if not indexed
        response = await generateFallbackResponse(message, productSetup.domain);
        metadata = {
          method: 'fallback',
          indexingRequired: true
        };
      }
    } catch (error) {
      console.error('Error generating response:', error);
      response = "I'm having trouble accessing my knowledge base right now. Please try again in a moment or contact support.";
      metadata = {
        method: 'error_fallback',
        error: true
      };
    }
    
    // Update conversation log with response
    await prisma.chatbot_logs.update({
      where: { id: conversationId },
      data: {
        chatbot_response: response,
        intent_detected: detectIntent(message),
        metadata,
        responded_at: new Date()
      }
    });
    
    // Track usage
    await trackUsage(siteKey);
    
    return NextResponse.json({
      response,
      sessionId,
      timestamp: new Date().toISOString(),
      metadata
    });
    
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Start or check indexing status
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    const body = await request.json();
    const { action = 'status' } = body;
    
    // Validate site key
    const productSetup = await prisma.product_setups.findUnique({
      where: { site_key: siteKey },
      select: {
        domain: true,
        user_id: true,
        indexing_completed: true
      }
    });
    
    if (!productSetup) {
      return NextResponse.json(
        { error: 'Invalid site key' },
        { status: 401 }
      );
    }
    
    switch (action) {
      case 'index':
        // Start indexing
        if (productSetup.indexing_completed) {
          return NextResponse.json({
            status: 'already_indexed',
            message: 'Website is already indexed. Use action "reindex" to update.'
          });
        }
        
        const indexResult = await websiteIndexer.startIndexing(
          siteKey,
          productSetup.domain
        );
        
        return NextResponse.json(indexResult);
        
      case 'reindex':
        // Re-index website
        const reindexResult = await websiteIndexer.reindex(siteKey);
        return NextResponse.json(reindexResult);
        
      case 'status':
        // Get indexing status
        const status = await websiteIndexer.getStatus(siteKey);
        return NextResponse.json(status);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Indexing API error:', error);
    return NextResponse.json(
      { error: 'Failed to process indexing request' },
      { status: 500 }
    );
  }
}

// Get chatbot configuration and status
export async function GET(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    
    // Get product setup
    const productSetup = await prisma.product_setups.findUnique({
      where: { site_key: siteKey },
      select: {
        domain: true,
        is_active: true,
        indexing_completed: true,
        indexing_completed_at: true,
        setup_data: true,
        created_at: true
      }
    });
    
    if (!productSetup) {
      return NextResponse.json(
        { error: 'Invalid site key' },
        { status: 404 }
      );
    }
    
    // Get indexing status if needed
    let indexingStatus = null;
    if (!productSetup.indexing_completed) {
      indexingStatus = await websiteIndexer.getStatus(siteKey);
    }
    
    // Get usage statistics
    const usage = await prisma.chatbot_logs.groupBy({
      by: ['intent_detected'],
      where: {
        site_key: siteKey,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: true
    });
    
    return NextResponse.json({
      domain: productSetup.domain,
      active: productSetup.is_active,
      indexed: productSetup.indexing_completed,
      indexedAt: productSetup.indexing_completed_at,
      indexingStatus,
      configuration: productSetup.setup_data || {},
      usage: {
        totalConversations: usage.reduce((sum, u) => sum + u._count, 0),
        topIntents: usage.sort((a, b) => b._count - a._count).slice(0, 5)
      },
      createdAt: productSetup.created_at
    });
    
  } catch (error) {
    console.error('Get chatbot config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// Helper function to generate fallback response
async function generateFallbackResponse(message: string, domain: string): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // Simple intent-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! Welcome to ${domain}. I'm currently learning about this website. How can I help you today?`;
  }
  
  if (lowerMessage.includes('help')) {
    return `I'm here to help! I'm still learning about ${domain}, but I can try to answer your questions. What would you like to know?`;
  }
  
  if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone')) {
    return `For contact information, please visit the contact page on ${domain} or look for contact details in the website footer.`;
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
    return `For pricing information, please check the pricing page on ${domain} or contact the sales team directly.`;
  }
  
  return `I'm still learning about ${domain}. While I don't have specific information about your question yet, please feel free to explore the website or contact support for immediate assistance.`;
}

// Helper function to detect intent
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'greeting';
  }
  
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('thanks')) {
    return 'farewell';
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
    return 'help';
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
    return 'pricing';
  }
  
  if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone')) {
    return 'contact';
  }
  
  if (lowerMessage.includes('product') || lowerMessage.includes('service') || lowerMessage.includes('feature')) {
    return 'product_info';
  }
  
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
    return 'question';
  }
  
  return 'general';
}

// Helper function to track usage
async function trackUsage(siteKey: string): Promise<void> {
  try {
    // Get the license key from product setup
    const setup = await prisma.product_setups.findUnique({
      where: { site_key: siteKey },
      select: { user_id: true }
    });
    
    if (!setup) return;
    
    const user = await prisma.users.findUnique({
      where: { id: setup.user_id },
      select: { license_key: true }
    });
    
    if (!user) return;
    
    // Update usage metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.usage_metrics.upsert({
      where: {
        license_key_product_period_start: {
          license_key: user.license_key,
          product: 'chatbot',
          period_start: today
        }
      },
      update: {
        messages: { increment: 1 },
        updated_at: new Date()
      },
      create: {
        license_key: user.license_key,
        product: 'chatbot',
        period_start: today,
        period_end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        messages: 1,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}

// CORS headers for widget access
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}