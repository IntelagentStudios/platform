import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    // Add proper admin auth check here
    
    // Fetch all licenses with related data
    const licenses = await prisma.licenses.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            email_verified: true,
            created_at: true
          }
        }
      }
    });
    
    // Enhance with product keys and usage stats
    const enhancedLicenses = await Promise.all(licenses.map(async (license) => {
      // Get product keys
      const productKeys = await prisma.product_keys.findMany({
        where: { license_key: license.license_key },
        select: {
          product: true,
          product_key: true,
          status: true,
          created_at: true,
          last_used: true,
          metadata: true
        }
      });
      
      // Get usage statistics
      const conversationCount = await prisma.chatbot_logs.count({
        where: {
          product_key: {
            in: productKeys.filter(pk => pk.product === 'chatbot').map(pk => pk.product_key)
          }
        }
      });
      
      // Get last activity
      const lastLog = await prisma.chatbot_logs.findFirst({
        where: {
          product_key: {
            in: productKeys.map(pk => pk.product_key)
          }
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true }
      });
      
      return {
        ...license,
        user: license.users,
        product_keys: productKeys,
        usage_stats: {
          total_conversations: conversationCount,
          total_api_calls: 0, // Can be implemented
          last_activity: lastLog?.timestamp || null
        }
      };
    }));
    
    return NextResponse.json({ 
      licenses: enhancedLicenses,
      total: enhancedLicenses.length,
      stats: {
        active: enhancedLicenses.filter(l => l.status === 'active').length,
        trial: enhancedLicenses.filter(l => l.status === 'trial').length,
        expired: enhancedLicenses.filter(l => l.status === 'expired').length
      }
    });
    
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }
}