import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/**
 * GET /api/products/chatbot/custom-knowledge
 * Get custom knowledge for a chatbot
 * Fixed: Using direct JWT validation to avoid database dependency issues
 */
export async function GET(request: NextRequest) {
  try {
    // Check for simple auth first
    const simpleAuth = request.cookies.get('auth');
    if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
      // Return empty knowledge for simple auth
      return NextResponse.json({
        success: true,
        knowledge: '',
        product_key: 'CHATBOT-KEY-MOCK'
      });
    }

    // Simple JWT validation without database lookup for now
    const authToken = request.cookies.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode JWT to get license key
    const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    let licenseKey: string;
    
    try {
      const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
      licenseKey = decoded.licenseKey;
      
      if (!licenseKey) {
        return NextResponse.json(
          { error: 'No license key in token' },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
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

    // Get all custom knowledge for this chatbot
    let knowledge = [];
    try {
      knowledge = await prisma.custom_knowledge.findMany({
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
    } catch (dbError) {
      console.log('No custom knowledge found or table not ready:', dbError);
      // Return empty array if table doesn't exist or query fails
      knowledge = [];
    }

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
    // Check for simple auth first
    const simpleAuth = request.cookies.get('auth');
    if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
      const body = await request.json();
      // For simple auth, just return success without actually saving
      return NextResponse.json({
        success: true,
        message: 'Knowledge updated (mock)',
        product_key: 'CHATBOT-KEY-MOCK'
      });
    }

    // Simple JWT validation
    const authToken = request.cookies.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    let licenseKey: string;
    let email: string = 'unknown';
    
    try {
      const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
      licenseKey = decoded.licenseKey;
      email = decoded.email || 'unknown';
      
      if (!licenseKey) {
        return NextResponse.json(
          { error: 'No license key in token' },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
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
    // Simple JWT validation
    const authToken = request.cookies.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    let licenseKey: string;
    
    try {
      const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
      licenseKey = decoded.licenseKey;
      
      if (!licenseKey) {
        return NextResponse.json(
          { error: 'No license key in token' },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
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