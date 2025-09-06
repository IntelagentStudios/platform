import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/chatbot/custom-knowledge
 * Get custom knowledge for a chatbot
 */
export async function GET(request: NextRequest) {
  try {
    let authResult;
    try {
      authResult = await validateAuth(request);
    } catch (authError: any) {
      console.error('Auth validation error:', authError);
      return NextResponse.json(
        { error: 'Auth validation failed', details: authError.message },
        { status: 401 }
      );
    }
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { licenseKey } = authResult.user;
    
    // Get chatbot product key
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      },
      select: { product_key: true }
    });

    if (!productKey) {
      return NextResponse.json(
        { error: 'Chatbot not configured' },
        { status: 404 }
      );
    }

    // Get all custom knowledge for this chatbot
    const knowledge = await prisma.custom_knowledge.findMany({
      where: {
        product_key: productKey.product_key,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({
      success: true,
      knowledge: knowledge
    });

  } catch (error) {
    console.error('Error fetching custom knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom knowledge' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/chatbot/custom-knowledge
 * Add or update custom knowledge for a chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { licenseKey, email } = authResult.user;
    const body = await request.json();
    const { 
      content, 
      knowledge_type = 'general',
      expires_at = null 
    } = body;

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Limit content size (e.g., 50KB)
    if (content.length > 50000) {
      return NextResponse.json(
        { error: 'Content is too large (max 50KB)' },
        { status: 400 }
      );
    }

    // Get chatbot product key
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      },
      select: { product_key: true }
    });

    if (!productKey) {
      return NextResponse.json(
        { error: 'Chatbot not configured' },
        { status: 404 }
      );
    }

    // Upsert the custom knowledge
    const knowledge = await prisma.custom_knowledge.upsert({
      where: {
        product_key_knowledge_type: {
          product_key: productKey.product_key,
          knowledge_type: knowledge_type
        }
      },
      update: {
        content: content.trim(),
        is_active: true,
        expires_at: expires_at ? new Date(expires_at) : null,
        updated_at: new Date(),
        created_by: email
      },
      create: {
        product_key: productKey.product_key,
        license_key: licenseKey,
        knowledge_type: knowledge_type,
        content: content.trim(),
        expires_at: expires_at ? new Date(expires_at) : null,
        created_by: email
      }
    });

    console.log(`[custom-knowledge] Saved for ${productKey.product_key}: ${content.substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      message: 'Custom knowledge saved successfully',
      knowledge: knowledge
    });

  } catch (error) {
    console.error('Error saving custom knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to save custom knowledge' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/chatbot/custom-knowledge
 * Delete custom knowledge for a chatbot
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { licenseKey } = authResult.user;
    const { searchParams } = new URL(request.url);
    const knowledge_type = searchParams.get('type') || 'general';

    // Get chatbot product key
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      },
      select: { product_key: true }
    });

    if (!productKey) {
      return NextResponse.json(
        { error: 'Chatbot not configured' },
        { status: 404 }
      );
    }

    // Soft delete by marking as inactive
    await prisma.custom_knowledge.updateMany({
      where: {
        product_key: productKey.product_key,
        knowledge_type: knowledge_type
      },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    console.log(`[custom-knowledge] Deleted ${knowledge_type} for ${productKey.product_key}`);

    return NextResponse.json({
      success: true,
      message: 'Custom knowledge deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting custom knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom knowledge' },
      { status: 500 }
    );
  }
}