-- Create vector_documents table for storing chatbot knowledge base
CREATE TABLE IF NOT EXISTS vector_documents (
    id VARCHAR(255) PRIMARY KEY,
    license_key VARCHAR(255) NOT NULL,
    site_key VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_license_key FOREIGN KEY (license_key) 
        REFERENCES licenses(license_key) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_vector_docs_license_key ON vector_documents(license_key),
    INDEX idx_vector_docs_site_key ON vector_documents(site_key),
    INDEX idx_vector_docs_license_site ON vector_documents(license_key, site_key)
);

-- Create indexing_jobs table for tracking indexing progress
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_indexing_license_key FOREIGN KEY (license_key) 
        REFERENCES licenses(license_key) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_indexing_jobs_license_key ON indexing_jobs(license_key),
    INDEX idx_indexing_jobs_site_key ON indexing_jobs(site_key),
    INDEX idx_indexing_jobs_status ON indexing_jobs(status)
);

-- Enable Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE vector_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vector_documents
-- Policy: Users can only see their own documents based on license_key
CREATE POLICY vector_docs_tenant_isolation ON vector_documents
    FOR ALL
    USING (license_key = current_setting('app.current_license_key', true))
    WITH CHECK (license_key = current_setting('app.current_license_key', true));

-- Policy: Service accounts with proper role can access all documents (for admin)
CREATE POLICY vector_docs_service_account ON vector_documents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create RLS policies for indexing_jobs
CREATE POLICY indexing_jobs_tenant_isolation ON indexing_jobs
    FOR ALL
    USING (license_key = current_setting('app.current_license_key', true))
    WITH CHECK (license_key = current_setting('app.current_license_key', true));

CREATE POLICY indexing_jobs_service_account ON indexing_jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to set current license key for RLS
CREATE OR REPLACE FUNCTION set_current_license_key(p_license_key TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_license_key', p_license_key, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_vector_documents_updated_at
    BEFORE UPDATE ON vector_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add column to product_setups if not exists
ALTER TABLE product_setups 
ADD COLUMN IF NOT EXISTS indexing_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS indexing_completed_at TIMESTAMP WITH TIME ZONE;

-- Create composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_setups_indexing 
ON product_setups(site_key, indexing_completed);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON vector_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON indexing_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION set_current_license_key TO authenticated;

-- Create a view for easy access to indexed content stats
CREATE OR REPLACE VIEW vector_documents_stats AS
SELECT 
    license_key,
    site_key,
    COUNT(*) as document_count,
    AVG(LENGTH(content)) as avg_content_length,
    MAX(created_at) as last_indexed,
    MIN(created_at) as first_indexed
FROM vector_documents
GROUP BY license_key, site_key;

-- Enable RLS on the view
ALTER VIEW vector_documents_stats SET (security_invoker = true);

-- Add comments for documentation
COMMENT ON TABLE vector_documents IS 'Stores document content for vector search, isolated by license_key';
COMMENT ON TABLE indexing_jobs IS 'Tracks website indexing jobs for chatbot knowledge base';
COMMENT ON COLUMN vector_documents.license_key IS 'License key for tenant isolation - ensures data segregation';
COMMENT ON COLUMN vector_documents.site_key IS 'Unique site identifier for the chatbot instance';
COMMENT ON POLICY vector_docs_tenant_isolation ON vector_documents IS 'Ensures each tenant can only access their own vector documents';