const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkProductKeys() {
  try {
    // Check existing chatbot product keys
    const chatbotKeys = await prisma.product_keys.findMany({
      where: {
        product: 'chatbot',
        status: 'active'
      },
      select: {
        product_key: true,
        license_key: true,
        created_at: true
      }
    });

    console.log('Existing chatbot product keys:');
    console.log(chatbotKeys);

    // Check if your specific license has a chatbot key
    const yourLicense = await prisma.licenses.findFirst({
      where: {
        email: 'admin@intelagentstudios.com'
      },
      select: {
        license_key: true,
        site_key: true
      }
    });

    console.log('\nYour license info:');
    console.log(yourLicense);

    if (yourLicense) {
      // Check if this license has a chatbot product key
      const existingKey = await prisma.product_keys.findFirst({
        where: {
          license_key: yourLicense.license_key,
          product: 'chatbot'
        }
      });

      if (existingKey) {
        console.log('\nYour existing chatbot product key:');
        console.log(existingKey.product_key);
      } else {
        console.log('\nNo chatbot product key found for your license.');
        console.log('Use this product key in your tests:', yourLicense.site_key);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductKeys();