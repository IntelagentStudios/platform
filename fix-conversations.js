const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixConversations() {
  try {
    // Update all chatbot logs that have null site_key
    const updated = await prisma.chatbot_logs.updateMany({
      where: { 
        site_key: null,
        chatbot_response: { not: null }
      },
      data: {
        site_key: 'SITE-P2LRZFL2',
        domain: 'intelagentstudios.com'
      }
    });
    
    console.log(`✅ Updated ${updated.count} chatbot logs with your site_key`);
    
    // Now check the count
    const count = await prisma.chatbot_logs.count({
      where: { site_key: 'SITE-P2LRZFL2' }
    });
    
    console.log(`Total conversations with your site_key: ${count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConversations();