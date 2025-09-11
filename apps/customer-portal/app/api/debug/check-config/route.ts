import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key') || 'PK-INTL-AGNT-BOSS-MODE';
  
  try {
    // Get product key configuration
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        product_key: true,
        license_key: true,
        status: true,
        metadata: true,
        created_at: true
      }
    });

    // Get custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        product_key: productKey
      },
      select: {
        id: true,
        content: true,
        knowledge_type: true,
        is_active: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Get any knowledge by license key as fallback
    const knowledgeByLicense = productKeyInfo ? await prisma.custom_knowledge.findMany({
      where: { 
        license_key: productKeyInfo.license_key
      },
      select: {
        id: true,
        content: true,
        knowledge_type: true,
        is_active: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    }) : [];

    return NextResponse.json({
      productKey,
      productKeyExists: !!productKeyInfo,
      settings: productKeyInfo?.metadata || null,
      customKnowledge: {
        byProductKey: customKnowledge,
        byLicenseKey: knowledgeByLicense,
        totalByProductKey: customKnowledge.length,
        totalByLicenseKey: knowledgeByLicense.length
      },
      debug: {
        licenseKey: productKeyInfo?.license_key,
        status: productKeyInfo?.status,
        createdAt: productKeyInfo?.created_at
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error checking config:', error);
    return NextResponse.json({ 
      error: 'Failed to check configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}