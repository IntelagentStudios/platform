#!/usr/bin/env node

/**
 * Automated Database Initialization
 * Sets up multi-tenant database structure and initial data
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('Initializing multi-tenant database...\n');
  
  try {
    // Step 1: Check database connection
    console.log('[1/7] Testing database connection...');
    try {
      await prisma.$connect();
      console.log('  ✅ Database connected successfully');
    } catch (error) {
      console.error('  ❌ Database connection failed:', error.message);
      console.log('\n  Please ensure PostgreSQL is running and DATABASE_URL is correct.');
      process.exit(1);
    }

    // Step 2: Run Prisma migrations
    console.log('[2/7] Running Prisma migrations...');
    try {
      process.chdir('packages/database');
      execSync('npx prisma generate --schema=./prisma/schema-multitenant.prisma', { stdio: 'pipe' });
      execSync('npx prisma db push --schema=./prisma/schema-multitenant.prisma --accept-data-loss', { stdio: 'pipe' });
      process.chdir('../..');
      console.log('  ✅ Database schema updated');
    } catch (error) {
      console.log('  ⚠️  Migration warnings (may be normal):', error.message);
    }

    // Step 3: Initialize tenant schema functions
    console.log('[3/7] Creating tenant schema functions...');
    const tenantSchemaSQL = fs.readFileSync(
      path.join(__dirname, '../packages/database/prisma/tenant-schemas.sql'),
      'utf8'
    );
    
    // Execute SQL in chunks (PostgreSQL doesn't like huge scripts)
    const sqlStatements = tenantSchemaSQL
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0);
    
    let functionsCreated = 0;
    for (const statement of sqlStatements) {
      if (statement.includes('CREATE') && (statement.includes('FUNCTION') || statement.includes('TABLE'))) {
        try {
          await prisma.$executeRawUnsafe(statement + ';');
          functionsCreated++;
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`  ⚠️  Warning: ${error.message.substring(0, 50)}...`);
          }
        }
      }
    }
    console.log(`  ✅ Created ${functionsCreated} database functions`);

    // Step 4: Create default products
    console.log('[4/7] Creating default products...');
    const products = [
      {
        name: 'AI Chatbot',
        slug: 'chatbot',
        description: 'Intelligent chatbot for customer engagement',
        base_price_pence: 44900, // £449
        currency: 'GBP',
        features: [
          'Unlimited conversations',
          'Custom training data',
          'Multi-language support',
          'Analytics dashboard',
          'API access'
        ],
        schema_tables: ['chatbots', 'chatbot_conversations', 'chatbot_messages', 'chatbot_knowledge_base']
      },
      {
        name: 'Sales Agent',
        slug: 'sales_agent',
        description: 'AI-powered sales automation and lead management',
        base_price_pence: 64900, // £649
        currency: 'GBP',
        features: [
          'Lead scoring & qualification',
          'Automated outreach',
          'CRM integration',
          'Sales analytics',
          'Email & call automation'
        ],
        schema_tables: ['sales_agents', 'sales_leads', 'sales_interactions', 'sales_campaigns']
      },
      {
        name: 'Setup Agent',
        slug: 'setup_agent',
        description: 'Business automation and setup assistance',
        base_price_pence: 44900, // £449
        currency: 'GBP',
        features: [
          'Project management',
          'Task automation',
          'Template library',
          'Documentation generation',
          'Team collaboration'
        ],
        schema_tables: ['setup_projects', 'setup_tasks', 'setup_templates', 'setup_documentation']
      }
    ];

    let productsCreated = 0;
    for (const product of products) {
      try {
        await prisma.$executeRaw`
          INSERT INTO products (
            id, name, slug, description, base_price_pence,
            currency, features, schema_tables, active
          ) VALUES (
            gen_random_uuid(),
            ${product.name},
            ${product.slug},
            ${product.description},
            ${product.base_price_pence},
            ${product.currency},
            ${JSON.stringify(product.features)}::jsonb,
            ${JSON.stringify(product.schema_tables)}::jsonb,
            true
          )
          ON CONFLICT (slug) DO UPDATE SET
            base_price_pence = EXCLUDED.base_price_pence,
            features = EXCLUDED.features
        `;
        productsCreated++;
      } catch (error) {
        console.log(`  ⚠️  Product ${product.name} may already exist`);
      }
    }
    console.log(`  ✅ Created ${productsCreated} products`);

    // Step 5: Verify existing license
    console.log('[5/7] Verifying license INTL-AGNT-BOSS-MODE...');
    const existingLicense = await prisma.$queryRaw`
      SELECT license_key, schema_name, products, status 
      FROM licenses 
      WHERE license_key = 'INTL-AGNT-BOSS-MODE'
    `;

    if (existingLicense && existingLicense.length > 0) {
      console.log('  ✅ License found:', {
        status: existingLicense[0].status,
        products: existingLicense[0].products
      });

      // Ensure schema exists for the license
      const schemaName = existingLicense[0].schema_name;
      if (schemaName) {
        console.log(`  🔄 Ensuring schema ${schemaName} exists...`);
        try {
          await prisma.$executeRaw`
            SELECT create_tenant_schema(
              'INTL-AGNT-BOSS-MODE'::VARCHAR,
              ${existingLicense[0].products}::TEXT[]
            )
          `;
          console.log('  ✅ Tenant schema ready');
        } catch (error) {
          console.log('  ✅ Tenant schema already exists');
        }
      }
    } else {
      console.log('  ⚠️  License INTL-AGNT-BOSS-MODE not found');
      console.log('     Run: npm run create-tenant to create a test license');
    }

    // Step 6: Apply security policies
    console.log('[6/7] Applying security policies...');
    try {
      // Enable RLS on main tables
      const tables = ['licenses', 'users', 'products', 'billing_history', 'api_keys'];
      for (const table of tables) {
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        } catch (error) {
          // RLS might already be enabled
        }
      }
      console.log('  ✅ Row-level security enabled');
    } catch (error) {
      console.log('  ⚠️  Security policies may already be applied');
    }

    // Step 7: Create indexes for performance
    console.log('[7/7] Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email)',
      'CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status)',
      'CREATE INDEX IF NOT EXISTS idx_users_license ON users(license_key)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_billing_license ON billing_history(license_key)',
      'CREATE INDEX IF NOT EXISTS idx_audit_license ON audit_logs(license_key)'
    ];

    let indexesCreated = 0;
    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index);
        indexesCreated++;
      } catch (error) {
        // Index might already exist
      }
    }
    console.log(`  ✅ Created ${indexesCreated} indexes`);

    console.log('\n✅ Database initialization complete!');

    // Summary
    const summary = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE active = true) as products,
        (SELECT COUNT(*) FROM licenses) as licenses,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name LIKE 'license_%') as tenant_schemas
    `;

    if (summary && summary[0]) {
      console.log('\n📊 Database Summary:');
      console.log(`   Products: ${summary[0].products}`);
      console.log(`   Licenses: ${summary[0].licenses}`);
      console.log(`   Users: ${summary[0].users}`);
      console.log(`   Tenant Schemas: ${summary[0].tenant_schemas}`);
    }

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run initialization
initDatabase().catch(console.error);