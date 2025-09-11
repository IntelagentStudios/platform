import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'chat_9b3f7e8a2c5d1f0e';
  
  try {
    // Get the product key info and settings
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
        error: 'Product key not found',
        productKey 
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
        content: true,
        knowledge_type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Combine knowledge
    let combinedKnowledge = '';
    if (customKnowledge.length > 0) {
      combinedKnowledge = customKnowledge
        .map(k => `[${k.knowledge_type}]\n${k.content}`)
        .join('\n\n---\n\n');
    }

    // Get settings from metadata
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};
    
    // Configuration
    const config = {
      themeColor: settings.themeColor || '#0070f3',
      position: settings.position || 'bottom-right',
      welcomeMessage: settings.welcomeMessage || 'Hello! How can I help you today?',
      responseStyle: settings.responseStyle || 'professional'
    };

    return NextResponse.json({
      productKey,
      status: productKeyInfo.status,
      config,
      metadata,
      knowledge: {
        entries: customKnowledge,
        combined: combinedKnowledge,
        totalLength: combinedKnowledge.length
      },
      widgetUrl: `/api/widget/dynamic?key=${productKey}`
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error testing config:', error);
    return NextResponse.json({ 
      error: 'Failed to test configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}