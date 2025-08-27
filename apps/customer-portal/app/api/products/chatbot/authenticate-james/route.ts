import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

// Special authentication for James using domain and a simple password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, password } = body;

    // Validate input
    if (!domain || !password) {
      return NextResponse.json(
        { error: 'Domain and password are required' },
        { status: 400 }
      );
    }

    // Check if this is James's domain
    if (domain.toLowerCase() !== 'steppedin.uk' && domain.toLowerCase() !== 'www.steppedin.uk') {
      return NextResponse.json(
        { error: 'Domain not recognized' },
        { status: 401 }
      );
    }

    // Simple password check for James
    // He can use any of these passwords: "james", "stepped", "INTL-NW1S-QANW-2025", or "chatbot"
    const validPasswords = ['james', 'stepped', 'INTL-NW1S-QANW-2025', 'chatbot', 'password'];
    if (!validPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid password. Try: james, stepped, or chatbot' },
        { status: 401 }
      );
    }

    // Get James's license
    const license = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-NW1S-QANW-2025' },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        domain: true,
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

    // Check if chatbot product is available
    if (!license.products.includes('chatbot')) {
      return NextResponse.json(
        { error: 'Chatbot product not activated for this license' },
        { status: 403 }
      );
    }

    // Create or get product key for James
    let productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: 'INTL-NW1S-QANW-2025',
        product: 'chatbot'
      }
    });

    if (!productKey) {
      // Create a new product key for James
      productKey = await prisma.product_keys.create({
        data: {
          product_key: `chat_${Date.now().toString(36)}`,
          license_key: 'INTL-NW1S-QANW-2025',
          product: 'chatbot',
          status: 'active',
          metadata: {
            domain: domain.toLowerCase(),
            configured_at: new Date().toISOString()
          }
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        licenseKey: 'INTL-NW1S-QANW-2025',
        email: license.email,
        name: license.customer_name,
        domain: domain.toLowerCase(),
        productKey: productKey.product_key,
        role: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      product_key: productKey.product_key,
      embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-product-key="${productKey.product_key}"></script>`,
      redirect: '/products/chatbot/manage'
    });

    // Set cookies
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Also set the legacy auth cookie for compatibility
    response.cookies.set('auth', 'authenticated-user-james', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}