const { PrismaClient } = require('../packages/database');

const prisma = new PrismaClient();

async function setupProductKey() {
  try {
    const licenseKey = 'INTL-AGNT-BOSS-MODE';
    const productKey = 'PK-INTL-AGNT-BOSS-MODE';
    
    // Check if product key already exists
    const existing = await prisma.product_keys.findUnique({
      where: { product_key: productKey }
    });
    
    if (existing) {
      console.log('Product key already exists:', productKey);
      
      // Update to ensure it's active and has correct settings
      await prisma.product_keys.update({
        where: { product_key: productKey },
        data: {
          status: 'active',
          metadata: {
            settings: {
              primaryColor: '#0070f3',
              headerColor: '#0070f3',
              backgroundColor: '#ffffff',
              position: 'bottom-right',
              welcomeMessage: 'Hello! How can I help you today?',
              responseStyle: 'professional',
              playNotificationSound: true,
              showWelcomeMessage: true,
              collectEmail: false
            },
            lastUpdated: new Date().toISOString()
          }
        }
      });
      console.log('Product key updated with default settings');
    } else {
      // Create new product key
      await prisma.product_keys.create({
        data: {
          product_key: productKey,
          license_key: licenseKey,
          status: 'active',
          created_at: new Date(),
          expires_at: new Date('2025-12-31'),
          metadata: {
            settings: {
              primaryColor: '#0070f3',
              headerColor: '#0070f3',
              backgroundColor: '#ffffff',
              position: 'bottom-right',
              welcomeMessage: 'Hello! How can I help you today?',
              responseStyle: 'professional',
              playNotificationSound: true,
              showWelcomeMessage: true,
              collectEmail: false
            },
            lastUpdated: new Date().toISOString()
          }
        }
      });
      console.log('Product key created:', productKey);
    }
    
    // Create sample knowledge base entries if none exist
    const knowledgeCount = await prisma.custom_knowledge.count({
      where: { license_key: licenseKey }
    });
    
    if (knowledgeCount === 0) {
      console.log('Creating sample knowledge base entries...');
      
      await prisma.custom_knowledge.createMany({
        data: [
          {
            license_key: licenseKey,
            content: 'Intelagent Studios is a cutting-edge AI platform that provides intelligent automation solutions for businesses. We specialize in chatbot development, process automation, and AI-powered analytics.',
            knowledge_type: 'company',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            license_key: licenseKey,
            content: 'Our main products include: 1) AI Chatbot Widget - An intelligent customer support chatbot that can be embedded on any website. 2) Skills Orchestration Platform - A system for managing and executing various AI-powered skills. 3) Platform Intelligence - Advanced analytics and insights for your business operations.',
            knowledge_type: 'product',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            license_key: licenseKey,
            content: 'FAQ: Q: How do I integrate the chatbot on my website? A: Simply add the chatbot script tag to your website with your product key. Q: Can I customize the chatbot appearance? A: Yes, you can customize colors, position, and messages from the settings page. Q: Is my data secure? A: Yes, we use enterprise-grade encryption and security measures.',
            knowledge_type: 'faq',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      });
      console.log('Sample knowledge base entries created');
    } else {
      console.log(`Found ${knowledgeCount} existing knowledge base entries`);
    }
    
    console.log('Setup complete!');
  } catch (error) {
    console.error('Error setting up product key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductKey();