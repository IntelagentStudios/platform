const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLicense() {
  try {
    // Generate a site key if none exists
    const siteKey = 'SITE-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Update the license with a site key
    const updated = await prisma.licenses.update({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' },
      data: {
        site_key: siteKey,
        domain: 'intelagentstudios.com'
      }
    });
    
    console.log('✅ License updated successfully!');
    console.log('Site Key:', updated.site_key);
    console.log('Domain:', updated.domain);
    
    // Also create a product_config entry
    await prisma.product_configs.upsert({
      where: {
        license_key_product: {
          license_key: 'INTL-AGNT-BOSS-MODE',
          product: 'chatbot'
        }
      },
      update: {
        config: {
          configured: true,
          site_key: siteKey,
          domain: 'intelagentstudios.com',
          created_at: new Date().toISOString()
        },
        enabled: true
      },
      create: {
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'chatbot',
        config: {
          configured: true,
          site_key: siteKey,
          domain: 'intelagentstudios.com',
          created_at: new Date().toISOString()
        },
        enabled: true
      }
    });
    
    console.log('✅ Product configuration saved!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLicense();