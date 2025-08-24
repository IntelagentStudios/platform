const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConversations() {
  try {
    // Get the license
    const license = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' }
    });
    
    console.log('License site_key:', license?.site_key);
    console.log('License domain:', license?.domain);
    
    // Check all chatbot logs
    const allLogs = await prisma.chatbot_logs.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log('\n=== All Recent Chatbot Logs ===');
    console.log('Total logs found:', allLogs.length);
    
    if (allLogs.length > 0) {
      allLogs.forEach(log => {
        console.log('\n---');
        console.log('Site Key:', log.site_key);
        console.log('Domain:', log.domain);
        console.log('Session:', log.session_id);
        console.log('Customer:', log.customer_message);
        console.log('Response:', log.chatbot_response);
        console.log('Timestamp:', log.timestamp);
      });
    }
    
    // Check logs for your specific site_key
    if (license?.site_key) {
      const yourLogs = await prisma.chatbot_logs.findMany({
        where: { site_key: license.site_key },
        orderBy: { timestamp: 'desc' }
      });
      
      console.log('\n=== Logs for your site_key ===');
      console.log('Count:', yourLogs.length);
    }
    
    // Check logs for intelagentstudios domain
    const domainLogs = await prisma.chatbot_logs.findMany({
      where: { 
        OR: [
          { domain: { contains: 'intelagent' } },
          { domain: { contains: 'squarespace' } }
        ]
      },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('\n=== Logs for intelagent domains ===');
    console.log('Count:', domainLogs.length);
    if (domainLogs.length > 0) {
      console.log('Domains found:', [...new Set(domainLogs.map(l => l.domain))]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversations();