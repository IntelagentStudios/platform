import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate product key
function generateProductKey(): string {
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString('hex');
  return `chat_${randomString}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Accept both 'password' and 'licenseKey' for backwards compatibility
    const { domain, password, licenseKey: providedLicenseKey } = body;
    const licenseKeyInput = providedLicenseKey || password;

    // Validate input
    if (!domain || !licenseKeyInput) {
      return NextResponse.json(
        { error: 'Domain and license key are required' },
        { status: 400 }
      );
    }

    // Validate license key format
    const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    const licenseKey = licenseKeyInput.toUpperCase();
    
    if (!licenseKeyPattern.test(licenseKey)) {
      return NextResponse.json(
        { error: 'Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX' },
        { status: 400 }
      );
    }
    
    // Verify the license exists
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
        { error: 'Invalid license key' },
        { status: 401 }
      );
    }

    if (license.status !== 'active') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 403 }
      );
    }

    // Check if chatbot product is available
    if (!license.products.includes('chatbot')) {
      return NextResponse.json(
        { error: 'Chatbot product not activated for this license' },
        { status: 403 }
      );
    }

    // Create or get product key
    let productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      }
    });

    if (!productKey) {
      // Create a new product key
      productKey = await prisma.product_keys.create({
        data: {
          product_key: `chat_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`,
          license_key: licenseKey,
          product: 'chatbot',
          status: 'active',
          metadata: {
            domain: domain.toLowerCase(),
            configured_at: new Date().toISOString()
          }
        }
      });
    } else {
      // Update the domain in metadata
      await prisma.product_keys.update({
        where: { product_key: productKey.product_key },
        data: {
          metadata: {
            domain: domain.toLowerCase(),
            configured_at: new Date().toISOString()
          }
        }
      });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';
    const token = jwt.sign(
      {
        licenseKey: licenseKey,
        email: license.email,
        name: license.customer_name,
        domain: domain.toLowerCase(),
        productKey: productKey.product_key,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success with configuration
    const response = NextResponse.json({
      success: true,
      product_key: productKey.product_key,
      embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-product-key="${productKey.product_key}"></script>`,
      domain: domain,
      message: 'Chatbot configured successfully'
    });

    // Set auth cookies
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;

    // Validate domain format
    const domainPattern = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainPattern.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Find user by domain (assuming domain is unique to a user's chatbot)
    // First, check if there's an existing product key for this domain
    const existingConfig = await prisma.product_keys.findFirst({
      where: {
        metadata: {
          path: ['domain'],
          equals: domain
        }
      },
      select: {
        license_key: true,
        product_key: true
      }
    });

    let license_key: string;
    let user: any = null;

    if (existingConfig) {
      // Domain already configured, verify ownership with password
      license_key = existingConfig.license_key;
      
      // Get the user associated with this license
      const license = await prisma.licenses.findUnique({
        where: { license_key },
        select: {
          email: true,
          customer_name: true,
          status: true,
          products: true
        }
      });

      if (!license) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        );
      }

      // Find user by email
      user = await prisma.users.findUnique({
        where: { email: license.email! },
        select: {
          id: true,
          email: true,
          password_hash: true,
          license_key: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }

      // Return existing configuration
      const embed_code = `<script src="https://dashboard.intelagentstudios.com/chatbot.js" data-product-key="${existingConfig.product_key}"></script>`;

      return NextResponse.json({
        success: true,
        product_key: existingConfig.product_key,
        embed_code: embed_code,
        domain: domain,
        is_new: false,
        message: 'Using your existing chatbot configuration'
      });

    } else {
      // New domain configuration - need to authenticate user first
      // For new configs, we need a way to identify the user
      // Option: Use cookie/session to get current user
      
      // Try to get user from cookie/session
      const authCookie = request.cookies.get('auth-token');
      if (!authCookie) {
        return NextResponse.json(
          { error: 'Please log in to configure a new domain' },
          { status: 401 }
        );
      }

      // Verify the auth token and get user
      try {
        // This should match your auth system
        const decoded = JSON.parse(Buffer.from(authCookie.value, 'base64').toString());
        license_key = decoded.license_key;

        // Verify license exists and is valid
        const license = await prisma.licenses.findUnique({
          where: { license_key },
          select: {
            license_key: true,
            status: true,
            products: true,
            email: true
          }
        });

        if (!license || license.status !== 'active') {
          return NextResponse.json(
            { error: 'Invalid or inactive license' },
            { status: 403 }
          );
        }

        if (!license.products || !license.products.includes('chatbot')) {
          return NextResponse.json(
            { error: 'License does not include chatbot product' },
            { status: 403 }
          );
        }

        // Get user and verify password
        user = await prisma.users.findUnique({
          where: { email: license.email! },
          select: {
            id: true,
            email: true,
            password_hash: true
          }
        });

        if (!user) {
          return NextResponse.json(
            { error: 'Account not found' },
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

      } catch (error) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }

      // Generate new product key
      const product_key = generateProductKey();
      
      // Store in database
      await prisma.product_keys.create({
        data: {
          license_key: license_key,
          product: 'chatbot',
          product_key: product_key,
          status: 'active',
          metadata: {
            domain: domain,
            configured_via: 'quick_setup',
            configured_at: new Date().toISOString()
          }
        }
      });
      
      console.log(`Generated new product key for domain ${domain}: ${product_key}`);

      // Log the setup attempt
      await prisma.setup_agent_logs.create({
        data: {
          session_id: `quick_setup_${Date.now()}`,
          user_message: `Quick setup: ${domain}`,
          agent_response: `Product key generated: ${product_key}`,
          domain: domain,
          timestamp: new Date()
        }
      });

      // Generate embed code
      const embed_code = `<script src="https://dashboard.intelagentstudios.com/chatbot.js" data-product-key="${product_key}"></script>`;

      return NextResponse.json({
        success: true,
        product_key: product_key,
        embed_code: embed_code,
        domain: domain,
        is_new: true,
        message: 'New chatbot configuration created successfully'
      });
    }

  } catch (error: any) {
    console.error('Quick setup error:', error);
    
    return NextResponse.json(
      { error: 'Configuration failed. Please try again or contact support.' },
      { status: 500 }
    );
  }
}