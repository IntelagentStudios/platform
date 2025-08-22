#!/usr/bin/env node

/**
 * Script to create a new tenant schema
 * Usage: npm run create-tenant -- --email=user@example.com --products=chatbot,sales_agent
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `INTL-${segments.join('-')}`;
}

async function createTenant() {
  const args = process.argv.slice(2);
  const params = {};
  
  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      params[key] = value;
    }
  }

  if (!params.email) {
    console.error('Error: --email parameter is required');
    console.log('Usage: npm run create-tenant -- --email=user@example.com --products=chatbot,sales_agent');
    process.exit(1);
  }

  const email = params.email;
  const products = params.products ? params.products.split(',') : ['chatbot'];
  const domain = params.domain || null;
  const isPro = params.pro === 'true';

  try {
    console.log('Creating new tenant...');
    console.log(`Email: ${email}`);
    console.log(`Products: ${products.join(', ')}`);
    console.log(`Pro: ${isPro}`);
    if (domain) console.log(`Domain: ${domain}`);

    // Generate license key
    const licenseKey = params.license || generateLicenseKey();
    const schemaName = `license_${licenseKey.toLowerCase().replace(/-/g, '_')}`;

    // Calculate pricing in pence
    const productPricing = {
      chatbot: 44900,      // £449
      sales_agent: 64900,  // £649
      setup_agent: 44900,  // £449
      enrichment: 29900    // £299
    };

    let subtotalPence = 0;
    for (const product of products) {
      subtotalPence += productPricing[product] || 0;
    }

    const proAddonPence = isPro ? 49900 : 0; // £499
    const totalPence = subtotalPence + proAddonPence;

    // Create license record
    const license = await prisma.$executeRaw`
      INSERT INTO public.licenses (
        license_key,
        email,
        domain,
        schema_name,
        products,
        is_pro,
        subtotal_pence,
        pro_addon_pence,
        total_pence,
        status,
        created_at
      ) VALUES (
        ${licenseKey},
        ${email},
        ${domain},
        ${schemaName},
        ${JSON.stringify(products)}::jsonb,
        ${isPro},
        ${subtotalPence},
        ${proAddonPence},
        ${totalPence},
        'active',
        NOW()
      )
      RETURNING license_key
    `;

    console.log(`License created: ${licenseKey}`);

    // Create tenant schema with tables
    console.log('Creating tenant schema...');
    await prisma.$executeRaw`
      SELECT create_tenant_schema(${licenseKey}::VARCHAR, ${products}::TEXT[])
    `;

    console.log('Tenant schema created successfully!');
    console.log('\n=== License Details ===');
    console.log(`License Key: ${licenseKey}`);
    console.log(`Schema Name: ${schemaName}`);
    console.log(`Total Price: £${(totalPence / 100).toFixed(2)}`);
    console.log('\nProvide this license key to the customer for registration.');

  } catch (error) {
    console.error('Error creating tenant:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTenant().catch(console.error);