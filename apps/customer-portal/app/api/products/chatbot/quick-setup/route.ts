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
    const { domain, password, licenseKey: providedLicenseKey } = body;

    // Validate domain is provided
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    let licenseKey: string;
    let isAuthenticated = false;

    // Check if user is already logged in
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token') || cookieStore.get('auth-token');
    
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
        
        // If logged in and no password/license provided, use their existing license
        if (!password && !providedLicenseKey && decoded.licenseKey) {
          licenseKey = decoded.licenseKey;
          isAuthenticated = true;
        } else if (password) {
          // If password provided, verify it against the user's account
          if (decoded.email) {
            const user = await prisma.users.findUnique({
              where: { email: decoded.email },
              select: { 
                password_hash: true,
                license_key: true
              }
            });
            
            if (user && user.password_hash) {
              const isValidPassword = await bcrypt.compare(password, user.password_hash);
              if (isValidPassword && user.license_key) {
                licenseKey = user.license_key;
                isAuthenticated = true;
              } else if (!isValidPassword) {
                return NextResponse.json(
                  { error: 'Invalid password' },
                  { status: 401 }
                );
              }
            }
          }
        }
      } catch (error) {
        console.log('Token verification failed:', error);
      }
    }

    // If not authenticated yet, try to use provided license key
    if (!isAuthenticated) {
      const licenseKeyInput = providedLicenseKey || password;
      
      if (!licenseKeyInput) {
        return NextResponse.json(
          { error: 'Please provide your password or license key' },
          { status: 400 }
        );
      }

      // Check if it looks like a license key
      const licenseKeyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$|^INTL-[A-Z0-9-]+$/;
      const upperInput = licenseKeyInput.toUpperCase();
      
      if (licenseKeyPattern.test(upperInput)) {
        licenseKey = upperInput;
      } else {
        return NextResponse.json(
          { error: 'Invalid license key format. Expected format like: INTL-XXXX-XXXX-XXXX' },
          { status: 400 }
        );
      }
    }
    
    // Verify the license exists
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey! },
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

    // Generate JWT token if not already authenticated
    let token = authToken?.value;
    if (!isAuthenticated || !token) {
      token = jwt.sign(
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
    }

    // Return success with configuration
    const response = NextResponse.json({
      success: true,
      product_key: productKey.product_key,
      embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-product-key="${productKey.product_key}"></script>`,
      domain: domain,
      message: 'Chatbot configured successfully'
    });

    // Set auth cookies if new token was generated
    if (!isAuthenticated) {
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
    }

    return response;

  } catch (error: any) {
    console.error('Quick setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to configure chatbot' },
      { status: 500 }
    );
  }
}