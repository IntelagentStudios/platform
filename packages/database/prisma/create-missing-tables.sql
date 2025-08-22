-- Create missing tables for multi-tenant setup

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    license_key VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'member',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

-- Create products table if not exists
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    base_price_pence INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    features JSONB DEFAULT '[]'::jsonb,
    schema_tables JSONB DEFAULT '[]'::jsonb,
    setup_required BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pricing_rules table if not exists
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_products INTEGER,
    promo_code VARCHAR(50) UNIQUE,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    discount_type VARCHAR(20) NOT NULL,
    discount_value INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_history table if not exists
CREATE TABLE IF NOT EXISTS public.billing_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    license_key VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount_pence INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    status VARCHAR(20) NOT NULL,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    billed_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

-- Create api_keys table if not exists
CREATE TABLE IF NOT EXISTS public.api_keys (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_preview VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '["read"]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_sessions table if not exists
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    license_key VARCHAR(20) NOT NULL,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (license_key) REFERENCES licenses(license_key)
);

-- Create pricing_rule_products junction table
CREATE TABLE IF NOT EXISTS public.pricing_rule_products (
    pricing_rule_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (pricing_rule_id, product_id),
    FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create applied_discounts table
CREATE TABLE IF NOT EXISTS public.applied_discounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    license_key VARCHAR(20) NOT NULL,
    pricing_rule_id VARCHAR(36) NOT NULL,
    discount_amount_pence INTEGER NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    FOREIGN KEY (license_key) REFERENCES licenses(license_key),
    FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_license ON users(license_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_billing_license ON billing_history(license_key);
CREATE INDEX IF NOT EXISTS idx_audit_license ON audit_logs(license_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- Insert default products
INSERT INTO products (name, slug, description, base_price_pence, currency, features, schema_tables)
VALUES 
    ('AI Chatbot', 'chatbot', 'Intelligent chatbot for customer engagement', 44900, 'GBP', 
     '["Unlimited conversations", "Custom training data", "Multi-language support", "Analytics dashboard", "API access"]'::jsonb,
     '["chatbots", "chatbot_conversations", "chatbot_messages", "chatbot_knowledge_base"]'::jsonb),
    ('Sales Agent', 'sales_agent', 'AI-powered sales automation and lead management', 64900, 'GBP',
     '["Lead scoring & qualification", "Automated outreach", "CRM integration", "Sales analytics", "Email & call automation"]'::jsonb,
     '["sales_agents", "sales_leads", "sales_interactions", "sales_campaigns"]'::jsonb),
    ('Setup Agent', 'setup_agent', 'Business automation and setup assistance', 44900, 'GBP',
     '["Project management", "Task automation", "Template library", "Documentation generation", "Team collaboration"]'::jsonb,
     '["setup_projects", "setup_tasks", "setup_templates", "setup_documentation"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Add columns to licenses if they don't exist
DO $$ 
BEGIN
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'currency') THEN
        ALTER TABLE licenses ADD COLUMN currency VARCHAR(3) DEFAULT 'GBP';
    END IF;
    
    -- Add is_pro column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'is_pro') THEN
        ALTER TABLE licenses ADD COLUMN is_pro BOOLEAN DEFAULT false;
    END IF;
    
    -- Add schema_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'schema_name') THEN
        ALTER TABLE licenses ADD COLUMN schema_name VARCHAR(100);
        UPDATE licenses SET schema_name = 'license_' || lower(replace(license_key, '-', '_')) WHERE schema_name IS NULL;
        ALTER TABLE licenses ALTER COLUMN schema_name SET NOT NULL;
        ALTER TABLE licenses ADD CONSTRAINT unique_schema_name UNIQUE (schema_name);
    END IF;
    
    -- Add pricing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'subtotal_pence') THEN
        ALTER TABLE licenses ADD COLUMN subtotal_pence INTEGER DEFAULT 0;
        ALTER TABLE licenses ADD COLUMN discount_pence INTEGER DEFAULT 0;
        ALTER TABLE licenses ADD COLUMN pro_addon_pence INTEGER DEFAULT 0;
        ALTER TABLE licenses ADD COLUMN total_pence INTEGER DEFAULT 0;
    END IF;
    
    -- Add domain columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'domain') THEN
        ALTER TABLE licenses ADD COLUMN domain VARCHAR(255);
        ALTER TABLE licenses ADD COLUMN domain_locked_at TIMESTAMPTZ;
    END IF;
    
    -- Add date columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'licenses' AND column_name = 'activated_at') THEN
        ALTER TABLE licenses ADD COLUMN activated_at TIMESTAMPTZ;
        ALTER TABLE licenses ADD COLUMN suspended_at TIMESTAMPTZ;
        ALTER TABLE licenses ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
END $$;