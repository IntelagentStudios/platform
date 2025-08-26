import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { MASTER_ADMIN_KEY } from '@/types/license';
import { getProductKey, updateProductKeyUsage } from '@/lib/product-keys-service';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function GET(request: NextRequest) {
  // Check for JWT auth token
  const authToken = cookies().get('auth_token');
  
  if (!authToken) {
    // Fall back to old auth for backward compatibility
    const oldAuth = cookies().get('auth');
    if (!oldAuth || oldAuth.value !== 'authenticated-user-harry') {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    // Use the default license key for old auth
    const licenseKey = 'INTL-AGNT-BOSS-MODE';
    return fetchConversations(licenseKey);
  }

  try {
    // Verify JWT and get user info
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ error: 'No license key found' }, { status: 403 });
    }
    
    return fetchConversations(licenseKey);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

/**
 * Correct data access pattern:
 * 1. Use license_key as primary filter (from JWT)
 * 2. Get site_key from license for chatbot-specific queries
 * 3. Query chatbot_logs using site_key
 * 
 * This ensures data is scoped to the account (license_key)
 * while using product-specific routing (site_key)
 */
async function fetchConversations(licenseKey: string) {
  try {
    // Check if master admin - they see all conversations
    const isMasterAdmin = licenseKey === MASTER_ADMIN_KEY;
    
    let logs;
    let siteKeyUsed: string | null = null;
    let licenseInfo = null;
    
    if (isMasterAdmin) {
      // Master admin sees all conversations across all accounts
      logs = await prisma.chatbot_logs.findMany({
        orderBy: { timestamp: 'desc' },
        take: 500 // More for admin
      });
      siteKeyUsed = 'MASTER_ADMIN_VIEW';
      
      // Get all licenses for admin stats
      const allLicenses = await prisma.licenses.findMany({
        where: { site_key: { not: null } },
        select: { license_key: true, site_key: true, domain: true }
      });
      
      licenseInfo = {
        total_accounts: allLicenses.length,
        active_sites: allLicenses.filter(l => l.site_key).length
      };
    } else {
      // Regular users: license_key → product_key → chatbot data
      // Step 1: Get the license information
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        select: { 
          products: true,
          domain: true,
          is_pro: true
        }
      });

      // Step 2: Check if chatbot product is available
      if (!license) {
        return NextResponse.json({ 
          error: 'License not found',
          conversations: []
        }, { status: 404 });
      }

      if (!license.products.includes('chatbot')) {
        return NextResponse.json({ 
          error: 'Chatbot product not purchased',
          conversations: [],
          message: 'Please purchase the chatbot product to access this feature'
        }, { status: 403 });
      }

      // Step 3: Get product key for chatbot (handles both new product_keys and legacy site_key)
      const chatbotKey = await getProductKey(licenseKey, 'chatbot');
      
      if (!chatbotKey) {
        return NextResponse.json({ 
          conversations: [],
          message: 'Chatbot not configured. Please complete setup first.',
          needs_configuration: true
        });
      }
      
      siteKeyUsed = chatbotKey;
      licenseInfo = {
        domain: license.domain,
        is_pro: license.is_pro,
        products: license.products,
        using_product_key: true
      };

      // Step 4: Fetch chatbot logs using the product key
      logs = await prisma.chatbot_logs.findMany({
        where: { site_key: chatbotKey }, // Uses product key (or legacy site_key)
        orderBy: { timestamp: 'desc' },
        take: 100 // Limit to last 100 messages
      });
      
      // Update usage timestamp for the product key
      await updateProductKeyUsage(chatbotKey);
    }

    // Group logs by conversation_id or session_id
    const conversationsMap = new Map();
    
    logs.forEach(log => {
      const conversationId = log.conversation_id || log.session_id || 'unknown';
      
      if (!conversationsMap.has(conversationId)) {
        conversationsMap.set(conversationId, {
          id: conversationId,
          session_id: log.session_id,
          domain: log.domain,
          site_key: log.site_key, // Include for debugging
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
      domains: [...new Set(logs.map(l => l.domain).filter(Boolean))],
      unique_site_keys: isMasterAdmin ? 
        [...new Set(logs.map(l => l.site_key).filter(Boolean))].length : 1
    };

    return NextResponse.json({
      conversations,
      stats,
      site_key: siteKeyUsed,
      license_key: isMasterAdmin ? 'MASTER_ADMIN' : licenseKey,
      license_info: licenseInfo,
      is_admin: isMasterAdmin,
      data_access_pattern: isMasterAdmin ? 
        'GLOBAL_ACCESS' : 
        'LICENSE_KEY → SITE_KEY → CHATBOT_DATA'
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      conversations: []
    }, { status: 500 });
  }
}