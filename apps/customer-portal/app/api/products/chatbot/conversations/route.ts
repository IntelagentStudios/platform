import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
// Master admin key constant
const MASTER_ADMIN_KEY = 'INTL-MSTR-ADMN-PASS';
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
    // Use the master admin license key for simple auth
    const licenseKey = 'INTL-MSTR-ADMN-PASS';
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
 * Access Control Pattern:
 * 1. Master Admin (INTL-ADMIN-KEY): Sees ALL conversations from all accounts
 * 2. Regular accounts: Only see conversations for product keys they OWN
 * 3. Product key ownership is determined by license_key in product_keys table
 * 
 * This ensures proper data isolation between accounts while allowing
 * master admin oversight of all customer interactions
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
        select: { license_key: true, domain: true }
      });
      
      // Count active product keys
      const activeProductKeys = await prisma.product_keys.count({
        where: { product: 'chatbot', status: 'active' }
      });
      
      licenseInfo = {
        total_accounts: allLicenses.length,
        active_sites: activeProductKeys
      };
    } else {
      // Auto-migrate: Create product key if it doesn't exist
      if (licenseKey === 'INTL-AGNT-BOSS-MODE') {
        await prisma.product_keys.upsert({
          where: {
            product_key: 'chat_9b3f7e8a2c5d1f0e'
          },
          update: {
            status: 'active'
          },
          create: {
            product_key: 'chat_9b3f7e8a2c5d1f0e',
            license_key: 'INTL-AGNT-BOSS-MODE',
            product: 'chatbot',
            status: 'active',
            metadata: {
              domain: 'intelagentstudios.com'
            }
          }
        });
      }

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

      // Step 3: Get product keys that this license OWNS
      const ownedProductKeys = await prisma.product_keys.findMany({
        where: {
          license_key: licenseKey,
          product: 'chatbot',
          status: 'active'
        },
        select: { product_key: true }
      });
      
      const chatbotKey = await getProductKey(licenseKey, 'chatbot');
      
      console.log('Fetching conversations for license:', licenseKey);
      console.log('Primary product key:', chatbotKey);
      console.log('Owned product keys:', ownedProductKeys.map(k => k.product_key));
      
      if (ownedProductKeys.length === 0) {
        return NextResponse.json({ 
          conversations: [],
          message: 'No chatbot product keys found. Please complete setup first.',
          needs_configuration: true
        });
      }
      
      siteKeyUsed = chatbotKey || ownedProductKeys[0].product_key;
      licenseInfo = {
        domain: license.domain,
        is_pro: license.is_pro,
        products: license.products,
        using_product_key: true,
        owned_keys_count: ownedProductKeys.length
      };

      // Step 4: Fetch chatbot logs ONLY for product keys this license OWNS
      const productKeysList = ownedProductKeys.map(k => k.product_key);
      logs = await prisma.chatbot_logs.findMany({
        where: { 
          product_key: {
            in: productKeysList // Only get logs from product keys owned by this license
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100 // Limit to last 100 messages
      });
      
      console.log('Fetching logs for owned product keys:', productKeysList);
      console.log('Found logs:', logs.length);
      
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
          product_key: log.product_key, // Include for debugging
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
      .map(conv => {
        // Sort messages within each conversation from oldest to newest
        conv.messages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB; // Ascending order (oldest first)
        });
        return conv;
      })
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
      unique_product_keys: isMasterAdmin ? 
        [...new Set(logs.map(l => l.product_key).filter(Boolean))].length : 
        [...new Set(logs.map(l => l.product_key).filter(Boolean))].length // Show actual count of owned keys in use
    };

    return NextResponse.json({
      conversations,
      stats,
      product_key: siteKeyUsed,
      license_key: isMasterAdmin ? 'MASTER_ADMIN' : licenseKey,
      license_info: licenseInfo,
      is_admin: isMasterAdmin,
      data_access_pattern: isMasterAdmin ? 
        'GLOBAL_ACCESS' : 
        'LICENSE_KEY → PRODUCT_KEY → CHATBOT_DATA'
    });
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      conversations: []
    }, { status: 500 });
  }
}