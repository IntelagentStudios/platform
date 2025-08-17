-- Migration: Add Teams, Financial Management, and Enterprise Features
-- This migration enhances the platform with team collaboration, financial tracking, and enterprise security

-- Create new schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS teams;
CREATE SCHEMA IF NOT EXISTS financial;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ==================== ORGANIZATIONS & TEAMS ====================

-- Create Organizations table
CREATE TABLE IF NOT EXISTS teams.organizations (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    
    -- Billing & Subscription
    stripe_customer_id VARCHAR(255) UNIQUE,
    subscription_id VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    billing_email VARCHAR(255),
    
    -- Financial
    mrr DECIMAL(10, 2) DEFAULT 0,
    ltv DECIMAL(10, 2) DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    credit_balance DECIMAL(10, 2) DEFAULT 0,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_subscription_status ON teams.organizations(subscription_status);
CREATE INDEX idx_organizations_created_at ON teams.organizations(created_at);

-- Create Teams table
CREATE TABLE IF NOT EXISTS teams.teams (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_teams_organization_id ON teams.teams(organization_id);

-- Create Users table
CREATE TABLE IF NOT EXISTS teams.users (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) REFERENCES teams.organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar TEXT,
    phone VARCHAR(50),
    
    -- Authentication
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- Two-Factor Auth
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    recovery_email VARCHAR(255),
    
    -- Status & Settings
    status VARCHAR(50) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'member',
    preferences JSONB DEFAULT '{}',
    last_active_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_organization_id ON teams.users(organization_id);
CREATE INDEX idx_users_email ON teams.users(email);
CREATE INDEX idx_users_status ON teams.users(status);

-- Create Team Members table
CREATE TABLE IF NOT EXISTS teams.team_members (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id VARCHAR(30) NOT NULL REFERENCES teams.teams(id) ON DELETE CASCADE,
    user_id VARCHAR(30) NOT NULL REFERENCES teams.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Timestamps
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON teams.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON teams.team_members(user_id);

-- ==================== ENHANCED LICENSE SYSTEM ====================

-- Add new columns to existing licenses table
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(30) REFERENCES teams.organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS used_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_limit INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 1073741824,
ADD COLUMN IF NOT EXISTS bandwidth_limit BIGINT DEFAULT 10737418240;

CREATE INDEX IF NOT EXISTS idx_licenses_organization_id ON public.licenses(organization_id);

-- ==================== FINANCIAL MANAGEMENT ====================

-- Create Invoices table
CREATE TABLE IF NOT EXISTS financial.invoices (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Billing Details
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50),
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_payment_intent VARCHAR(255),
    
    -- Details
    description TEXT,
    line_items JSONB NOT NULL,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_organization_id ON financial.invoices(organization_id);
CREATE INDEX idx_invoices_status ON financial.invoices(status);
CREATE INDEX idx_invoices_due_date ON financial.invoices(due_date);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS financial.transactions (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    invoice_id VARCHAR(30) REFERENCES financial.invoices(id) ON DELETE SET NULL,
    
    -- Transaction Details
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Payment Details
    payment_method VARCHAR(50),
    reference_id VARCHAR(255),
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_invoice_id ON financial.transactions(invoice_id);
CREATE INDEX idx_transactions_type ON financial.transactions(type);
CREATE INDEX idx_transactions_status ON financial.transactions(status);

-- Create Cost Tracking table
CREATE TABLE IF NOT EXISTS financial.cost_tracking (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE NOT NULL UNIQUE,
    
    -- Infrastructure Costs
    compute_cost DECIMAL(10, 2) DEFAULT 0,
    storage_cost DECIMAL(10, 2) DEFAULT 0,
    bandwidth_cost DECIMAL(10, 2) DEFAULT 0,
    database_cost DECIMAL(10, 2) DEFAULT 0,
    
    -- Service Costs
    email_cost DECIMAL(10, 2) DEFAULT 0,
    sms_cost DECIMAL(10, 2) DEFAULT 0,
    ai_api_cost DECIMAL(10, 2) DEFAULT 0,
    third_party_cost DECIMAL(10, 2) DEFAULT 0,
    
    -- Total
    total_cost DECIMAL(10, 2) NOT NULL,
    
    -- Metadata
    breakdown JSONB,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_tracking_date ON financial.cost_tracking(date);

-- ==================== USAGE & RESOURCE MANAGEMENT ====================

-- Create Usage Records table
CREATE TABLE IF NOT EXISTS analytics.usage_records (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    license_key VARCHAR(20) REFERENCES public.licenses(license_key) ON DELETE SET NULL,
    
    -- Usage Metrics
    api_calls INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    bandwidth_used BIGINT DEFAULT 0,
    compute_time INTEGER DEFAULT 0,
    database_queries INTEGER DEFAULT 0,
    websocket_minutes INTEGER DEFAULT 0,
    
    -- Product-Specific Usage
    chatbot_messages INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    enrichment_requests INTEGER DEFAULT 0,
    setup_agent_sessions INTEGER DEFAULT 0,
    
    -- Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Cost Calculation
    estimated_cost DECIMAL(10, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_records_org_period ON analytics.usage_records(organization_id, period_start);
CREATE INDEX idx_usage_records_license_key ON analytics.usage_records(license_key);

-- Create Usage Limits table
CREATE TABLE IF NOT EXISTS analytics.usage_limits (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tier VARCHAR(50) UNIQUE NOT NULL,
    
    -- Limits
    api_calls_per_day INTEGER NOT NULL,
    api_calls_per_minute INTEGER NOT NULL,
    storage_gb INTEGER NOT NULL,
    bandwidth_gb INTEGER NOT NULL,
    compute_hours INTEGER NOT NULL,
    team_members INTEGER NOT NULL,
    projects INTEGER NOT NULL,
    
    -- Features
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Overage Handling
    allow_overage BOOLEAN DEFAULT FALSE,
    overage_rate DECIMAL(10, 4) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default usage limits
INSERT INTO analytics.usage_limits (tier, api_calls_per_day, api_calls_per_minute, storage_gb, bandwidth_gb, compute_hours, team_members, projects, features) VALUES
('free', 1000, 10, 1, 10, 1, 3, 1, ARRAY['basic_support']),
('basic', 10000, 50, 10, 100, 10, 10, 5, ARRAY['email_support', 'api_access']),
('pro', 100000, 200, 100, 1000, 100, 50, 20, ARRAY['priority_support', 'api_access', 'webhooks', 'sso']),
('enterprise', 1000000, 1000, 1000, 10000, 1000, 500, 100, ARRAY['dedicated_support', 'api_access', 'webhooks', 'sso', 'custom_integrations'])
ON CONFLICT (tier) DO NOTHING;

-- ==================== SECURITY & COMPLIANCE ====================

-- Create Sessions table
CREATE TABLE IF NOT EXISTS security.sessions (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL REFERENCES teams.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    
    -- Session Details
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(255),
    device_type VARCHAR(50),
    
    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON security.sessions(user_id);
CREATE INDEX idx_sessions_token ON security.sessions(token);
CREATE INDEX idx_sessions_expires_at ON security.sessions(expires_at);

-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS security.audit_logs (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(30) REFERENCES teams.users(id) ON DELETE SET NULL,
    
    -- Audit Details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Changes
    old_value JSONB,
    new_value JSONB,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_org_created ON security.audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_user_id ON security.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON security.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON security.audit_logs(resource);

-- Create Security Settings table
CREATE TABLE IF NOT EXISTS security.security_settings (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) UNIQUE NOT NULL,
    
    -- Security Policies
    require_two_factor BOOLEAN DEFAULT FALSE,
    ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
    allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
    session_timeout INTEGER DEFAULT 1440,
    password_policy JSONB DEFAULT '{}',
    
    -- Compliance
    gdpr_enabled BOOLEAN DEFAULT FALSE,
    ccpa_enabled BOOLEAN DEFAULT FALSE,
    hipaa_enabled BOOLEAN DEFAULT FALSE,
    soc2_compliant BOOLEAN DEFAULT FALSE,
    data_retention_days INTEGER DEFAULT 90,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create API Keys table
CREATE TABLE IF NOT EXISTS security.api_keys (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(30) REFERENCES teams.users(id) ON DELETE SET NULL,
    
    -- Key Details
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    hashed_key TEXT NOT NULL,
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
    rate_limit INTEGER DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_organization_id ON security.api_keys(organization_id);
CREATE INDEX idx_api_keys_key ON security.api_keys(key);

-- Create Webhooks table
CREATE TABLE IF NOT EXISTS security.webhooks (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL REFERENCES teams.organizations(id) ON DELETE CASCADE,
    
    -- Webhook Details
    url TEXT NOT NULL,
    events TEXT[] DEFAULT ARRAY[]::TEXT[],
    secret TEXT NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_organization_id ON security.webhooks(organization_id);

-- ==================== COLLABORATION & ACTIVITY ====================

-- Create Projects table
CREATE TABLE IF NOT EXISTS teams.projects (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    team_id VARCHAR(30) NOT NULL REFERENCES teams.teams(id) ON DELETE CASCADE,
    
    -- Project Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_team_id ON teams.projects(team_id);

-- Create Activities table
CREATE TABLE IF NOT EXISTS teams.activities (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL REFERENCES teams.users(id) ON DELETE CASCADE,
    project_id VARCHAR(30) REFERENCES teams.projects(id) ON DELETE SET NULL,
    
    -- Activity Details
    type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255),
    target_id VARCHAR(255),
    
    -- Context
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_user_id ON teams.activities(user_id);
CREATE INDEX idx_activities_project_id ON teams.activities(project_id);
CREATE INDEX idx_activities_created_at ON teams.activities(created_at);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS teams.notifications (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL REFERENCES teams.users(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Context
    action_url TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON teams.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON teams.notifications(created_at);

-- ==================== AI INSIGHTS & ANALYTICS ====================

-- Create AI Insights table
CREATE TABLE IF NOT EXISTS analytics.ai_insights (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(30) NOT NULL,
    
    -- Insight Details
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Analysis
    confidence FLOAT DEFAULT 0,
    impact VARCHAR(50),
    recommendation TEXT,
    
    -- Data
    data_points JSONB NOT NULL,
    metadata JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    action_taken BOOLEAN DEFAULT FALSE,
    action_taken_at TIMESTAMP,
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_ai_insights_org_type ON analytics.ai_insights(organization_id, type);
CREATE INDEX idx_ai_insights_generated_at ON analytics.ai_insights(generated_at);

-- Create Performance Metrics table
CREATE TABLE IF NOT EXISTS analytics.performance_metrics (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    -- Metric Details
    name VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Context
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Time
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB
);

CREATE INDEX idx_performance_metrics_name_time ON analytics.performance_metrics(name, timestamp);
CREATE INDEX idx_performance_metrics_resource ON analytics.performance_metrics(resource);

-- ==================== UPDATE TRIGGERS ====================

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON teams.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON teams.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON teams.team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON financial.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON analytics.usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security.security_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON security.webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON teams.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== MIGRATION COMPLETION ====================

-- Add migration tracking
CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.migrations (name) VALUES ('001_teams_and_financial') ON CONFLICT (name) DO NOTHING;