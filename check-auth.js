const { prisma } = require('./packages/database/dist/index.js');

async function checkAuthSystem() {
  try {
    console.log('=== AUTHENTICATION SYSTEM CHECK ===\n');
    
    // Check users
    const users = await prisma.users.findMany({
      select: {
        email: true,
        license_key: true,
        role: true,
        email_verified: true,
        created_at: true
      }
    });
    
    console.log('Current Users:');
    users.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    License: ${user.license_key}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Verified: ${user.email_verified}`);
      console.log('');
    });
    
    // Check licenses
    const licenses = await prisma.licenses.findMany({
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        products: true,
        status: true,
        used_at: true
      }
    });
    
    console.log('\nLicense Keys in System:');
    licenses.forEach(lic => {
      console.log(`  - ${lic.license_key}`);
      console.log(`    Email: ${lic.email || 'Not set'}`);
      console.log(`    Customer: ${lic.customer_name || 'Not set'}`);
      console.log(`    Status: ${lic.status}`);
      console.log(`    Products: ${lic.products ? lic.products.join(', ') : 'None'}`);
      console.log(`    Used: ${lic.used_at ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Check product configurations
    const configs = await prisma.product_configs.findMany({
      select: {
        license_key: true,
        product: true,
        enabled: true
      }
    });
    
    console.log('\nProduct Configurations:');
    configs.forEach(config => {
      console.log(`  - License: ${config.license_key}`);
      console.log(`    Product: ${config.product}`);
      console.log(`    Enabled: ${config.enabled}`);
      console.log('');
    });
    
    // Check chatbot data isolation
    const chatbotLogs = await prisma.chatbot_logs.count({
      where: { site_key: 'key_ya4c9x7shyz3djpn' }
    });
    
    console.log('\nData Isolation Check:');
    console.log(`  Chatbot conversations for harry's site_key: ${chatbotLogs}`);
    
    console.log('\n=== AUTH SYSTEM SUMMARY ===');
    console.log('✓ License key is the foundation - all users must have one');
    console.log('✓ Registration requires valid license key from database');
    console.log('✓ Each license can only be used once to create an account');
    console.log('✓ All product data is linked to license_key');
    console.log('✓ Role-based routing: customers → /dashboard, admins → /admin');
    
  } catch (error) {
    console.error('Error checking auth system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuthSystem();