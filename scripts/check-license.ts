import { prisma } from '@intelagent/database';

async function checkLicense() {
  try {
    // Check if INTL-AGNT-BOSS-MODE exists
    const license = await prisma.licenses.findUnique({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' }
    });

    if (license) {
      console.log('License found:', {
        license_key: license.license_key,
        status: license.status,
        email: license.email,
        customer_name: license.customer_name,
        used_at: license.used_at,
        created_at: license.created_at
      });

      // Check if there's already a user with this license
      const user = await prisma.users.findFirst({
        where: { license_key: 'INTL-AGNT-BOSS-MODE' }
      });

      if (user) {
        console.log('\nUser already exists with this license:', {
          email: user.email,
          name: user.name,
          created_at: user.created_at
        });
      } else {
        console.log('\nNo user registered with this license yet.');
      }
    } else {
      console.log('License INTL-AGNT-BOSS-MODE not found in database.');
      console.log('\nCreating INTL-AGNT-BOSS-MODE license...');
      
      // Create the license
      const newLicense = await prisma.licenses.create({
        data: {
          license_key: 'INTL-AGNT-BOSS-MODE',
          customer_name: 'Master Admin',
          email: 'admin@intelagentstudios.com',
          products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
          plan: 'enterprise',
          status: 'active',
          used_at: null
        }
      });
      
      console.log('License created successfully:', newLicense);
    }

    // Show all licenses for debugging
    const allLicenses = await prisma.licenses.findMany();
    console.log('\nAll licenses in database:', allLicenses.length);
    allLicenses.forEach(l => {
      console.log(`- ${l.license_key} (${l.status})`);
    });

  } catch (error) {
    console.error('Error checking license:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLicense();