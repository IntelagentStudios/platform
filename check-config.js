const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfiguration() {
  try {
    // Check licenses table
    const license = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' }
    });
    
    console.log('License data:', license);
    
    if (license?.site_key) {
      console.log('\n✅ Site key found:', license.site_key);
      console.log('Domain:', license.domain);
    } else {
      console.log('\n❌ No site key found in license');
    }
    
    // Check product_configs table if it exists
    try {
      const configs = await prisma.product_configs.findMany({
        where: { license_key: 'INTL-AGNT-BOSS-MODE' }
      });
      console.log('\nProduct configs:', configs);
    } catch (e) {
      console.log('\nProduct configs table may not exist');
    }
    
    // Check chatbot_logs for any activity
    if (license?.site_key) {
      const logsCount = await prisma.chatbot_logs.count({
        where: { site_key: license.site_key }
      });
      console.log('\nChatbot logs count:', logsCount);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfiguration();