import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Generate product key
function generateProductKey(): string {
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString('hex');
  return `chat_${randomString}`;
}

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, password } = body;

    // Validate inputs
    if (!domain || !password) {
      return NextResponse.json(
        { error: 'Domain and password are required' },
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
        { error: 'You must be logged in to configure a chatbot' },
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

    // Check if chatbot product is available
    if (!license.products.includes('chatbot')) {
      // Add chatbot to products if not present
      await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: {
          products: {
            push: 'chatbot'
          }
        }
      });
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
          product_key: generateProductKey(),
          license_key: licenseKey,
          product: 'chatbot',
          status: 'active',
          metadata: {
            domain: domain.toLowerCase(),
            configured_at: new Date().toISOString(),
            configured_by: userEmail
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
            configured_at: new Date().toISOString(),
            configured_by: userEmail
          }
        }
      });
    }

    // Return success with configuration
    return NextResponse.json({
      success: true,
      product_key: productKey.product_key,
      embed_code: `<script src="https://embed.intelagentstudios.com/v1/chatbot.js" data-product-key="${productKey.product_key}"></script>`,
      domain: domain,
      message: 'Chatbot configured successfully'
    });

  } catch (error: any) {
    console.error('Quick setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to configure chatbot' },
      { status: 500 }
    );
  }
}