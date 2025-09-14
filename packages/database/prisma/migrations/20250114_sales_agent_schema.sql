-- Sales Agent Database Schema
-- Designed to be modular and integrate with the platform architecture
-- Can work standalone or as part of the unified platform

-- Sales Campaigns Table
CREATE TABLE IF NOT EXISTS sales_campaigns (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  license_key VARCHAR(50) NOT NULL,
  product_key VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed, archived
  campaign_type VARCHAR(50) DEFAULT 'email', -- email, multi-channel, linkedin, cold-call

  -- Campaign Settings
  settings JSONB DEFAULT '{}', -- Flexible settings for different campaign types
  email_templates JSONB DEFAULT '[]', -- Array of email templates
  sequence_steps JSONB DEFAULT '[]', -- Automated sequence configuration

  -- Targeting
  target_criteria JSONB DEFAULT '{}', -- Industry, company size, location, etc.
  target_persona VARCHAR(255),

  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'UTC',
  send_schedule JSONB DEFAULT '{}', -- Days and times to send

  -- Metrics
  total_leads INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  replies_received INT DEFAULT 0,
  meetings_booked INT DEFAULT 0,
  deals_created INT DEFAULT 0,

  -- Integration with skills system
  skills_used TEXT[], -- Array of skill IDs used in this campaign
  workflow_id VARCHAR(36), -- Link to workflow if using skills matrix

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),

  CONSTRAINT fk_campaign_license FOREIGN KEY (license_key)
    REFERENCES licenses(license_key) ON DELETE CASCADE
);

-- Sales Leads Table
CREATE TABLE IF NOT EXISTS sales_leads (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  license_key VARCHAR(50) NOT NULL,
  campaign_id VARCHAR(36),

  -- Lead Information
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url VARCHAR(500),

  -- Company Information
  company_name VARCHAR(255),
  company_domain VARCHAR(255),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  job_title VARCHAR(255),
  department VARCHAR(100),

  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  timezone VARCHAR(50),

  -- Lead Status
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, engaged, qualified, unqualified, converted
  score INT DEFAULT 0, -- Lead score 0-100
  tags TEXT[],

  -- Engagement Metrics
  emails_sent INT DEFAULT 0,
  emails_opened INT DEFAULT 0,
  emails_clicked INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  last_engaged_at TIMESTAMPTZ,

  -- Custom Fields (for dynamic data)
  custom_fields JSONB DEFAULT '{}',

  -- Source
  source VARCHAR(100), -- manual, import, api, web-scrape, integration
  source_details JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_lead_license FOREIGN KEY (license_key)
    REFERENCES licenses(license_key) ON DELETE CASCADE,
  CONSTRAINT fk_lead_campaign FOREIGN KEY (campaign_id)
    REFERENCES sales_campaigns(id) ON DELETE SET NULL,
  UNIQUE(license_key, email)
);

-- Sales Activities Table (Track all interactions)
CREATE TABLE IF NOT EXISTS sales_activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  license_key VARCHAR(50) NOT NULL,
  campaign_id VARCHAR(36),
  lead_id VARCHAR(36),

  -- Activity Details
  activity_type VARCHAR(50) NOT NULL, -- email_sent, email_opened, email_clicked, reply_received, meeting_scheduled, call_made, linkedin_message
  subject VARCHAR(500),
  content TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- Store email headers, click URLs, etc.

  -- Results
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed
  error_message TEXT,

  -- Tracking
  skill_used VARCHAR(100), -- Which skill executed this activity
  workflow_step INT, -- Position in sequence

  performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_activity_license FOREIGN KEY (license_key)
    REFERENCES licenses(license_key) ON DELETE CASCADE,
  CONSTRAINT fk_activity_campaign FOREIGN KEY (campaign_id)
    REFERENCES sales_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_lead FOREIGN KEY (lead_id)
    REFERENCES sales_leads(id) ON DELETE CASCADE
);

-- Email Templates Table (Reusable across campaigns)
CREATE TABLE IF NOT EXISTS sales_email_templates (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  license_key VARCHAR(50) NOT NULL,

  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,

  -- Template Variables
  variables JSONB DEFAULT '[]', -- [{name: "first_name", type: "text", default: "there"}]

  -- Categorization
  template_type VARCHAR(50) DEFAULT 'outreach', -- outreach, follow-up, nurture, meeting-request
  tags TEXT[],

  -- Performance Metrics (aggregated)
  times_used INT DEFAULT 0,
  avg_open_rate DECIMAL(5,2),
  avg_click_rate DECIMAL(5,2),
  avg_reply_rate DECIMAL(5,2),

  -- AI Enhancement
  ai_optimized BOOLEAN DEFAULT FALSE,
  ai_suggestions JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_template_license FOREIGN KEY (license_key)
    REFERENCES licenses(license_key) ON DELETE CASCADE
);

-- Campaign Sequences Table (Multi-step automation)
CREATE TABLE IF NOT EXISTS sales_sequences (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  campaign_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NOT NULL,

  -- Sequence State
  current_step INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, stopped

  -- Tracking
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_step_at TIMESTAMPTZ,
  next_step_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  steps_completed INT DEFAULT 0,
  total_steps INT,

  -- Stop Conditions
  stop_reason VARCHAR(100), -- replied, meeting_booked, unsubscribed, manual_stop

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sequence_campaign FOREIGN KEY (campaign_id)
    REFERENCES sales_campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_sequence_lead FOREIGN KEY (lead_id)
    REFERENCES sales_leads(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, lead_id)
);

-- Integration Configs Table (For CRM, Email providers, etc.)
CREATE TABLE IF NOT EXISTS sales_integrations (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  license_key VARCHAR(50) NOT NULL,

  integration_type VARCHAR(50) NOT NULL, -- smtp, sendgrid, mailgun, salesforce, hubspot, pipedrive
  name VARCHAR(255) NOT NULL,

  -- Credentials (encrypted in production)
  config JSONB NOT NULL, -- API keys, SMTP settings, etc.

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,

  -- Usage
  default_for_campaigns BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_integration_license FOREIGN KEY (license_key)
    REFERENCES licenses(license_key) ON DELETE CASCADE,
  UNIQUE(license_key, integration_type, name)
);

-- Indexes for performance
CREATE INDEX idx_campaigns_license ON sales_campaigns(license_key);
CREATE INDEX idx_campaigns_status ON sales_campaigns(status);
CREATE INDEX idx_leads_license ON sales_leads(license_key);
CREATE INDEX idx_leads_campaign ON sales_leads(campaign_id);
CREATE INDEX idx_leads_email ON sales_leads(email);
CREATE INDEX idx_leads_status ON sales_leads(status);
CREATE INDEX idx_activities_license ON sales_activities(license_key);
CREATE INDEX idx_activities_campaign ON sales_activities(campaign_id);
CREATE INDEX idx_activities_lead ON sales_activities(lead_id);
CREATE INDEX idx_activities_type ON sales_activities(activity_type);
CREATE INDEX idx_activities_performed ON sales_activities(performed_at);
CREATE INDEX idx_templates_license ON sales_email_templates(license_key);
CREATE INDEX idx_sequences_campaign ON sales_sequences(campaign_id);
CREATE INDEX idx_sequences_lead ON sales_sequences(lead_id);
CREATE INDEX idx_sequences_status ON sales_sequences(status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_campaigns_updated_at BEFORE UPDATE ON sales_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_leads_updated_at BEFORE UPDATE ON sales_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_email_templates_updated_at BEFORE UPDATE ON sales_email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_sequences_updated_at BEFORE UPDATE ON sales_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();