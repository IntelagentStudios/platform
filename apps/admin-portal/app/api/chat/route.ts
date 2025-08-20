import { NextRequest, NextResponse } from 'next/server';

// This is a basic chatbot API endpoint
// You'll need to integrate with your actual AI service (OpenAI, etc.)
export async function POST(request: NextRequest) {
  try {
    const { message, apiKey, sessionId } = await request.json();
    
    // Validate API key
    if (!apiKey || !apiKey.startsWith('ik_')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // TODO: Validate API key against database
    // const isValid = await validateApiKey(apiKey);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // For now, return a simple response
    // In production, you would:
    // 1. Process the message with your AI model
    // 2. Store the conversation in your database
    // 3. Track usage for billing
    
    const response = generateResponse(message);
    
    return NextResponse.json({
      response,
      sessionId: sessionId || generateSessionId(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Simple response generator - replace with actual AI integration
function generateResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! Welcome to our support. How can I help you today?";
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return "Our pricing starts at £0.002 per message for the chatbot. Would you like more details about our pricing plans?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to help! You can ask me about our products, pricing, or any technical questions you might have.";
  }
  
  return "Thank you for your message. Our team will get back to you shortly. Is there anything specific I can help you with right now?";
}

function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// CORS headers for cross-origin requests
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