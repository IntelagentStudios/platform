const { prisma } = require('./packages/database/dist/index.js');

async function createTestLicense() {
  try {
    // Generate a proper license key format
    const licenseKey = 'INTL-8K3M-QB7X-2024';
    const friendEmail = 'friend@testbusiness.com';
    const businessName = 'Test Business Inc';
    
    console.log('Creating test license for friend\'s business...\n');
    
    // First check if license already exists
    const existing = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });
    
    if (existing) {
      console.log('License already exists. Updating it...');
      const updated = await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: {
          email: friendEmail,
          customer_name: businessName,
          products: ['chatbot'],
          status: 'active',
          plan: 'starter',
          used_at: null,  // Reset so it can be registered again
          site_key: null,  // Will be generated during setup
          domain: null
        }
      });
      console.log('License updated successfully!');
    } else {
      // Create new license
      const license = await prisma.licenses.create({
        data: {
          license_key: licenseKey,
          email: friendEmail,
          customer_name: businessName,
          products: ['chatbot'],
          status: 'active',
          plan: 'starter',
          created_at: new Date(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });
      console.log('License created successfully!');
    }
    
    console.log('\n=== TEST LICENSE DETAILS ===');
    console.log('License Key:', licenseKey);
    console.log('Email:', friendEmail);
    console.log('Business:', businessName);
    console.log('Products:', ['chatbot']);
    console.log('Plan:', 'starter');
    console.log('\nYour friend can now register at:');
    console.log('https://dashboard.intelagentstudios.com/register');
    console.log('\nThey will need to enter:');
    console.log('1. License Key:', licenseKey);
    console.log('2. Their email address');
    console.log('3. Create a password');
    
  } catch (error) {
    console.error('Error creating license:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLicense();