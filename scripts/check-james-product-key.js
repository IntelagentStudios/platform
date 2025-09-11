// Script to check James's actual product key in the database
// Run with: node scripts/check-james-product-key.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJamesProductKey() {
  try {
    console.log('Checking James\'s account (INTL-NW1S-QANW-2025)...\n');
    
    // Check license
    const license = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-NW1S-QANW-2025' }
    });
    
    if (license) {
      console.log('License found:');
      console.log('- Email:', license.email);
      console.log('- Domain:', license.domain);
      console.log('- Status:', license.status);
      console.log('- Products:', license.products);
      console.log('- Site Key:', license.site_key);
      console.log('');
    } else {
      console.log('License NOT found in database!\n');
    }
    
    // Check product keys
    const productKeys = await prisma.product_keys.findMany({
      where: { license_key: 'INTL-NW1S-QANW-2025' }
    });
    
    if (productKeys.length > 0) {
      console.log('Product keys found:');
      productKeys.forEach(pk => {
        console.log(`- Product: ${pk.product}`);
        console.log(`  Key: ${pk.product_key}`);
        console.log(`  Status: ${pk.status}`);
        console.log(`  Created: ${pk.created_at}`);
        console.log('');
      });
    } else {
      console.log('No product keys found for this license.\n');
      console.log('James needs a proper product key to be generated!\n');
      
      // Suggest creating one
      console.log('To create a product key for James, run this SQL:');
      console.log(`
INSERT INTO product_keys (product_key, license_key, product, status, created_at)
VALUES ('chat_test_${Math.random().toString(36).substr(2, 8)}', 'INTL-NW1S-QANW-2025', 'chatbot', 'active', NOW());
      `);
    }
    
    // Check if any conversations exist
    const conversations = await prisma.chatbot_logs.count({
      where: {
        OR: [
          { domain: 'testbusiness.com' },
          { product_key: 'chat_test_3f8a2c5d' }
        ]
      }
    });
    
    console.log(`\nConversations found: ${conversations}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJamesProductKey();