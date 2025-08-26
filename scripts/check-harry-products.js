const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHarryProducts() {
  try {
    // Find Harry's license
    const license = await prisma.licenses.findFirst({
      where: { 
        OR: [
          { email: 'harry@intelagentstudios.com' },
          { customer_name: 'Harry' }
        ]
      }
    });
    
    if (!license) {
      console.log('No license found for Harry');
      return;
    }
    
    console.log('License found:', {
      key: license.license_key,
      email: license.email,
      products: license.products,
      status: license.status
    });
    
    // Check for product keys
    const productKeys = await prisma.product_keys.findMany({
      where: { license_key: license.license_key }
    });
    
    console.log('\nProduct keys found:', productKeys.length);
    productKeys.forEach(pk => {
      console.log('- Product:', pk.product, '| Key:', pk.product_key, '| Status:', pk.status);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHarryProducts();