import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function GET(request: NextRequest) {
  try {
    // Get auth token to identify the user
    const authToken = cookies().get('auth_token');
    let licenseKey = 'UNKNOWN';
    
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
        licenseKey = decoded.licenseKey || 'NO_LICENSE_IN_TOKEN';
      } catch (e) {
        licenseKey = 'INVALID_TOKEN';
      }
    }
    
    // Get ALL recent chatbot logs to see what's being stored
    const recentLogs = await prisma.chatbot_logs.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        session_id: true,
        product_key: true,
        domain: true,
        customer_message: true,
        timestamp: true
      }
    });
    
    // Specifically check for your product key
    const yourProductKeyLogs = await prisma.chatbot_logs.findMany({
      where: { product_key: 'chat_9b3f7e8a2c5d1f0e' },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    // Get product keys for this license
    const productKeys = await prisma.product_keys.findMany({
      where: { license_key: licenseKey },
      select: {
        product_key: true,
        product: true,
        status: true,
        created_at: true
      }
    });
    
    // Count logs by product_key
    const logCounts = await prisma.chatbot_logs.groupBy({
      by: ['product_key'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    // Get the license info
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        domain: true,
        products: true,
        customer_name: true
      }
    });
    
    // Check if the specific product key exists
    const specificProductKey = await prisma.product_keys.findUnique({
      where: { product_key: 'chat_9b3f7e8a2c5d1f0e' }
    });
    
    return NextResponse.json({
      debug: {
        your_license_key: licenseKey,
        your_license_info: license,
        your_product_keys: productKeys,
        recent_logs: recentLogs,
        logs_for_chat_9b3f7e8a2c5d1f0e: {
          count: yourProductKeyLogs.length,
          logs: yourProductKeyLogs,
          product_key_record: specificProductKey,
          belongs_to_license: specificProductKey?.license_key,
          matches_your_license: specificProductKey?.license_key === licenseKey
        },
        logs_by_product_key: logCounts,
        total_logs_in_db: await prisma.chatbot_logs.count(),
        analysis: {
          issue: productKeys.length === 0 ? 
            'No product keys found for your license' : 
            'Product keys exist, checking if logs match',
          your_product_keys: productKeys.map(pk => pk.product_key),
          logs_product_keys: logCounts.map(lc => lc.product_key),
          matching: productKeys.some(pk => 
            logCounts.some(lc => lc.product_key === pk.product_key)
          ) ? 'YES - Logs should be visible' : 'NO - Product key mismatch',
          specific_key_check: specificProductKey?.license_key === licenseKey ? 
            'chat_9b3f7e8a2c5d1f0e IS linked to your license' : 
            `chat_9b3f7e8a2c5d1f0e is linked to: ${specificProductKey?.license_key || 'NOT FOUND'}`
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}