import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const licenseKey = 'INTL-AGNT-BOSS-MODE';
    
    // Get the user's site_key from licenses table
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { site_key: true }
    });

    if (!license?.site_key) {
      return NextResponse.json({ 
        conversations: [],
        message: 'No chatbot configured' 
      });
    }

    // Fetch chatbot logs for this site_key
    const logs = await prisma.chatbot_logs.findMany({
      where: { site_key: license.site_key },
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to last 100 messages
    });

    // Group logs by conversation_id or session_id
    const conversationsMap = new Map();
    
    logs.forEach(log => {
      const conversationId = log.conversation_id || log.session_id || 'unknown';
      
      if (!conversationsMap.has(conversationId)) {
        conversationsMap.set(conversationId, {
          id: conversationId,
          session_id: log.session_id,
          domain: log.domain,
          messages: [],
          first_message_at: log.timestamp || log.created_at,
          last_message_at: log.timestamp || log.created_at
        });
      }
      
      const conversation = conversationsMap.get(conversationId);
      
      // Add message to conversation
      if (log.customer_message || log.content) {
        conversation.messages.push({
          role: log.role || 'user',
          content: log.customer_message || log.content || '',
          timestamp: log.timestamp || log.created_at,
          intent: log.intent_detected
        });
      }
      
      if (log.chatbot_response) {
        conversation.messages.push({
          role: 'assistant',
          content: log.chatbot_response,
          timestamp: log.timestamp || log.created_at
        });
      }
      
      // Update timestamps
      if (log.timestamp || log.created_at) {
        const messageTime = new Date(log.timestamp || log.created_at);
        if (messageTime < new Date(conversation.first_message_at)) {
          conversation.first_message_at = log.timestamp || log.created_at;
        }
        if (messageTime > new Date(conversation.last_message_at)) {
          conversation.last_message_at = log.timestamp || log.created_at;
        }
      }
    });

    // Convert map to array and sort by most recent
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => {
        const dateA = new Date(b.last_message_at).getTime();
        const dateB = new Date(a.last_message_at).getTime();
        return dateA - dateB;
      });

    // Calculate stats
    const stats = {
      total_conversations: conversations.length,
      total_messages: logs.length,
      unique_sessions: new Set(logs.map(l => l.session_id).filter(Boolean)).size,
      domains: [...new Set(logs.map(l => l.domain).filter(Boolean))]
    };

    return NextResponse.json({
      conversations,
      stats,
      site_key: license.site_key
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      conversations: []
    }, { status: 500 });
  }
}