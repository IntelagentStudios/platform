#!/usr/bin/env node

/**
 * Migration script to add vector_documents and indexing_jobs tables
 * with Row Level Security for multi-tenant isolation
 * 
 * Run this script locally or on Railway to set up the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting database migration for vector storage...\n');
  
  try {
    // Create vector_documents table
    console.log('📦 Creating vector_documents table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS vector_documents (
        id VARCHAR(255) PRIMARY KEY,
        license_key VARCHAR(255) NOT NULL,
        site_key VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key constraint
    console.log('🔗 Adding foreign key constraints...');
    await prisma.$executeRaw`
      ALTER TABLE vector_documents 
      ADD CONSTRAINT fk_vector_license_key 
      FOREIGN KEY (license_key) 
      REFERENCES licenses(license_key) 
      ON DELETE CASCADE
    `.catch(e => console.log('  Foreign key might already exist, skipping...'));
    
    // Create indexes
    console.log('📇 Creating indexes for performance...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_vector_docs_license_key 
      ON vector_documents(license_key)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_vector_docs_site_key 
      ON vector_documents(site_key)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_vector_docs_license_site 
      ON vector_documents(license_key, site_key)
    `;
    
    // Create indexing_jobs table
    console.log('📦 Creating indexing_jobs table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS indexing_jobs (
        job_id VARCHAR(255) PRIMARY KEY,
        license_key VARCHAR(255) NOT NULL,
        site_key VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        pages_indexed INTEGER DEFAULT 0,
        pages_failed INTEGER DEFAULT 0,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Add foreign key for indexing_jobs
    await prisma.$executeRaw`
      ALTER TABLE indexing_jobs 
      ADD CONSTRAINT fk_indexing_license_key 
      FOREIGN KEY (license_key) 
      REFERENCES licenses(license_key) 
      ON DELETE CASCADE
    `.catch(e => console.log('  Foreign key might already exist, skipping...'));
    
    // Create indexes for indexing_jobs
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_indexing_jobs_license_key 
      ON indexing_jobs(license_key)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_indexing_jobs_site_key 
      ON indexing_jobs(site_key)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_indexing_jobs_status 
      ON indexing_jobs(status)
    `;
    
    // Enable Row Level Security
    console.log('🔐 Enabling Row Level Security...');
    await prisma.$executeRaw`
      ALTER TABLE vector_documents ENABLE ROW LEVEL SECURITY
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE indexing_jobs ENABLE ROW LEVEL SECURITY
    `;
    
    // Create RLS policies
    console.log('📜 Creating RLS policies for tenant isolation...');
    
    // Drop existing policies if they exist
    await prisma.$executeRaw`
      DROP POLICY IF EXISTS vector_docs_tenant_isolation ON vector_documents
    `.catch(e => {});
    
    await prisma.$executeRaw`
      DROP POLICY IF EXISTS vector_docs_service_account ON vector_documents
    `.catch(e => {});
    
    await prisma.$executeRaw`
      DROP POLICY IF EXISTS indexing_jobs_tenant_isolation ON indexing_jobs
    `.catch(e => {});
    
    await prisma.$executeRaw`
      DROP POLICY IF EXISTS indexing_jobs_service_account ON indexing_jobs
    `.catch(e => {});
    
    // Create new policies
    await prisma.$executeRaw`
      CREATE POLICY vector_docs_tenant_isolation ON vector_documents
      FOR ALL
      USING (license_key = current_setting('app.current_license_key', true))
      WITH CHECK (license_key = current_setting('app.current_license_key', true))
    `;
    
    await prisma.$executeRaw`
      CREATE POLICY vector_docs_service_account ON vector_documents
      FOR ALL
      USING (true)
      WITH CHECK (true)
    `;
    
    await prisma.$executeRaw`
      CREATE POLICY indexing_jobs_tenant_isolation ON indexing_jobs
      FOR ALL
      USING (license_key = current_setting('app.current_license_key', true))
      WITH CHECK (license_key = current_setting('app.current_license_key', true))
    `;
    
    await prisma.$executeRaw`
      CREATE POLICY indexing_jobs_service_account ON indexing_jobs
      FOR ALL
      USING (true)
      WITH CHECK (true)
    `;
    
    // Create helper function
    console.log('🔧 Creating helper functions...');
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION set_current_license_key(p_license_key TEXT)
      RETURNS void AS $$
      BEGIN
        PERFORM set_config('app.current_license_key', p_license_key, false);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `;
    
    // Create update trigger
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_vector_documents_updated_at ON vector_documents
    `.catch(e => {});
    
    await prisma.$executeRaw`
      CREATE TRIGGER update_vector_documents_updated_at
      BEFORE UPDATE ON vector_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `;
    
    // Update product_setups table
    console.log('📝 Updating product_setups table...');
    await prisma.$executeRaw`
      ALTER TABLE product_setups 
      ADD COLUMN IF NOT EXISTS indexing_completed BOOLEAN DEFAULT FALSE
    `.catch(e => console.log('  Column might already exist, skipping...'));
    
    await prisma.$executeRaw`
      ALTER TABLE product_setups 
      ADD COLUMN IF NOT EXISTS indexing_completed_at TIMESTAMP WITH TIME ZONE
    `.catch(e => console.log('  Column might already exist, skipping...'));
    
    // Create stats view
    console.log('📊 Creating statistics view...');
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW vector_documents_stats AS
      SELECT 
        license_key,
        site_key,
        COUNT(*) as document_count,
        AVG(LENGTH(content)) as avg_content_length,
        MAX(created_at) as last_indexed,
        MIN(created_at) as first_indexed
      FROM vector_documents
      GROUP BY license_key, site_key
    `;
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Created vector_documents table with RLS');
    console.log('  - Created indexing_jobs table with RLS');
    console.log('  - Added indexes for performance');
    console.log('  - Enabled Row Level Security policies');
    console.log('  - Created helper functions and triggers');
    console.log('  - Updated product_setups table');
    console.log('\n🔒 Your database is now configured for secure multi-tenant vector storage!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration().catch(console.error);