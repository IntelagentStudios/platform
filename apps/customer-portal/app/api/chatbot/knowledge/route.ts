import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productKey } = body;
    
    if (!productKey) {
      return NextResponse.json({ 
        error: 'Product key required' 
      }, { status: 400 });
    }

    // Get the product key info
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true
      }
    });

    if (!productKeyInfo || productKeyInfo.status !== 'active') {
      return NextResponse.json({ 
        knowledge: null,
        error: 'Invalid or inactive product key' 
      });
    }

    // Get custom knowledge for this license
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

    // Combine all knowledge into one context
    let combinedKnowledge = '';
    
    if (customKnowledge.length > 0) {
      combinedKnowledge = customKnowledge
        .map(k => `[${k.knowledge_type}]\n${k.content}`)
        .join('\n\n---\n\n');
    }

    return NextResponse.json({
      knowledge: combinedKnowledge,
      hasKnowledge: customKnowledge.length > 0,
      knowledgeCount: customKnowledge.length,
      licenseKey: productKeyInfo.license_key
    });
  } catch (error) {
    console.error('Error fetching chatbot knowledge:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch knowledge',
      knowledge: null
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');
  
  if (!productKey) {
    return NextResponse.json({ 
      error: 'Product key required in query params (?key=xxx)' 
    }, { status: 400 });
  }

  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ productKey })
  }));
}