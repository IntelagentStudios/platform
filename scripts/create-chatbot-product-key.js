// Script to create the chatbot product key directly
const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createProductKey() {
  try {
    console.log('Creating product key for chatbot...');
    
    // First ensure the license has chatbot in products array
    const license = await prisma.licenses.update({
      where: {
        license_key: 'INTL-AGNT-BOSS-MODE'
      },
      data: {
        products: ['chatbot', 'data_enrichment', 'sales_agent', 'setup_agent']
      }
    });
    
    console.log('Updated license products:', license.products);
    
    // Create the product key
    const productKey = await prisma.product_keys.create({
      data: {
        product_key: 'chat_9b3f7e8a2c5d1f0e',
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'chatbot',
        status: 'active',
        metadata: {
          domain: 'intelagentstudios.com'
        }
      }
    });
    
    console.log('Product key created successfully:', productKey);
    
    // Verify it was created
    const verify = await prisma.product_keys.findUnique({
      where: {
        product_key: 'chat_9b3f7e8a2c5d1f0e'
      }
    });
    
    if (verify) {
      console.log('\n✅ Success! Chatbot product key is now active.');
      console.log('Product Key:', verify.product_key);
      console.log('Status:', verify.status);
      console.log('License:', verify.license_key);
    }
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Product key already exists - updating status to active...');
      
      const updated = await prisma.product_keys.update({
        where: {
          product_key: 'chat_9b3f7e8a2c5d1f0e'
        },
        data: {
          status: 'active'
        }
      });
      
      console.log('✅ Product key activated:', updated.product_key);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Set DATABASE_URL from .env
require('dotenv').config();
createProductKey();