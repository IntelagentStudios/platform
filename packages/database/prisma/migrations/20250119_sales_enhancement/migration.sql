-- Sales Enhancement Tables for Complete Sales Outreach Functionality

-- Email Tracking Events
CREATE TABLE IF NOT EXISTS sales_email_events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    email_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    campaign_id VARCHAR(36),
    event_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, replied, bounced, unsubscribed
    event_data JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    occurred_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_events_lead ON sales_email_events(lead_id);
CREATE INDEX idx_email_events_campaign ON sales_email_events(campaign_id);
CREATE INDEX idx_email_events_type ON sales_email_events(event_type);
CREATE INDEX idx_email_events_occurred ON sales_email_events(occurred_at);

-- Lead Scoring Rules
CREATE TABLE IF NOT EXISTS sales_scoring_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    license_key VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- behavior, demographic, firmographic, engagement
    conditions JSONB NOT NULL,
    score_adjustment INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE
);

CREATE INDEX idx_scoring_rules_license ON sales_scoring_rules(license_key);
CREATE INDEX idx_scoring_rules_active ON sales_scoring_rules(is_active);

-- Lead Score History
CREATE TABLE IF NOT EXISTS sales_lead_scores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    lead_id VARCHAR(36) NOT NULL,
    score INTEGER NOT NULL,
    previous_score INTEGER,
    score_components JSONB DEFAULT '{}',
    reason VARCHAR(500),
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE
);

CREATE INDEX idx_lead_scores_lead ON sales_lead_scores(lead_id);
CREATE INDEX idx_lead_scores_calculated ON sales_lead_scores(calculated_at);

-- Email Sending Queue
CREATE TABLE IF NOT EXISTS sales_email_queue (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    campaign_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36),
    sequence_id VARCHAR(36),
    step_number INTEGER,

    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    reply_to VARCHAR(255),

    personalization_data JSONB DEFAULT '{}',
    send_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sending, sent, failed, cancelled
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,

    message_id VARCHAR(255), -- External email provider message ID
    thread_id VARCHAR(255), -- For threading conversations

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,

    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES sales_email_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (sequence_id) REFERENCES sales_sequences(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_queue_campaign ON sales_email_queue(campaign_id);
CREATE INDEX idx_email_queue_lead ON sales_email_queue(lead_id);
CREATE INDEX idx_email_queue_status ON sales_email_queue(status);
CREATE INDEX idx_email_queue_send_at ON sales_email_queue(send_at);

-- A/B Testing for Templates
CREATE TABLE IF NOT EXISTS sales_ab_tests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    campaign_id VARCHAR(36) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL, -- subject, body, cta, send_time

    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,

    traffic_split DECIMAL(3,2) DEFAULT 0.50, -- Percentage to variant A

    status VARCHAR(50) DEFAULT 'running', -- draft, running, completed, cancelled
    winner VARCHAR(1), -- A or B

    metrics_a JSONB DEFAULT '{}',
    metrics_b JSONB DEFAULT '{}',

    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_ab_tests_campaign ON sales_ab_tests(campaign_id);
CREATE INDEX idx_ab_tests_status ON sales_ab_tests(status);

-- Conversation Threads
CREATE TABLE IF NOT EXISTS sales_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    lead_id VARCHAR(36) NOT NULL,
    campaign_id VARCHAR(36),
    thread_id VARCHAR(255) UNIQUE,

    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active', -- active, replied, meeting_scheduled, closed, lost
    sentiment VARCHAR(50), -- positive, neutral, negative

    first_message_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    messages_count INTEGER DEFAULT 0,

    tags TEXT[],
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE SET NULL
);

CREATE INDEX idx_conversations_lead ON sales_conversations(lead_id);
CREATE INDEX idx_conversations_campaign ON sales_conversations(campaign_id);
CREATE INDEX idx_conversations_status ON sales_conversations(status);
CREATE INDEX idx_conversations_thread ON sales_conversations(thread_id);

-- Individual Messages in Conversations
CREATE TABLE IF NOT EXISTS sales_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    conversation_id VARCHAR(36) NOT NULL,
    message_id VARCHAR(255) UNIQUE,

    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,

    subject VARCHAR(500),
    body TEXT,
    body_html TEXT,

    is_auto_reply BOOLEAN DEFAULT false,
    is_bounce BOOLEAN DEFAULT false,

    attachments JSONB DEFAULT '[]',
    headers JSONB DEFAULT '{}',

    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES sales_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation ON sales_messages(conversation_id);
