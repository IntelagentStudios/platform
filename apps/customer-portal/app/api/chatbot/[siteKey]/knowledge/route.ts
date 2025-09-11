import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chatbot/[siteKey]/knowledge
 * Get custom knowledge for a chatbot by site key (for N8N workflow)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    
    if (!siteKey) {
      return NextResponse.json(
        { error: 'Site key is required' },
        { status: 400 }
      );
    }

    // Find the product key from the site key (could be product_key or legacy site_key)
    let productKey = siteKey;
    
    // Check if this is a product key
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: siteKey },
      select: { 
        product_key: true,
        license_key: true,
        status: true
      }
    });

    if (!productKeyRecord || productKeyRecord.status !== 'active') {
      // Try to find by legacy site_key
      const license = await prisma.licenses.findFirst({
        where: { site_key: siteKey },
        select: { license_key: true }
      });

      if (license) {
        // Find the chatbot product key for this license
        const chatbotKey = await prisma.product_keys.findFirst({
          where: {
            license_key: license.license_key,
            product: 'chatbot',
            status: 'active'
          },
          select: { product_key: true }
        });

        if (chatbotKey) {
          productKey = chatbotKey.product_key;
        }
      }
    }

    // Get all active custom knowledge (text-based) for this product
    let customKnowledge = [];
    try {
      customKnowledge = await prisma.custom_knowledge.findMany({
        where: {
          product_key: productKey,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        },
        select: {
          content: true,
          knowledge_type: true
        }
      });
    } catch (error) {
      console.log('Custom knowledge fetch error (non-critical):', error);
    }
    
    // Get all knowledge files for this product
    let knowledgeFiles = [];
    try {
      knowledgeFiles = await prisma.knowledge_files.findMany({
        where: {
          product_key: productKey
        },
        select: {
          content: true,
          filename: true
        }
      });
    } catch (error) {
      console.log('Knowledge files fetch error (non-critical):', error);
    }

    // Combine all knowledge into a single response
    let combinedKnowledge = '';
    
    // Add custom knowledge
    if (customKnowledge.length > 0) {
      combinedKnowledge += customKnowledge.map(k => 
        `[${k.knowledge_type}]\n${k.content}`
      ).join('\n\n---\n\n');
    }
    
    // Add knowledge files
    if (knowledgeFiles.length > 0) {
      if (combinedKnowledge) combinedKnowledge += '\n\n---\n\n';
      combinedKnowledge += knowledgeFiles.map(f => 
        `[File: ${f.filename}]\n${f.content}`
      ).join('\n\n---\n\n');
    }

    return NextResponse.json({
      success: true,
      knowledge: combinedKnowledge,
      has_knowledge: combinedKnowledge.length > 0,
      types: customKnowledge.map(k => k.knowledge_type),
      files_count: knowledgeFiles.length,
      custom_count: customKnowledge.length
    });

  } catch (error) {
    console.error('Error fetching chatbot knowledge:', error);
    return NextResponse.json(
      { 
        success: false,
        knowledge: '',
        has_knowledge: false,
        error: 'Failed to fetch custom knowledge' 
      },
      { status: 500 }
    );
  }
}