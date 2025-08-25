import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { TEST_USER_KEY, TEST_FRIEND_KEY } from '../types/license';

const prisma = new PrismaClient();

function generateSiteKey(): string {
  return `key_${crypto.randomBytes(8).toString('hex')}`;
}

async function setupTestAccounts() {
  console.log('🔧 Setting up test accounts...\n');
  
  try {
    // Setup main user account (Harry)
    console.log('Setting up main user account...');
    const userLicense = await prisma.licenses.findUnique({
      where: { license_key: TEST_USER_KEY }
    });

    let userSiteKey = userLicense?.site_key;
    if (!userSiteKey) {
      userSiteKey = generateSiteKey();
      console.log(`  Generated new site key for user: ${userSiteKey}`);
    } else {
      console.log(`  Using existing site key for user: ${userSiteKey}`);
    }

    await prisma.licenses.update({
      where: { license_key: TEST_USER_KEY },
      data: {
        products: ['chatbot', 'sales-agent', 'data-enrichment', 'setup-agent'],
        is_pro: true,
        site_key: userSiteKey,
        domain: 'harrys-business.com',
        status: 'active'
      }
    });
    console.log('  ✅ User account updated with all products and pro status');

    // Setup friend account
    console.log('\nSetting up friend account...');
    const friendLicense = await prisma.licenses.findUnique({
      where: { license_key: TEST_FRIEND_KEY }
    });

    let friendSiteKey = friendLicense?.site_key;
    if (!friendSiteKey) {
      friendSiteKey = generateSiteKey();
      // Ensure it's different from user's key
      while (friendSiteKey === userSiteKey) {
        friendSiteKey = generateSiteKey();
      }
      console.log(`  Generated new site key for friend: ${friendSiteKey}`);
    } else {
      console.log(`  Using existing site key for friend: ${friendSiteKey}`);
    }

    // Check for collision
    if (friendSiteKey === userSiteKey) {
      friendSiteKey = generateSiteKey();
      console.log(`  ⚠️  Collision detected! Generated new key: ${friendSiteKey}`);
    }

    await prisma.licenses.update({
      where: { license_key: TEST_FRIEND_KEY },
      data: {
        products: ['chatbot'],
        is_pro: false,
        site_key: friendSiteKey,
        domain: 'friends-shop.com',
        status: 'active'
      }
    });
    console.log('  ✅ Friend account updated with chatbot only and standard tier');

    // Create test chatbot logs for user
    console.log('\nCreating test conversations for user...');
    const userConversations = [
      {
        site_key: userSiteKey,
        session_id: `user_session_${Date.now()}_1`,
        customer_message: 'Hello, I need help with my pro account',
        chatbot_response: 'Hello! I can help you with your Pro Platform features.',
        domain: 'harrys-business.com',
        conversation_id: `conv_user_${Date.now()}_1`,
        timestamp: new Date(),
        created_at: new Date()
      },
      {
        site_key: userSiteKey,
        session_id: `user_session_${Date.now()}_1`,
        customer_message: 'What products do I have access to?',
        chatbot_response: 'You have access to all our products: Chatbot, Sales Agent, Data Enrichment, and Setup Agent.',
        domain: 'harrys-business.com',
        conversation_id: `conv_user_${Date.now()}_1`,
        timestamp: new Date(),
        created_at: new Date()
      },
      {
        site_key: userSiteKey,
        session_id: `user_session_${Date.now()}_2`,
        customer_message: 'How do I integrate the sales agent?',
        chatbot_response: 'The Sales Agent can be integrated through your dashboard. Go to Products > Sales Agent > Configure.',
        domain: 'harrys-business.com',
        conversation_id: `conv_user_${Date.now()}_2`,
        timestamp: new Date(),
        created_at: new Date()
      }
    ];

    for (const conv of userConversations) {
      await prisma.chatbot_logs.create({ data: conv });
    }
    console.log(`  ✅ Created ${userConversations.length} test conversations for user`);

    // Create test chatbot logs for friend
    console.log('\nCreating test conversations for friend...');
    const friendConversations = [
      {
        site_key: friendSiteKey,
        session_id: `friend_session_${Date.now()}_1`,
        customer_message: 'Hi, how do I install the chatbot?',
        chatbot_response: 'To install the chatbot, copy the embed code from your dashboard and paste it into your website.',
        domain: 'friends-shop.com',
        conversation_id: `conv_friend_${Date.now()}_1`,
        timestamp: new Date(),
        created_at: new Date()
      },
      {
        site_key: friendSiteKey,
        session_id: `friend_session_${Date.now()}_1`,
        customer_message: 'Is this working on my site?',
        chatbot_response: 'Yes! The chatbot is active on your domain: friends-shop.com',
        domain: 'friends-shop.com',
        conversation_id: `conv_friend_${Date.now()}_1`,
        timestamp: new Date(),
        created_at: new Date()
      }
    ];

    for (const conv of friendConversations) {
      await prisma.chatbot_logs.create({ data: conv });
    }
    console.log(`  ✅ Created ${friendConversations.length} test conversations for friend`);

    // Clean up any orphaned conversations (conversations with invalid site_keys)
    console.log('\nCleaning up orphaned conversations...');
    const validSiteKeys = await prisma.licenses.findMany({
      where: { site_key: { not: null } },
      select: { site_key: true }
    });

    const validKeys = validSiteKeys.map(l => l.site_key).filter(Boolean) as string[];
    
    if (validKeys.length > 0) {
      const deletedCount = await prisma.chatbot_logs.deleteMany({
        where: {
          AND: [
            { site_key: { not: null } },
            { site_key: { notIn: validKeys } }
          ]
        }
      });
      
      if (deletedCount.count > 0) {
        console.log(`  ✅ Cleaned up ${deletedCount.count} orphaned conversations`);
      } else {
        console.log('  ✅ No orphaned conversations found');
      }
    }

    // Final verification
    console.log('\n' + '='*50);
    console.log('📋 SETUP COMPLETE - SUMMARY');
    console.log('='*50);
    
    const finalUser = await prisma.licenses.findUnique({
      where: { license_key: TEST_USER_KEY }
    });
    
    const finalFriend = await prisma.licenses.findUnique({
      where: { license_key: TEST_FRIEND_KEY }
    });

    const userConvCount = await prisma.chatbot_logs.count({
      where: { site_key: userSiteKey }
    });

    const friendConvCount = await prisma.chatbot_logs.count({
      where: { site_key: friendSiteKey }
    });

    console.log('\nUser Account (Harry):');
    console.log(`  License: ${TEST_USER_KEY}`);
    console.log(`  Site Key: ${finalUser?.site_key}`);
    console.log(`  Products: ${finalUser?.products.join(', ')}`);
    console.log(`  Is Pro: ${finalUser?.is_pro}`);
    console.log(`  Domain: ${finalUser?.domain}`);
    console.log(`  Conversations: ${userConvCount}`);

    console.log('\nFriend Account:');
    console.log(`  License: ${TEST_FRIEND_KEY}`);
    console.log(`  Site Key: ${finalFriend?.site_key}`);
    console.log(`  Products: ${finalFriend?.products.join(', ')}`);
    console.log(`  Is Pro: ${finalFriend?.is_pro}`);
    console.log(`  Domain: ${finalFriend?.domain}`);
    console.log(`  Conversations: ${friendConvCount}`);

    console.log('\n✅ Test accounts are ready for isolation testing!');
    console.log('Run "npm run verify-isolation" to check data isolation\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestAccounts();