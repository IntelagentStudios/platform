/**
 * Script to check existing site_keys before migration
 * Shows how existing chatbot keys will be migrated to the new system
 */

import { prisma } from '../apps/customer-portal/lib/prisma';

async function checkExistingKeys() {
  console.log('🔍 Checking existing site_keys in licenses table...\n');

  try {
    // Find all licenses with site_keys
    const licensesWithSiteKeys = await prisma.licenses.findMany({
      where: {
        site_key: { not: null }
      },
      select: {
        license_key: true,
        site_key: true,
        products: true,
        domain: true,
        email: true
      }
    });

    console.log(`Found ${licensesWithSiteKeys.length} licenses with existing site_keys:\n`);

    for (const license of licensesWithSiteKeys) {
      console.log(`License: ${license.license_key}`);
      console.log(`  Email: ${license.email || 'N/A'}`);
      console.log(`  Current site_key: ${license.site_key}`);
      console.log(`  Products: ${license.products.join(', ') || 'None listed'}`);
      console.log(`  Domain: ${license.domain || 'Not set'}`);
      console.log(`  ✅ Will migrate to product_keys table as:`);
      console.log(`     product: 'chatbot'`);
      console.log(`     product_key: '${license.site_key}'`);
      console.log(`     status: 'active'`);
      console.log('');
    }

    // Check for any chatbot logs using these site_keys
    console.log('📊 Checking chatbot_logs table for data continuity...\n');

    for (const license of licensesWithSiteKeys) {
      if (license.site_key) {
        const logCount = await prisma.chatbot_logs.count({
          where: { site_key: license.site_key }
        });

        if (logCount > 0) {
          console.log(`✅ License ${license.license_key}: ${logCount} chatbot conversations`);
          console.log(`   These will continue to work after migration`);
        }
      }
    }

    console.log('\n📋 Migration Summary:');
    console.log('====================');
    console.log('1. Your existing site_keys will be preserved');
    console.log('2. They will be copied to the new product_keys table');
    console.log('3. Chatbot conversations will continue to work');
    console.log('4. The original site_key column will remain for backward compatibility');
    console.log('5. New products will get their own prefixed keys (sale_xxx, data_xxx, etc.)');

    console.log('\n🎯 Example after migration:');
    console.log('License INTL-AGNT-BOSS-MODE could have:');
    console.log('  - Chatbot: key_abcd1234efgh5678 (existing, migrated)');
    console.log('  - Sales Agent: sale_9i8h7g6f5e4d3c2b (new)');
    console.log('  - Data Enrichment: data_1a2b3c4d5e6f7g8h (new)');

  } catch (error) {
    console.error('Error checking keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkExistingKeys();