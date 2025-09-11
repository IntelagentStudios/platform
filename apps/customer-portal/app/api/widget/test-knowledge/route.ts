import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'chat_9b3f7e8a2c5d1f0e';
  
  try {
    // Get product key info
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyInfo) {
      return NextResponse.json({ 
        error: 'Product key not found' 
      }, { status: 404 });
    }

    // Get knowledge files
    const knowledgeFiles = await prisma.knowledge_files.findMany({
      where: { 
        product_key: productKey
      },
      select: {
        id: true,
        filename: true,
        content: true,
        file_size: true,
        created_at: true
      }
    });

    // Get legacy custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        license_key: productKeyInfo.license_key,
        is_active: true
      },
      select: {
        content: true,
        knowledge_type: true
      }
    });

    // Combine for testing
    const knowledgePieces: string[] = [];
    
    // Add files
    for (const file of knowledgeFiles) {
      knowledgePieces.push(`[File: ${file.filename}]\n${file.content}`);
    }
    
    // Add legacy custom knowledge
    for (const k of customKnowledge) {
      if (k.knowledge_type !== 'file') {
        knowledgePieces.push(`[${k.knowledge_type}]\n${k.content}`);
      }
    }
    
    const combinedKnowledge = knowledgePieces.join('\n\n---\n\n');

    // Get settings
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};

    return NextResponse.json({
      productKey,
      status: productKeyInfo.status,
      settings: {
        saved: settings,
        applied: {
          themeColor: settings.themeColor || '#0070f3',
          position: settings.position || 'bottom-right',
          welcomeMessage: settings.welcomeMessage || 'Hello! How can I help you today?',
          responseStyle: settings.responseStyle || 'professional'
        }
      },
      knowledge: {
        files: knowledgeFiles.map(f => ({
          id: f.id,
          filename: f.filename,
          size: f.file_size,
          preview: f.content.substring(0, 200) + '...'
        })),
        legacy: customKnowledge.map(k => ({
          type: k.knowledge_type,
          preview: k.content.substring(0, 200) + '...'
        })),
        combined: {
          length: combinedKnowledge.length,
          preview: combinedKnowledge.substring(0, 500) + '...'
        }
      },
      webhookPayload: {
        message: "Test message",
        sessionId: "test_session",
        productKey: productKey,
        customKnowledge: combinedKnowledge,
        responseStyle: settings.responseStyle || 'professional'
      }
    });
  } catch (error) {
    console.error('Error testing knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to test knowledge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}