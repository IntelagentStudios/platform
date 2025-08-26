const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUniversalProductStatus() {
  try {
    console.log('=== Testing Universal Product Status Detection ===\n');
    
    // Get all active licenses
    const licenses = await prisma.licenses.findMany({
      where: { status: 'active' },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        products: true,
        site_key: true
      }
    });
    
    console.log(`Found ${licenses.length} active licenses\n`);
    
    for (const license of licenses) {
      console.log(`License: ${license.license_key}`);
      console.log(`Customer: ${license.customer_name || license.email}`);
      console.log(`Products in license: ${license.products?.join(', ') || 'none'}`);
      console.log(`Has legacy site_key: ${!!license.site_key}`);
      
      // Check product keys
      const productKeys = await prisma.product_keys.findMany({
        where: { 
          license_key: license.license_key,
          status: 'active'
        },
        select: {
          product: true,
          product_key: true,
          metadata: true
        }
      });
      
      console.log(`Product keys configured: ${productKeys.length}`);
      if (productKeys.length > 0) {
        productKeys.forEach(pk => {
          console.log(`  - ${pk.product}: ${pk.product_key.substring(0, 12)}...`);
        });
      }
      
      // Show expected dashboard display
      console.log('\nExpected Dashboard Display:');
      if (license.products && license.products.length > 0) {
        for (const product of license.products) {
          const hasKey = productKeys.some(pk => pk.product === product);
          const status = hasKey ? 'Active (Manage button)' : 'Ready to configure (Configure button)';
          console.log(`  - ${product}: ${status}`);
        }
      } else {
        console.log('  - No products in license');
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUniversalProductStatus();