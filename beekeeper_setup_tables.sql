-- Complete SQL for Beekeeper Studio to create N8N Setup Agent tables
-- Run this entire script in your N8N's PostgreSQL database

-- 1. Drop tables if you want to start fresh (optional - comment out if you want to keep existing data)
-- DROP TABLE IF EXISTS setup_agent_logs CASCADE;
-- DROP TABLE IF EXISTS site_keys CASCADE;

-- 2. Create setup_agent_logs table
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

-- 3. Create site_keys table
CREATE TABLE IF NOT EXISTS site_keys (
    id SERIAL PRIMARY KEY,
    site_key VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create or update licenses table
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

-- 5. Add missing columns to licenses table if it already exists
DO $$ 
BEGIN
    -- Add used_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='used_at') THEN
        ALTER TABLE licenses ADD COLUMN used_at TIMESTAMP;
    END IF;
    
    -- Add domain column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='domain') THEN
        ALTER TABLE licenses ADD COLUMN domain VARCHAR(255);
    END IF;
    
    -- Add site_key column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='site_key') THEN
        ALTER TABLE licenses ADD COLUMN site_key VARCHAR(255);
    END IF;
    
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='licenses' AND column_name='status') THEN
        ALTER TABLE licenses ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_session_id ON setup_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_site_key ON setup_agent_logs(site_key);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_domain ON setup_agent_logs(domain);
CREATE INDEX IF NOT EXISTS idx_setup_agent_logs_timestamp ON setup_agent_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_site_keys_domain ON site_keys(domain);
CREATE INDEX IF NOT EXISTS idx_site_keys_status ON site_keys(status);

CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_domain ON licenses(domain);
CREATE INDEX IF NOT EXISTS idx_licenses_site_key ON licenses(site_key);

-- 7. Add some test data to verify tables work
-- Insert a test license (optional - comment out if not needed)
INSERT INTO licenses (license_key, license_type, status, user_email, user_name) 
VALUES ('TEST-LICENSE-KEY', 'pro_platform', 'active', 'test@example.com', 'Test User')
ON CONFLICT (license_key) DO NOTHING;

-- 8. Verify tables were created
SELECT 
    'setup_agent_logs' as table_name, 
    COUNT(*) as column_count,
    (SELECT COUNT(*) FROM setup_agent_logs) as row_count
FROM information_schema.columns 
WHERE table_name = 'setup_agent_logs'
GROUP BY table_name

UNION ALL

SELECT 
    'site_keys' as table_name, 
    COUNT(*) as column_count,
    (SELECT COUNT(*) FROM site_keys) as row_count
FROM information_schema.columns 
WHERE table_name = 'site_keys'
GROUP BY table_name

UNION ALL

SELECT 
    'licenses' as table_name, 
    COUNT(*) as column_count,
    (SELECT COUNT(*) FROM licenses) as row_count
FROM information_schema.columns 
WHERE table_name = 'licenses'
GROUP BY table_name;

-- 9. Show table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('setup_agent_logs', 'site_keys', 'licenses')
ORDER BY table_name, ordinal_position;