import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

export async function POST(request: NextRequest) {
  try {
    // Check if APIs are configured
    const pineconeClient = getPinecone();
    const openaiClient = getOpenAI();
    
    if (!pineconeClient || !openaiClient) {
      // Return empty knowledge if not configured - graceful degradation
      return NextResponse.json({ 
        success: true,
        relevantKnowledge: '',
        matchCount: 0,
        matchDetails: [],
        message: 'Vector search not configured - using fallback',
        configured: false
      });
    }
    
    const body = await request.json();
    const { query, productKey, topK = 3 } = body;
    
    if (!query || !productKey) {
      return NextResponse.json({ 
        error: 'Query and product key required' 
      }, { status: 400 });
    }
    
    // Get license key from product key
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { license_key: true }
    });
    
    if (!productKeyInfo) {
      return NextResponse.json({ 
        error: 'Invalid product key' 
      }, { status: 404 });
    }
    
    // Generate embedding for the query
    const queryEmbedding = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    // Search Pinecone
    const index = pineconeClient.index(process.env.PINECONE_INDEX_NAME || 'chatbot-knowledge');
    const searchResults = await index.query({
      vector: queryEmbedding.data[0].embedding,
      topK,
      includeMetadata: true,
      filter: {
        licenseKey: productKeyInfo.license_key
      }
    });
    
    // Extract relevant text from results
    const relevantKnowledge = searchResults.matches
      .filter(match => match.score && match.score > 0.7) // Only high-relevance matches
      .map(match => {
        const text = match.metadata?.text;
        return typeof text === 'string' ? text : '';
      })
      .filter(text => text.length > 0)
      .join('\n\n---\n\n');
    
    // Also return match details for debugging
    const matchDetails = searchResults.matches.map(match => ({
      score: match.score,
      preview: typeof match.metadata?.contentPreview === 'string' ? match.metadata.contentPreview : undefined,
      chunkIndex: typeof match.metadata?.chunkIndex === 'number' ? match.metadata.chunkIndex : undefined
    }));
    
    return NextResponse.json({
      success: true,
      relevantKnowledge,
      matchCount: searchResults.matches.length,
      matchDetails,
      query,
      message: relevantKnowledge ? 
        'Found relevant knowledge' : 
        'No highly relevant knowledge found'
    });
  } catch (error) {
    console.error('Error searching embeddings:', error);
    return NextResponse.json({ 
      error: 'Failed to search embeddings',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const productKey = searchParams.get('key');
  
  if (!query || !productKey) {
    return NextResponse.json({ 
      error: 'Query parameter ?q=xxx&key=xxx required' 
    }, { status: 400 });
  }
  
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ query, productKey })
  }));
}