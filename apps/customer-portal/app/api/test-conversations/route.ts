import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check what's actually in the chatbot_logs table
    const logs = await prisma.chatbot_logs.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        product_key: true,
        domain: true,
        session_id: true,
        conversation_id: true,
        customer_message: true,
        timestamp: true
      }
    });

    // Check product keys
    const productKeys = await prisma.product_keys.findMany({
      where: { product: 'chatbot' },
      select: {
        product_key: true,
        license_key: true,
        status: true
      }
    });

    return NextResponse.json({
      totalLogs: await prisma.chatbot_logs.count(),
      recentLogs: logs,
      productKeys: productKeys,
      harryKey: 'chat_9b3f7e8a2c5d1f0e',
      jamesKey: 'chat_1d37512c82d10c04'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}