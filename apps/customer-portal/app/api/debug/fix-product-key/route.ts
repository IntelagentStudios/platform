import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productKey } = body;
    
    if (!productKey) {
      return NextResponse.json({ 
        error: 'Please provide the product_key from your widget' 
      }, { status: 400 });
    }
    
    // Get auth token to identify the user
    const authToken = cookies().get('auth_token');
    if (!authToken) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ 
        error: 'No license key in token' 
      }, { status: 403 });
    }
    
    // Check if product key already exists
    const existing = await prisma.product_keys.findUnique({
      where: { product_key: productKey }
    });
    
    if (existing) {
      if (existing.license_key !== licenseKey) {
        return NextResponse.json({ 
          error: 'This product key belongs to a different license',
          owner: existing.license_key
        }, { status: 403 });
      }
      
      return NextResponse.json({
        message: 'Product key already correctly configured',
        product_key: existing
      });
    }
    
    // Get license info for domain
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });
    
    if (!license) {
      return NextResponse.json({ 
        error: 'License not found' 
      }, { status: 404 });
    }
    
    // Create the product key
    const newProductKey = await prisma.product_keys.create({
      data: {
        product_key: productKey,
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active',
        metadata: {
          domain: license.domain,
          company_name: license.customer_name,
          auto_created: true,
          created_via: 'debug_fix'
        }
      }
    });
    
    // Update all existing logs with this product_key to use the correct license
    const updateResult = await prisma.chatbot_logs.updateMany({
      where: { 
        product_key: productKey,
        // Only update logs that don't have a license association
        OR: [
          { user_id: 'anonymous' },
          { user_id: null }
        ]
      },
      data: {
        domain: license.domain
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Product key created and linked to your license',
      product_key: newProductKey,
      logs_updated: updateResult.count,
      next_steps: [
        'Your chatbot conversations should now appear in the dashboard',
        'Refresh the conversations page to see them',
        'Future conversations will automatically be linked'
      ]
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Fix failed',
      message: error.message
    }, { status: 500 });
  }
}