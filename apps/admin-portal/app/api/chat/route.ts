import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChatConfig, getSiteConfig } from './config';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history (in production, use a database)
const conversations = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, sessionId, context, chatHistory } = await request.json();
    
    // Validate API key (simple validation for now)
    if (!apiKey || !apiKey.startsWith('ik_')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Get site configuration
    const siteConfig = getSiteConfig(apiKey);
    const chatConfig = getChatConfig(apiKey);
    
    // If site is configured for n8n and has been indexed, use n8n
    if (siteConfig?.useN8n && siteConfig.indexed && chatConfig.n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(chatConfig.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            site_key: apiKey,
            session_id: sessionId,
            chat_history: chatHistory || '',
            context: { domain: siteConfig.domain, source: 'api' }
          })
        });
        
        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          return NextResponse.json({
            response: n8nData.output || n8nData.response,
            sessionId: n8nData.session_id || sessionId,
            timestamp: new Date().toISOString(),
            mode: 'n8n',
            metadata: n8nData.metadata
          });
        }
      } catch (n8nError) {
        console.error('n8n error, falling back to OpenAI:', n8nError);
        // Continue to OpenAI fallback
      }
    }
    
    // Get or create conversation history
    const conversationId = sessionId || generateSessionId();
    const history = conversations.get(conversationId) || [];
    
    // Add user message to history
    history.push({ role: 'user', content: message });
    
    try {
      // Create chat completion with OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer support assistant for Intelagent. 
            Be friendly, professional, and concise. 
            Help users with questions about our products: AI Chatbot, Sales Agent, and Setup Agent.
            Our chatbot costs £0.002 per message, Sales Agent is £49/user/month, and Setup Agent is £199 one-time.
            ${context ? `Additional context: ${context}` : ''}`
          },
          ...history.slice(-10) // Keep last 10 messages for context
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      
      const assistantMessage = completion.choices[0].message.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });
      
      // Store updated conversation (limit to 20 messages)
      conversations.set(conversationId, history.slice(-20));
      
      // Clean up old conversations (simple memory management)
      if (conversations.size > 100) {
        const firstKey = conversations.keys().next().value;
        if (firstKey) {
          conversations.delete(firstKey);
        }
      }
      
      return NextResponse.json({
        response: assistantMessage,
        sessionId: conversationId,
        timestamp: new Date().toISOString(),
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        }
      });
      
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback response if OpenAI fails
      return NextResponse.json({
        response: "I'm experiencing some technical difficulties. Please try again in a moment or contact support@intelagent.ai for assistance.",
        sessionId: conversationId,
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable'
      });
    }
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// CORS headers for cross-origin requests from websites
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}