import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { createProductKey, getProductKey } from '@/lib/product-keys-service';
import { prisma } from '@/lib/prisma';
import { generateProductKey } from '@/lib/product-keys';

/**
 * POST /api/products/chatbot/configure
 * Configure chatbot with new product key system
 */
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  
  try {
    const { domain, webhook_url, settings } = await request.json();
    
    // Check if user has chatbot product
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { products: true, email: true }
    });
    
    if (!license || !license.products.includes('chatbot')) {
      return NextResponse.json(
        { error: 'Chatbot product not purchased' },
        { status: 403 }
      );
    }
    
    // Check if already configured
    const existingKey = await getProductKey(licenseKey, 'chatbot');
    
    if (existingKey) {
      return NextResponse.json({
        success: true,
        product_key: existingKey,
        message: 'Chatbot already configured',
        action: 'existing_key_returned'
      });
    }
    
    // Generate new chatbot key with proper prefix
    const { key } = generateProductKey('chatbot');
    
    // Create in product_keys table
    await prisma.product_keys.create({
      data: {
        license_key: licenseKey,
        product: 'chatbot',
        product_key: key,
        status: 'active',
        metadata: {
          domain: domain || null,
          webhook_url: webhook_url || null,
          settings: settings || {},
          configured_at: new Date().toISOString(),
          configured_by: license.email
        }
      }
    });
    
    // Also update licenses table for backward compatibility (temporary)
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: { 
        site_key: key,
        domain: domain 
      }
    });
    
    return NextResponse.json({
      success: true,
      product_key: key,
      message: 'Chatbot configured successfully',
      configuration: {
        license_key: licenseKey,
        product: 'chatbot',
        product_key: key,
        domain: domain,
        format: 'new_product_key_format',
        prefix: 'chat'
      }
    });
    
  } catch (error) {
    console.error('Chatbot configuration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to configure chatbot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/chatbot/configure
 * Get current chatbot configuration
 */
export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  
  try {
    // Get chatbot product key
    const productKey = await getProductKey(licenseKey, 'chatbot');
    
    if (!productKey) {
      return NextResponse.json({
        configured: false,
        message: 'Chatbot not configured'
      });
    }
    
    // Get configuration details
    const productKeyRecord = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        product_key: productKey
      }
    });
    
    // Parse the product key to show format
    const keyParts = productKey.split('_');
    const isNewFormat = keyParts[0] === 'chat';
    
    return NextResponse.json({
      configured: true,
      product_key: productKey,
      format: isNewFormat ? 'new_product_key_format' : 'legacy_site_key',
      prefix: keyParts[0],
      configuration: productKeyRecord?.metadata || {},
      embed_code: generateEmbedCode(productKey),
      webhook_endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.intelagentstudios.com'}/api/webhook/chatbot/${productKey}`
    });
    
  } catch (error) {
    console.error('Get configuration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/chatbot/configure
 * Reset chatbot configuration (for testing)
 */
export async function DELETE(request: NextRequest) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  
  try {
    // Delete from product_keys
    await prisma.product_keys.deleteMany({
      where: {
        license_key: licenseKey,
        product: 'chatbot'
      }
    });
    
    // Clear from licenses table
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: { site_key: null }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Chatbot configuration reset successfully'
    });
    
  } catch (error) {
    console.error('Reset configuration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate embed code
function generateEmbedCode(productKey: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.intelagentstudios.com';
  
  return `<!-- Intelagent Chatbot -->
<script>
  (function() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = '${baseUrl}/chatbot.js';
    script.setAttribute('data-product-key', '${productKey}');
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  })();
</script>`;
}