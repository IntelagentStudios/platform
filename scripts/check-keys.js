const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  try {
    // Check for product keys
    const productKeys = await prisma.product_keys.findMany({
      where: {
        product: 'chatbot'
      }
    });
    
    console.log('Chatbot Product Keys:', productKeys);
    
    // Check your license
    const license = await prisma.licenses.findFirst({
      where: {
        OR: [
          { email: 'admin@intelagentstudios.com' },
          { license_key: 'INTL-AGNT-BOSS-MODE' }
        ]
      }
    });
    
    console.log('\nYour License:', license);
    
    if (productKeys.length > 0) {
      console.log('\nUse this product_key in your test:', productKeys[0].product_key);
    } else if (license?.site_key) {
      console.log('\nNo product keys found. Use this site_key:', license.site_key);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();