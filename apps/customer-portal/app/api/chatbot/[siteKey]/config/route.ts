import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chatbot/[siteKey]/config
 * Get complete configuration for a chatbot including knowledge and settings
 * This endpoint is designed for the n8n workflow to get everything in one call
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    const productKey = siteKey; // siteKey can be either a product_key or legacy site_key
    
    if (!productKey) {
      return NextResponse.json(
        { error: 'Site/Product key is required' },
        { status: 400 }
      );
    }

    // Get the product key record with metadata
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { 
        product_key: true,
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyRecord || productKeyRecord.status !== 'active') {
      // Try to find by legacy site_key
      const license = await prisma.licenses.findFirst({
        where: { site_key: productKey },
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
          select: { 
            product_key: true,
            metadata: true
          }
        });

        if (chatbotKey) {
          productKeyRecord.product_key = chatbotKey.product_key;
          productKeyRecord.metadata = chatbotKey.metadata;
        }
      }
      
      if (!productKeyRecord) {
        return NextResponse.json(
          { error: 'Invalid or inactive product key' },
          { status: 404 }
        );
      }
    }

    const finalProductKey = productKeyRecord.product_key;

    // Get all active custom knowledge (text-based) for this product
    let customKnowledge = [];
    try {
      customKnowledge = await prisma.custom_knowledge.findMany({
        where: {
          product_key: finalProductKey,
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
      knowledgeFiles = await prisma.custom_knowledge.findMany({
        where: {
          product_key: finalProductKey,
          is_active: true
        },
        select: {
          content: true,
          knowledge_type: true
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
        `[Knowledge: ${f.knowledge_type}]\n${f.content}`
      ).join('\n\n---\n\n');
    }

    // Extract settings from metadata
    const metadata = productKeyRecord.metadata as any || {};
    const settings = metadata.settings || {
      welcomeMessage: "Hello! How can I help you today?",
      themeColor: "#0070f3",
      position: "bottom-right",
      playNotificationSound: true,
      showWelcomeMessage: true,
      collectEmail: false,
      responseStyle: "professional"
    };

    // Get domain from metadata or license
    let domain = metadata.domain;
    if (!domain) {
      const license = await prisma.licenses.findFirst({
        where: { license_key: productKeyRecord.license_key },
        select: { domain: true }
      });
      domain = license?.domain || 'unknown';
    }

    return NextResponse.json({
      success: true,
      product_key: finalProductKey,
      license_key: productKeyRecord.license_key,
      domain: domain,
      knowledge: combinedKnowledge,
      has_knowledge: combinedKnowledge.length > 0,
      knowledge_stats: {
        custom_count: customKnowledge.length,
        files_count: knowledgeFiles.length,
        total_length: combinedKnowledge.length
      },
      settings: settings,
      metadata: {
        last_updated: metadata.updated_at || new Date().toISOString(),
        config_version: "2.0"
      }
    });

  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch chatbot configuration',
        knowledge: '',
        has_knowledge: false,
        settings: {
          welcomeMessage: "Hello! How can I help you today?",
          themeColor: "#0070f3",
          position: "bottom-right",
          playNotificationSound: true,
          showWelcomeMessage: true
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chatbot/[siteKey]/config
 * Update configuration for a chatbot (knowledge and/or settings)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { siteKey: string } }
) {
  try {
    const { siteKey } = params;
    const productKey = siteKey; // siteKey can be either a product_key or legacy site_key
    const body = await request.json();
    
    if (!productKey) {
      return NextResponse.json(
        { error: 'Site/Product key is required' },
        { status: 400 }
      );
    }

    // Get the product key record
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: { 
        product_key: true,
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyRecord || productKeyRecord.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive product key' },
        { status: 404 }
      );
    }

    const updates: any = {};

    // Update knowledge if provided
    if (body.knowledge !== undefined) {
      await prisma.custom_knowledge.upsert({
        where: {
          product_key_knowledge_type: {
            product_key: productKey,
            knowledge_type: 'general'
          }
        },
        update: {
          content: body.knowledge,
          is_active: true,
          updated_at: new Date(),
          created_by: body.updated_by || 'api'
        },
        create: {
          product_key: productKey,
          license_key: productKeyRecord.license_key,
          knowledge_type: 'general',
          content: body.knowledge,
          created_by: body.updated_by || 'api'
        }
      });
      updates.knowledge = 'Updated';
    }

    // Update settings if provided
    if (body.settings) {
      const currentMetadata = (productKeyRecord.metadata as any) || {};
      await prisma.product_keys.update({
        where: { product_key: productKey },
        data: {
          metadata: {
            ...currentMetadata,
            settings: {
              ...currentMetadata.settings,
              ...body.settings
            },
            updated_at: new Date().toISOString()
          }
        }
      });
      updates.settings = 'Updated';
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      updates: updates
    });

  } catch (error) {
    console.error('Error updating chatbot config:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update configuration'
      },
      { status: 500 }
    );
  }
}