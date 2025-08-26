import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Product key prefixes
const PRODUCT_PREFIXES: Record<string, string> = {
  'chatbot': 'chat',
  'sales-agent': 'sale',
  'data-enrichment': 'data',
  'setup-agent': 'agnt'
};

// Generate product key based on product type
function generateProductKey(product: string): string {
  const prefix = PRODUCT_PREFIXES[product] || 'prod';
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString('hex');
  return `${prefix}_${randomString}`;
}

// Get embed format for each product
function getEmbedCode(product: string, productKey: string, config: any): string {
  switch (product) {
    case 'chatbot':
      return `<script src="https://dashboard.intelagentstudios.com/chatbot.js" data-product-key="${productKey}"></script>`;
    
    case 'sales-agent':
      return `<script src="https://dashboard.intelagentstudios.com/sales-agent.js" data-product-key="${productKey}"></script>`;
    
    case 'data-enrichment':
      return `API Key: ${productKey}\nEndpoint: https://api.intelagentstudios.com/v1/enrich\nMethod: POST`;
    
    case 'setup-agent':
      return `<script src="https://dashboard.intelagentstudios.com/setup-assistant.js" data-product-key="${productKey}"></script>`;
    
    default:
      return `Product Key: ${productKey}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product, password, configuration } = body;

    // Validate input
    if (!product || !password || !configuration) {
      return NextResponse.json(
        { error: 'Product, password, and configuration are required' },
        { status: 400 }
      );
    }

    // Validate product type
    if (!PRODUCT_PREFIXES[product]) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      );
    }

    // Get user from session/cookie
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Please log in to configure products' },
        { status: 401 }
      );
    }

    let license_key: string;
    let userEmail: string;

    try {
      // Decode auth token to get license key
      const decoded = JSON.parse(Buffer.from(authToken.value, 'base64').toString());
      license_key = decoded.license_key;
      userEmail = decoded.email;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Verify license exists and is active
    const license = await prisma.licenses.findUnique({
      where: { license_key },
      select: {
        license_key: true,
        status: true,
        products: true,
        email: true,
        customer_name: true
      }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (license.status !== 'active') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 403 }
      );
    }

    // Check if license has this product
    if (!license.products || !license.products.includes(product)) {
      return NextResponse.json(
        { error: `License does not include ${product} product` },
        { status: 403 }
      );
    }

    // Verify user password
    const user = await prisma.users.findUnique({
      where: { email: license.email || userEmail },
      select: {
        id: true,
        email: true,
        password_hash: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Check for existing configuration
    let existingKey = null;
    
    // For domain-based products, check if domain already configured
    if (configuration.domain) {
      existingKey = await prisma.product_keys.findFirst({
        where: {
          license_key: license_key,
          product: product,
          status: 'active',
          metadata: {
            path: ['domain'],
            equals: configuration.domain
          }
        },
        select: {
          product_key: true,
          metadata: true
        }
      });
    } else {
      // For non-domain products, check if any active key exists
      existingKey = await prisma.product_keys.findFirst({
        where: {
          license_key: license_key,
          product: product,
          status: 'active'
        },
        select: {
          product_key: true,
          metadata: true
        }
      });
    }

    let product_key: string;
    let is_new = false;

    if (existingKey) {
      // Use existing key
      product_key = existingKey.product_key;
      console.log(`Using existing ${product} key for license ${license_key}: ${product_key}`);
    } else {
      // Generate new product key
      product_key = generateProductKey(product);
      is_new = true;
      
      // Store in database
      await prisma.product_keys.create({
        data: {
          license_key: license_key,
          product: product,
          product_key: product_key,
          status: 'active',
          metadata: {
            ...configuration,
            configured_via: 'quick_setup',
            configured_at: new Date().toISOString(),
            configured_by: user.email
          }
        }
      });
      
      console.log(`Generated new ${product} key for license ${license_key}: ${product_key}`);
    }

    // Log the configuration attempt
    await prisma.setup_agent_logs.create({
      data: {
        session_id: `config_${product}_${Date.now()}`,
        user_message: `Configuration: ${JSON.stringify(configuration)}`,
        agent_response: `Product key ${is_new ? 'generated' : 'retrieved'}: ${product_key}`,
        domain: configuration.domain || null,
        timestamp: new Date()
      }
    });

    // Generate appropriate embed/integration code
    const embed_code = getEmbedCode(product, product_key, configuration);

    return NextResponse.json({
      success: true,
      product_key: product_key,
      embed_code: embed_code,
      configuration: configuration,
      is_new: is_new,
      message: is_new 
        ? `New ${product} configuration created successfully`
        : `Using your existing ${product} configuration`
    });

  } catch (error: any) {
    console.error('Product configuration error:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Configuration already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Configuration failed. Please try again or contact support.' },
      { status: 500 }
    );
  }
}