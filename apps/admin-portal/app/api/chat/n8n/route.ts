import { NextRequest, NextResponse } from 'next/server';

// Configuration for n8n webhook
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot';
const N8N_SETUP_WEBHOOK = process.env.N8N_SETUP_WEBHOOK || 'http://localhost:5678/webhook/setup-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, siteKey, sessionId, chatHistory, mode = 'chat' } = body;
    
    // Validate site key
    if (!siteKey) {
      return NextResponse.json(
        { error: 'No site key provided' },
        { status: 401 }
      );
    }
    
    // Determine which webhook to use
    const webhookUrl = mode === 'setup' ? N8N_SETUP_WEBHOOK : N8N_WEBHOOK_URL;
    
    try {
      // Forward request to n8n webhook
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          site_key: siteKey,
          session_id: sessionId || generateSessionId(),
          chat_history: chatHistory || '',
          timestamp: new Date().toISOString(),
          // Add context for double agent system
          context: {
            domain: extractDomainFromSiteKey(siteKey),
            mode: mode,
            source: 'widget'
          }
        })
      });
      
      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook returned ${n8nResponse.status}`);
      }
      
      const n8nData = await n8nResponse.json();
      
      // Format response for widget
      return NextResponse.json({
        response: n8nData.output || n8nData.response || n8nData.message,
        sessionId: n8nData.session_id || sessionId,
        timestamp: new Date().toISOString(),
        // Include any additional data from n8n
        metadata: {
          agent: n8nData.agent_used || 'double-agent',
          search_path: n8nData.search_path,
          intent: n8nData.intent,
          sources: n8nData.sources || []
        }
      });
      
    } catch (n8nError: any) {
      console.error('n8n webhook error:', n8nError);
      
      // Fallback to a simple response if n8n is unavailable
      return NextResponse.json({
        response: "I'm currently updating my knowledge base. Please try again in a moment or contact support@intelagent.ai for immediate assistance.",
        sessionId: sessionId || generateSessionId(),
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable',
        fallback: true
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

// Handle setup agent requests
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, siteKey, action = 'index' } = body;
    
    if (!siteKey || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Forward to n8n setup webhook
    const setupResponse = await fetch(N8N_SETUP_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: action,
        website_url: url,
        site_key: siteKey,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!setupResponse.ok) {
      throw new Error(`Setup webhook returned ${setupResponse.status}`);
    }
    
    const setupData = await setupResponse.json();
    
    return NextResponse.json({
      success: true,
      message: setupData.message || 'Website indexed successfully',
      pages_indexed: setupData.pages_indexed || 0,
      vectors_created: setupData.vectors_created || 0,
      sessionId: generateSessionId()
    });
    
  } catch (error) {
    console.error('Setup API error:', error);
    return NextResponse.json(
      { error: 'Failed to process setup request' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function extractDomainFromSiteKey(siteKey: string): string {
  // Extract domain from site key if it contains it
  // Format might be: ik_domain.com_xxxxx or just ik_xxxxx
  const parts = siteKey.split('_');
  if (parts.length >= 2 && parts[1].includes('.')) {
    return parts[1];
  }
  return 'unknown';
}

// CORS headers for cross-origin requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}