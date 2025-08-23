const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminLicense() {
  try {
    console.log('Checking for INTL-AGNT-BOSS-MODE license...\n');
    
    // Check if the admin license exists
    const adminLicense = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' }
    });

    if (adminLicense) {
      console.log('✅ Admin license found!');
      console.log('License details:');
      console.log('- Key:', adminLicense.license_key);
      console.log('- Email:', adminLicense.email || 'Not set');
      console.log('- Customer Name:', adminLicense.customer_name || 'Master Admin');
      console.log('- Status:', adminLicense.status);
      console.log('- Products:', adminLicense.products || []);
      console.log('- Plan:', adminLicense.plan || 'enterprise');
      console.log('- Created:', adminLicense.created_at);
      
      // Check if a user exists for this license
      const adminUser = await prisma.users.findUnique({
        where: { license_key: 'INTL-AGNT-BOSS-MODE' }
      });
      
      if (adminUser) {
        console.log('\n✅ Admin user account exists');
        console.log('- Email:', adminUser.email);
        console.log('- Name:', adminUser.name);
        console.log('- Created:', adminUser.created_at);
      } else {
        console.log('\n⚠️ No user account created yet for admin license');
        console.log('You will need to set a password on first login');
      }
    } else {
      console.log('❌ Admin license not found. Creating it now...\n');
      
      // Create the admin license
      const newLicense = await prisma.licenses.create({
        data: {
          license_key: 'INTL-AGNT-BOSS-MODE',
          email: 'admin@intelagentstudios.com',
          customer_name: 'Master Admin',
          products: ['chatbot', 'sales-agent', 'enrichment', 'setup-agent'],
          plan: 'enterprise',
          status: 'active',
          metadata: {
            is_master_admin: true,
            created_by: 'system'
          },
          created_at: new Date()
        }
      });
      
      console.log('✅ Admin license created successfully!');
      console.log('License Key: INTL-AGNT-BOSS-MODE');
      console.log('\nYou can now login to the admin portal with:');
      console.log('- License Key: INTL-AGNT-BOSS-MODE');
      console.log('- Password: (you will set this on first login)');
    }
    
    console.log('\n📝 Admin Portal URL: http://localhost:3001/login');
    console.log('📝 Customer Portal URL: http://localhost:3002/login');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminLicense();