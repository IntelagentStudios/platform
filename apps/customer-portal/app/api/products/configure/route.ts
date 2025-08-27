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
    const { product, password, licenseKey: providedLicenseKey, configuration } = body;

    // Accept both 'password' and 'licenseKey' for backwards compatibility
    const licenseKeyInput = providedLicenseKey || password;

    // Validate input
    if (!product || !licenseKeyInput || !configuration) {
      return NextResponse.json(
        { error: 'Product, license key, and configuration are required' },
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

    // Validate license key format
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    const license_key = licenseKeyInput.toUpperCase();
    
    if (!licenseKeyPattern.test(license_key)) {
      return NextResponse.json(
        { error: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX' },
        { status: 400 }
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

    // License key is the authentication - no need for password verification
    // The license key proves ownership

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
            configured_by: license.email || license.customer_name || license.license_key
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