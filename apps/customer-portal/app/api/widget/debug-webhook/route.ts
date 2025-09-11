import { NextRequest, NextResponse } from 'next/server';

// This endpoint simulates what the widget sends to n8n
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log what we're receiving
    console.log('[Debug Webhook] Received:', {
      message: body.message,
      hasCustomKnowledge: !!body.customKnowledge,
      knowledgeLength: body.customKnowledge?.length || 0,
      responseStyle: body.responseStyle,
      productKey: body.productKey
    });
    
    // Forward to actual n8n webhook
    const n8nResponse = await fetch('https://n8n.intelagentstudios.com/webhook/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const n8nData = await n8nResponse.json();
    
    // Return debug info
    return NextResponse.json({
      sent: {
        message: body.message,
        hadKnowledge: !!body.customKnowledge,
        knowledgePreview: body.customKnowledge ? 
          body.customKnowledge.substring(0, 200) + '...' : 
          'No knowledge sent',
        responseStyle: body.responseStyle
      },
      received: n8nData,
      debug: {
        knowledgeLength: body.customKnowledge?.length || 0,
        n8nStatus: n8nResponse.status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Debug Webhook] Error:', error);
    return NextResponse.json({ 
      error: 'Debug webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to test if knowledge is being loaded correctly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'chat_9b3f7e8a2c5d1f0e';
  const message = searchParams.get('message') || 'Do you have any agents planned for the future?';
  
  try {
    // Import prisma
    const { prisma } = await import('@/lib/prisma');
    
    // Get knowledge files
    const knowledgeFiles = await prisma.knowledge_files.findMany({
      where: { product_key: productKey },
      select: { filename: true, content: true }
    });
    
    // Get product key info for legacy knowledge
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { license_key: true }
    });
    
    let customKnowledge = '';
    if (productKeyInfo) {
      const legacy = await prisma.custom_knowledge.findMany({
        where: { 
          license_key: productKeyInfo.license_key,
          is_active: true
        },
        select: { content: true, knowledge_type: true }
      });
      
      // Combine knowledge
      const pieces: string[] = [];
      for (const file of knowledgeFiles) {
        pieces.push(`[File: ${file.filename}]\n${file.content}`);
      }
      for (const k of legacy) {
        if (k.knowledge_type !== 'file') {
          pieces.push(`[${k.knowledge_type}]\n${k.content}`);
        }
      }
      customKnowledge = pieces.join('\n\n---\n\n');
    }
    
    // Test webhook
    const webhookData = {
      message: message,
      sessionId: 'debug_' + Date.now(),
      productKey: productKey,
      customKnowledge: customKnowledge,
      responseStyle: 'professional',
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch('https://n8n.intelagentstudios.com/webhook/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      question: message,
      knowledge: {
        files: knowledgeFiles.length,
        totalLength: customKnowledge.length,
        preview: customKnowledge.substring(0, 500) + '...',
        containsAccountingAgent: customKnowledge.includes('accounting agent')
      },
      webhookPayload: {
        ...webhookData,
        customKnowledge: customKnowledge.substring(0, 200) + '...'
      },
      n8nResponse: result
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}