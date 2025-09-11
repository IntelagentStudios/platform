import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productKey, forceRegenerate = false } = body;
    
    const key = productKey || 'chat_9b3f7e8a2c5d1f0e';
    
    // Get product key info
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: key },
      select: {
        license_key: true,
        status: true
      }
    });

    if (!productKeyInfo || productKeyInfo.status !== 'active') {
      return NextResponse.json({ 
        error: 'Invalid or inactive product key' 
      }, { status: 404 });
    }

    // Get all knowledge files for this product
    const knowledgeFiles = await prisma.knowledge_files.findMany({
      where: { 
        product_key: key
      },
      select: {
        filename: true,
        content: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Also get legacy custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        OR: [
          { product_key: key },
          { license_key: productKeyInfo.license_key }
        ],
        is_active: true
      },
      select: {
        content: true,
        knowledge_type: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    if (knowledgeFiles.length === 0 && customKnowledge.length === 0) {
      return NextResponse.json({ 
        error: 'No knowledge found',
        productKey: key 
      }, { status: 404 });
    }

    // Combine all knowledge
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

    // Call the embeddings generation endpoint
    const embeddingResponse = await fetch(`${request.nextUrl.origin}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        licenseKey: productKeyInfo.license_key,
        productKey: key,
        content: combinedKnowledge,
        knowledgeId: `knowledge_${key}`,
        forceRegenerate: forceRegenerate,
        namespace: key, // Use product key as namespace
        clearExisting: forceRegenerate // Clear old embeddings if forcing regeneration
      })
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      return NextResponse.json({ 
        error: 'Failed to generate embeddings',
        details: error
      }, { status: 500 });
    }

    const result = await embeddingResponse.json();

    // Also trigger n8n webhook to update its cache
    try {
      await fetch('https://n8n.intelagentstudios.com/webhook/update-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKey: key,
          customKnowledge: combinedKnowledge,
          action: 'regenerate',
          timestamp: new Date().toISOString()
        })
      });
    } catch (webhookError) {
      console.log('Webhook notification failed:', webhookError);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      message: 'Embeddings regenerated successfully',
      productKey: key,
      knowledgeFiles: knowledgeFiles.length,
      customKnowledgeEntries: customKnowledge.length,
      totalCharacters: combinedKnowledge.length,
      result: result,
      namespace: key,
      instructions: [
        '1. Old embeddings have been cleared from Pinecone',
        '2. New embeddings generated from your knowledge files',
        '3. The chatbot will now use your uploaded knowledge',
        '4. Test by asking questions about your uploaded content'
      ]
    });
  } catch (error) {
    console.error('Error regenerating embeddings:', error);
    return NextResponse.json({ 
      error: 'Failed to regenerate embeddings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check current embeddings status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'chat_9b3f7e8a2c5d1f0e';
  
  try {
    // Get product key info
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true
      }
    });

    if (!productKeyInfo) {
      return NextResponse.json({ 
        error: 'Product key not found' 
      }, { status: 404 });
    }

    // Get custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        OR: [
          { product_key: productKey },
          { license_key: productKeyInfo.license_key }
        ],
        is_active: true
      },
      select: {
        id: true,
        content: true,
        knowledge_type: true,
        updated_at: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return NextResponse.json({
      productKey,
      namespace: productKey,
      knowledgeEntries: customKnowledge.map(k => ({
        id: k.id,
        type: k.knowledge_type,
        contentPreview: k.content.substring(0, 100) + '...',
        updatedAt: k.updated_at
      })),
      totalEntries: customKnowledge.length,
      recommendation: customKnowledge.length > 0 
        ? 'Run POST to regenerate embeddings with latest knowledge'
        : 'Add custom knowledge first before generating embeddings'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check embeddings status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}