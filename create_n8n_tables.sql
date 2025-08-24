-- Complete SQL commands to create/update tables for N8N workflow
-- Run these commands in order

-- 1. Create setup_agent_logs table
CREATE TABLE IF NOT EXISTS setup_agent_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT,
    agent_response TEXT,
    site_key VARCHAR(255),
    domain VARCHAR(255),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for setup_agent_logs
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_session_id ON setup_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_site_key ON setup_agent_logs(site_key);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_domain ON setup_agent_logs(domain);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_timestamp ON setup_agent_logs(timestamp);

-- 2. Create site_keys table
CREATE TABLE IF NOT EXISTS site_keys (
    id SERIAL PRIMARY KEY,
    site_key VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for site_keys
CREATE INDEX IF NOT EXISTS idx_site_keys_domain ON site_keys(domain);
CREATE INDEX IF NOT EXISTS idx_site_keys_status ON site_keys(status);
CREATE INDEX IF NOT EXISTS idx_site_keys_plan ON site_keys(plan);

-- 3. Check if licenses table exists, if not create it
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    used_at TIMESTAMP,
    domain VARCHAR(255),
    site_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    user_email VARCHAR(255),
    user_name VARCHAR(255)
);

-- 4. Add missing columns to licenses table if they don't exist
-- These statements will only add columns if they don't already exist
DO $$ 
BEGIN
    -- Add used_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='used_at') THEN
        ALTER TABLE licenses ADD COLUMN used_at TIMESTAMP;
    END IF;
    
    -- Add domain column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='domain') THEN
        ALTER TABLE licenses ADD COLUMN domain VARCHAR(255);
    END IF;
    
    -- Add site_key column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='site_key') THEN
        ALTER TABLE licenses ADD COLUMN site_key VARCHAR(255);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='status') THEN
        ALTER TABLE licenses ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- Create indexes for licenses table
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_domain ON licenses(domain);
CREATE INDEX IF NOT EXISTS idx_licenses_site_key ON licenses(site_key);
CREATE INDEX IF NOT EXISTS idx_licenses_used_at ON licenses(used_at);

-- 5. Add constraints
-- Add unique constraint on site_key in site_keys table (if not exists)
ALTER TABLE site_keys DROP CONSTRAINT IF EXISTS site_keys_site_key_unique;
ALTER TABLE site_keys ADD CONSTRAINT site_keys_site_key_unique UNIQUE (site_key);

-- Add unique constraint on license_key in licenses table (if not exists)
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_license_key_unique;
ALTER TABLE licenses ADD CONSTRAINT licenses_license_key_unique UNIQUE (license_key);

-- 6. Create trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to site_keys table
DROP TRIGGER IF EXISTS update_site_keys_updated_at ON site_keys;
CREATE TRIGGER update_site_keys_updated_at 
    BEFORE UPDATE ON site_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to licenses table
DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
CREATE TRIGGER update_licenses_updated_at 
    BEFORE UPDATE ON licenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant permissions (adjust user as needed)
-- Replace 'your_app_user' with your actual database user
-- GRANT ALL PRIVILEGES ON TABLE setup_agent_logs TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE site_keys TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE licenses TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- 8. Verify tables were created successfully
SELECT 'setup_agent_logs' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'setup_agent_logs'
UNION ALL
SELECT 'site_keys' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'site_keys'
UNION ALL
SELECT 'licenses' as table_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'licenses';

-- 9. Show table structures for verification
-- \d setup_agent_logs
-- \d site_keys
-- \d licenses