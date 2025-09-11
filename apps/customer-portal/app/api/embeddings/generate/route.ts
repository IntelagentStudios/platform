import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// You'll need to install: npm install @pinecone-database/pinecone openai
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Lazy initialization - only create clients when needed
let pinecone: Pinecone | null = null;
let openai: OpenAI | null = null;

function getPinecone() {
  if (!pinecone && process.env.PINECONE_API_KEY) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pinecone;
}

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Helper to chunk text intelligently
function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    // Check if APIs are configured
    const pineconeClient = getPinecone();
    const openaiClient = getOpenAI();
    
    if (!pineconeClient || !openaiClient) {
      return NextResponse.json({ 
        error: 'Vector search not configured. Pinecone and OpenAI API keys required.',
        configured: false
      }, { status: 503 });
    }
    
    const body = await request.json();
    const { licenseKey, content, knowledgeId, forceRegenerate = false } = body;
    
    if (!licenseKey || !content) {
      return NextResponse.json({ 
        error: 'License key and content required' 
      }, { status: 400 });
    }

    // Check if embeddings already exist (unless force regenerate)
    if (!forceRegenerate) {
      const existing = await prisma.knowledge_embeddings.findFirst({
        where: { 
          knowledge_id: knowledgeId,
          license_key: licenseKey 
        }
      });
      
      if (existing) {
        return NextResponse.json({
          message: 'Embeddings already exist',
          embeddingIds: existing.embedding_ids
        });
      }
    }

    // Get Pinecone index
    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'chatbot-knowledge');
    
    // Chunk the content
    const chunks = chunkText(content);
    console.log(`Processing ${chunks.length} chunks for license ${licenseKey}`);
    
    // Generate embeddings for each chunk
    const embeddingIds: string[] = [];
    const vectors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding using OpenAI
      const embedding = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small', // Cheaper and faster
        input: chunk,
      });
      
      const vectorId = `${licenseKey}_${knowledgeId}_chunk_${i}_${Date.now()}`;
      embeddingIds.push(vectorId);
      
      vectors.push({
        id: vectorId,
        values: embedding.data[0].embedding,
        metadata: {
          licenseKey,
          knowledgeId,
          chunkIndex: i,
          totalChunks: chunks.length,
          text: chunk, // Store the actual text
          contentPreview: chunk.substring(0, 200),
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Upsert to Pinecone in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
    
    // Store embedding IDs in database
    await prisma.knowledge_embeddings.create({
      data: {
        knowledge_id: knowledgeId,
        license_key: licenseKey,
        embedding_ids: embeddingIds,
        chunk_count: chunks.length,
        model_used: 'text-embedding-3-small',
        created_at: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      embeddingIds,
      chunksProcessed: chunks.length,
      message: 'Embeddings generated and stored successfully'
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json({ 
      error: 'Failed to generate embeddings',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE endpoint to remove embeddings
export async function DELETE(request: NextRequest) {
  try {
    const pineconeClient = getPinecone();
    if (!pineconeClient) {
      return NextResponse.json({ 
        error: 'Vector search not configured',
        configured: false
      }, { status: 503 });
    }
    
    const body = await request.json();
    const { licenseKey, knowledgeId } = body;
    
    // Get embedding IDs from database
    const embeddings = await prisma.knowledge_embeddings.findFirst({
      where: { 
        knowledge_id: knowledgeId,
        license_key: licenseKey 
      }
    });
    
    if (!embeddings) {
      return NextResponse.json({ 
        error: 'No embeddings found' 
      }, { status: 404 });
    }
    
    // Delete from Pinecone
    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'chatbot-knowledge');
    await index.deleteMany(embeddings.embedding_ids);
    
    // Delete from database
    await prisma.knowledge_embeddings.delete({
      where: { id: embeddings.id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Embeddings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    return NextResponse.json({ 
      error: 'Failed to delete embeddings' 
    }, { status: 500 });
  }
}