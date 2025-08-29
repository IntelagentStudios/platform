import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

// Product key prefixes
const PRODUCT_PREFIXES: Record<string, string> = {
  'chatbot': 'chat',
  'sales-outreach-agent': 'sale',
  'data-enrichment': 'data',
  'onboarding-agent': 'agnt'
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
      return `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-product-key="${productKey}"></script>`;
    
    case 'sales-outreach-agent':
      return `<script src="https://dashboard.intelagentstudios.com/sales-outreach-agent.js" data-product-key="${productKey}"></script>`;
    
    case 'data-enrichment':
      return `API Key: ${productKey}\nEndpoint: https://api.intelagentstudios.com/v1/enrich\nMethod: POST`;
    
    case 'onboarding-agent':
      return `<script src="https://dashboard.intelagentstudios.com/onboarding-assistant.js" data-product-key="${productKey}"></script>`;
    
    default:
      return `Product Key: ${productKey}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product, password, configuration } = body;
    
    console.log('[CONFIGURE] Request received:', {
      product,
      hasPassword: !!password,
      configuration
    });

    // Validate inputs
    if (!product || !password) {
      return NextResponse.json(
        { error: 'Product and password are required' },
        { status: 400 }
      );
    }
    
    if (!configuration || !configuration.domain) {
      return NextResponse.json(
        { error: 'Domain is required for configuration' },
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

    let licenseKey: string | null = null;
    let userEmail: string | null = null;

    // Check if user is logged in and verify password
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token') || cookieStore.get('auth-token');
    
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
        
        if (decoded.email) {
          // Get user and verify password
          const user = await prisma.users.findUnique({
            where: { email: decoded.email },
            select: { 
              email: true,
              password_hash: true,
              license_key: true
            }
          });
          
          if (user && user.password_hash) {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (isValidPassword && user.license_key) {
              licenseKey = user.license_key;
              userEmail = user.email;
            } else if (!isValidPassword) {
              return NextResponse.json(
                { error: 'Incorrect password' },
                { status: 401 }
              );
            } else if (!user.license_key) {
              return NextResponse.json(
                { error: 'No license key associated with your account' },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'User account not found' },
              { status: 404 }
            );
          }
        }
      } catch (error) {
        console.log('Token verification failed:', error);
        return NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'You must be logged in to configure products' },
        { status: 401 }
      );
    }

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Unable to retrieve license key' },
        { status: 400 }
      );
    }
    
    // Verify the license exists and is active
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        status: true,
        products: true
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
        { error: 'Your license is not active' },
        { status: 403 }
      );
    }

    // Check if product is available in license
    if (!license.products.includes(product)) {
      // For chatbot, add it automatically if not present
      if (product === 'chatbot') {
        await prisma.licenses.update({
          where: { license_key: licenseKey },
          data: {
            products: {
              push: 'chatbot'
            }
          }
        });
      } else {
        return NextResponse.json(
          { error: `Your license does not include ${product}` },
          { status: 403 }
        );
      }
    }

    // Check for existing product key
    let productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: product,
        status: 'active'
      }
    });

    let isNew = false;

    if (!productKey) {
      // Create a new product key
      isNew = true;
      productKey = await prisma.product_keys.create({
        data: {
          product_key: generateProductKey(product),
          license_key: licenseKey,
          product: product,
          status: 'active',
          metadata: {
            ...configuration,
            configured_at: new Date().toISOString(),
            configured_by: userEmail
          }
        }
      });
      console.log(`[CONFIGURE] Generated new ${product} key: ${productKey.product_key}`);
    } else {
      // Update the existing product key's metadata
      const existingDomain = (productKey.metadata as any)?.domain;
      if (existingDomain !== configuration.domain) {
        console.log(`[CONFIGURE] Updating domain from ${existingDomain} to ${configuration.domain}`);
        await prisma.product_keys.update({
          where: { product_key: productKey.product_key },
          data: {
            metadata: {
              ...((productKey.metadata as any) || {}),
              ...configuration,
              updated_at: new Date().toISOString(),
              configured_by: userEmail
            }
          }
        });
      }
      console.log(`[CONFIGURE] Using existing ${product} key: ${productKey.product_key}`);
    }

    // Generate appropriate embed/integration code
    const embedCode = getEmbedCode(product, productKey.product_key, configuration);

    // Return success with configuration
    return NextResponse.json({
      success: true,
      product_key: productKey.product_key,
      embed_code: embedCode,
      domain: configuration.domain,
      is_new: isNew,
      message: isNew 
        ? `${product} configured successfully`
        : `${product} configuration updated`
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
      { error: error.message || 'Failed to configure product' },
      { status: 500 }
    );
  }
}