CREATE INDEX idx_messages_direction ON sales_messages(direction);
CREATE INDEX idx_messages_sent_at ON sales_messages(sent_at);

-- Automation Triggers
CREATE TABLE IF NOT EXISTS sales_automation_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    license_key VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,

    trigger_type VARCHAR(50) NOT NULL, -- email_opened, link_clicked, replied, score_threshold, time_based
    trigger_conditions JSONB NOT NULL,

    action_type VARCHAR(50) NOT NULL, -- send_email, update_lead, create_task, notify_team, pause_sequence
    action_config JSONB NOT NULL,

    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,

    executions_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE
);

CREATE INDEX idx_automation_rules_license ON sales_automation_rules(license_key);
CREATE INDEX idx_automation_rules_active ON sales_automation_rules(is_active);
CREATE INDEX idx_automation_rules_trigger ON sales_automation_rules(trigger_type);

-- Tasks and Reminders
CREATE TABLE IF NOT EXISTS sales_tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    license_key VARCHAR(50) NOT NULL,
    lead_id VARCHAR(36),
    campaign_id VARCHAR(36),

    task_type VARCHAR(50) NOT NULL, -- follow_up, call, meeting, custom
    title VARCHAR(255) NOT NULL,
    description TEXT,

    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

    assigned_to VARCHAR(255),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_license ON sales_tasks(license_key);
CREATE INDEX idx_tasks_lead ON sales_tasks(lead_id);
CREATE INDEX idx_tasks_status ON sales_tasks(status);
CREATE INDEX idx_tasks_due ON sales_tasks(due_at);

-- Company Enrichment Data
CREATE TABLE IF NOT EXISTS sales_companies (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    license_key VARCHAR(50) NOT NULL,
    domain VARCHAR(255) NOT NULL,

    name VARCHAR(255),
    legal_name VARCHAR(255),
    description TEXT,

    industry VARCHAR(100),
    sub_industry VARCHAR(100),
    employee_count VARCHAR(50),
    revenue_range VARCHAR(50),

    founded_year INTEGER,
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(100),
    headquarters_country VARCHAR(100),

    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),

    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    facebook_url VARCHAR(500),

    technologies TEXT[],
    keywords TEXT[],

    enrichment_source VARCHAR(50),
    enriched_at TIMESTAMPTZ,

    custom_fields JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, domain)
);

CREATE INDEX idx_companies_license ON sales_companies(license_key);
CREATE INDEX idx_companies_domain ON sales_companies(domain);
CREATE INDEX idx_companies_industry ON sales_companies(industry);

-- Email Provider Configurations
CREATE TABLE IF NOT EXISTS sales_email_providers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    license_key VARCHAR(50) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- smtp, google, outlook, sendgrid, mailgun, ses

    name VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),

    config JSONB NOT NULL, -- Encrypted provider-specific settings

    daily_limit INTEGER DEFAULT 500,
    hourly_limit INTEGER DEFAULT 50,

    emails_sent_today INTEGER DEFAULT 0,
    emails_sent_this_hour INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,

    last_used_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (license_key) REFERENCES licenses(license_key) ON DELETE CASCADE,
    UNIQUE(license_key, from_email)
);

CREATE INDEX idx_email_providers_license ON sales_email_providers(license_key);
CREATE INDEX idx_email_providers_active ON sales_email_providers(is_active);

-- Meeting Scheduling
CREATE TABLE IF NOT EXISTS sales_meetings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
    lead_id VARCHAR(36) NOT NULL,
    campaign_id VARCHAR(36),

    meeting_type VARCHAR(50) NOT NULL, -- discovery, demo, follow_up, closing
    title VARCHAR(255) NOT NULL,
    description TEXT,

    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    timezone VARCHAR(50) DEFAULT 'UTC',

    location VARCHAR(500), -- Physical address or meeting link
    meeting_link VARCHAR(500),

    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show

    attendees JSONB DEFAULT '[]',
    notes TEXT,
    recording_url VARCHAR(500),

    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES sales_leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE SET NULL
);

CREATE INDEX idx_meetings_lead ON sales_meetings(lead_id);
CREATE INDEX idx_meetings_campaign ON sales_meetings(campaign_id);
CREATE INDEX idx_meetings_scheduled ON sales_meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON sales_meetings(status);