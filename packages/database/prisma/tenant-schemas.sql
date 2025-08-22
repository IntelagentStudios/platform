-- ==========================================
-- TENANT SCHEMA TEMPLATE
-- Each license gets its own schema with these tables
-- Schema naming: license_intl_xxxx_xxxx_xxxx
-- ==========================================

-- Function to create a new tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(
    p_license_key VARCHAR(20),
    p_products TEXT[]
)
RETURNS VOID AS $$
DECLARE
    v_schema_name VARCHAR(100);
BEGIN
    -- Generate schema name from license key
    v_schema_name := 'license_' || LOWER(REPLACE(p_license_key, '-', '_'));
    
    -- Create the schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);
    
    -- Set search path for table creation
    EXECUTE format('SET search_path = %I', v_schema_name);
    
    -- Create common tables for all tenants
    PERFORM create_common_tenant_tables(v_schema_name);
    
    -- Create product-specific tables
    IF 'chatbot' = ANY(p_products) THEN
        PERFORM create_chatbot_tables(v_schema_name);
    END IF;
    
    IF 'sales_agent' = ANY(p_products) THEN
        PERFORM create_sales_agent_tables(v_schema_name);
    END IF;
    
    IF 'setup_agent' = ANY(p_products) THEN
        PERFORM create_setup_agent_tables(v_schema_name);
    END IF;
    
    -- Set permissions
    PERFORM set_tenant_permissions(v_schema_name, p_license_key);
    
    -- Reset search path
    SET search_path = public;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMMON TABLES FOR ALL TENANTS
-- ==========================================

CREATE OR REPLACE FUNCTION create_common_tenant_tables(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path = %I', p_schema_name);
    
    -- Analytics Events
    CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB DEFAULT '{}',
        user_id VARCHAR(36),
        session_id VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_event_type (event_type),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
    );
    
    -- Custom Data (flexible storage)
    CREATE TABLE IF NOT EXISTS custom_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(entity_type, entity_id),
        INDEX idx_entity (entity_type, entity_id)
    );
    
    -- Files and Media
    CREATE TABLE IF NOT EXISTS media_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size BIGINT,
        storage_path TEXT,
        public_url TEXT,
        metadata JSONB DEFAULT '{}',
        uploaded_by VARCHAR(36),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_file_type (file_type),
        INDEX idx_uploaded_by (uploaded_by)
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CHATBOT SPECIFIC TABLES
-- ==========================================

CREATE OR REPLACE FUNCTION create_chatbot_tables(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path = %I', p_schema_name);
    
    -- Chatbot Configurations
    CREATE TABLE IF NOT EXISTS chatbot_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) DEFAULT 'Assistant',
        welcome_message TEXT,
        primary_color VARCHAR(7) DEFAULT '#667eea',
        position VARCHAR(20) DEFAULT 'bottom-right',
        avatar_url TEXT,
        active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Conversations
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id VARCHAR(100) NOT NULL,
        visitor_name VARCHAR(255),
        visitor_email VARCHAR(255),
        visitor_metadata JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active', -- active, closed, archived
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMPTZ,
        
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_status (status),
        INDEX idx_started_at (started_at)
    );
    
    -- Messages
    CREATE TABLE IF NOT EXISTS chatbot_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL, -- visitor, bot, agent
        sender_id VARCHAR(100),
        message_text TEXT,
        message_data JSONB DEFAULT '{}', -- attachments, quick replies, etc
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_created_at (created_at)
    );
    
    -- Training Data
    CREATE TABLE IF NOT EXISTS chatbot_training (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        keywords TEXT[],
        usage_count INT DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_category (category),
        INDEX idx_active (active)
    );
    
    -- Visitor Sessions
    CREATE TABLE IF NOT EXISTS chatbot_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id VARCHAR(100) NOT NULL,
        page_url TEXT,
        referrer TEXT,
        browser VARCHAR(100),
        os VARCHAR(100),
        device_type VARCHAR(20),
        ip_address VARCHAR(45),
        country VARCHAR(2),
        city VARCHAR(100),
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMPTZ,
        
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_started_at (started_at)
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SALES AGENT SPECIFIC TABLES
-- ==========================================

CREATE OR REPLACE FUNCTION create_sales_agent_tables(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path = %I', p_schema_name);
    
    -- Leads
    CREATE TABLE IF NOT EXISTS sales_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        company VARCHAR(255),
        job_title VARCHAR(255),
        phone VARCHAR(50),
        linkedin_url TEXT,
        
        -- Lead scoring
        score INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'new', -- new, contacted, qualified, converted, lost
        
        -- Enriched data
        enriched_data JSONB DEFAULT '{}',
        enriched_at TIMESTAMPTZ,
        
        -- Source
        source VARCHAR(50),
        source_details JSONB DEFAULT '{}',
        
        -- Metadata
        tags TEXT[],
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(email),
        INDEX idx_status (status),
        INDEX idx_score (score DESC),
        INDEX idx_created_at (created_at)
    );
    
    -- Campaigns
    CREATE TABLE IF NOT EXISTS sales_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) DEFAULT 'email', -- email, linkedin, multi-channel
        status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed
        
        -- Targeting
        target_criteria JSONB DEFAULT '{}',
        
        -- Schedule
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        daily_limit INT DEFAULT 50,
        timezone VARCHAR(50) DEFAULT 'UTC',
        working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
        
        -- Performance
        total_sent INT DEFAULT 0,
        total_opened INT DEFAULT 0,
        total_clicked INT DEFAULT 0,
        total_replied INT DEFAULT 0,
        total_converted INT DEFAULT 0,
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_status (status),
        INDEX idx_start_date (start_date)
    );
    
    -- Email Templates
    CREATE TABLE IF NOT EXISTS sales_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES sales_campaigns(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject TEXT,
        body_html TEXT,
        body_text TEXT,
        variables TEXT[], -- {{first_name}}, {{company}}, etc
        sequence_order INT DEFAULT 0,
        delay_days INT DEFAULT 0, -- Days to wait before sending
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_sequence_order (sequence_order)
    );
    
    -- Outreach Activities
    CREATE TABLE IF NOT EXISTS sales_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES sales_campaigns(id) ON DELETE SET NULL,
        template_id UUID REFERENCES sales_templates(id) ON DELETE SET NULL,
        
        activity_type VARCHAR(20) NOT NULL, -- email_sent, email_opened, email_clicked, replied, meeting_booked
        activity_data JSONB DEFAULT '{}',
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_lead_id (lead_id),
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_activity_type (activity_type),
        INDEX idx_created_at (created_at)
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SETUP AGENT SPECIFIC TABLES
-- ==========================================

CREATE OR REPLACE FUNCTION create_setup_agent_tables(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path = %I', p_schema_name);
    
    -- Forms/Wizards
    CREATE TABLE IF NOT EXISTS setup_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'wizard', -- wizard, form, survey
        
        -- Configuration
        steps JSONB DEFAULT '[]', -- Array of step configurations
        settings JSONB DEFAULT '{}',
        styling JSONB DEFAULT '{}',
        
        -- Completion tracking
        total_starts INT DEFAULT 0,
        total_completions INT DEFAULT 0,
        avg_completion_time INT, -- seconds
        
        -- Status
        status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
        published_at TIMESTAMPTZ,
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_status (status),
        INDEX idx_type (type)
    );
    
    -- Form Fields
    CREATE TABLE IF NOT EXISTS setup_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES setup_forms(id) ON DELETE CASCADE,
        step_number INT NOT NULL,
        field_order INT NOT NULL,
        
        -- Field configuration
        field_type VARCHAR(50) NOT NULL, -- text, email, select, checkbox, etc
        field_name VARCHAR(100) NOT NULL,
        field_label TEXT,
        field_placeholder TEXT,
        field_help_text TEXT,
        
        -- Validation
        required BOOLEAN DEFAULT false,
        validation_rules JSONB DEFAULT '{}',
        
        -- Options (for select, radio, checkbox)
        options JSONB DEFAULT '[]',
        
        -- Conditional logic
        conditions JSONB DEFAULT '{}',
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_form_id (form_id),
        INDEX idx_step_field (step_number, field_order)
    );
    
    -- Submissions
    CREATE TABLE IF NOT EXISTS setup_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES setup_forms(id) ON DELETE CASCADE,
        
        -- Submitter info
        submitter_id VARCHAR(100),
        submitter_email VARCHAR(255),
        submitter_name VARCHAR(255),
        
        -- Submission data
        form_data JSONB DEFAULT '{}',
        
        -- Progress tracking
        current_step INT DEFAULT 1,
        completed BOOLEAN DEFAULT false,
        completion_percentage INT DEFAULT 0,
        time_spent INT, -- seconds
        
        -- Metadata
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ,
        
        INDEX idx_form_id (form_id),
        INDEX idx_completed (completed),
        INDEX idx_started_at (started_at)
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- AI PRO FEATURES (WHEN ENABLED)
-- ==========================================

CREATE OR REPLACE FUNCTION create_ai_pro_tables(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path = %I', p_schema_name);
    
    -- AI Insights
    CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        insight_type VARCHAR(50) NOT NULL, -- prediction, recommendation, anomaly
        entity_type VARCHAR(50), -- lead, conversation, campaign
        entity_id VARCHAR(255),
        
        -- Insight data
        title TEXT NOT NULL,
        description TEXT,
        confidence_score DECIMAL(3,2), -- 0.00 to 1.00
        data JSONB DEFAULT '{}',
        
        -- Actions
        suggested_actions JSONB DEFAULT '[]',
        action_taken VARCHAR(100),
        action_taken_at TIMESTAMPTZ,
        
        -- Status
        status VARCHAR(20) DEFAULT 'active', -- active, dismissed, actioned
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ,
        
        INDEX idx_insight_type (insight_type),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    );
    
    -- AI Models Configuration
    CREATE TABLE IF NOT EXISTS ai_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_type VARCHAR(50) NOT NULL, -- sentiment, intent, scoring, prediction
        model_name VARCHAR(255) NOT NULL,
        model_version VARCHAR(20),
        
        -- Configuration
        parameters JSONB DEFAULT '{}',
        training_data JSONB DEFAULT '{}',
        
        -- Performance
        accuracy DECIMAL(5,2),
        last_trained_at TIMESTAMPTZ,
        training_samples INT,
        
        -- Status
        active BOOLEAN DEFAULT true,
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_model_type (model_type),
        INDEX idx_active (active)
    );
    
    -- AI Predictions Log
    CREATE TABLE IF NOT EXISTS ai_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
        
        -- Prediction details
        input_data JSONB NOT NULL,
        prediction JSONB NOT NULL,
        confidence DECIMAL(3,2),
        
        -- Feedback
        actual_outcome JSONB,
        feedback_score INT, -- 1-5 rating
        feedback_notes TEXT,
        
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_model_id (model_id),
        INDEX idx_created_at (created_at)
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERMISSIONS AND SECURITY
-- ==========================================

CREATE OR REPLACE FUNCTION set_tenant_permissions(
    p_schema_name VARCHAR,
    p_license_key VARCHAR
)
RETURNS VOID AS $$
BEGIN
    -- Create role for this tenant if not exists
    EXECUTE format('CREATE ROLE IF NOT EXISTS tenant_%s', REPLACE(p_license_key, '-', '_'));
    
    -- Grant usage on schema
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO tenant_%s', p_schema_name, REPLACE(p_license_key, '-', '_'));
    
    -- Grant all privileges on all tables in schema
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO tenant_%s', p_schema_name, REPLACE(p_license_key, '-', '_'));
    
    -- Grant all privileges on all sequences in schema
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO tenant_%s', p_schema_name, REPLACE(p_license_key, '-', '_'));
    
    -- Set default privileges for future tables
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO tenant_%s', p_schema_name, REPLACE(p_license_key, '-', '_'));
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO tenant_%s', p_schema_name, REPLACE(p_license_key, '-', '_'));
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- ROW LEVEL SECURITY FOR SHARED TABLES
-- ==========================================

-- Enable RLS on shared tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users table
CREATE POLICY users_isolation ON public.users
    USING (
        license_key = current_setting('app.current_license', true)::text 
        OR current_setting('app.is_admin', true)::boolean = true
        OR current_user = 'postgres'
    );

-- Policy for api_keys table
CREATE POLICY api_keys_isolation ON public.api_keys
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE license_key = current_setting('app.current_license', true)::text
        )
        OR current_setting('app.is_admin', true)::boolean = true
        OR current_user = 'postgres'
    );

-- Policy for user_sessions table
CREATE POLICY sessions_isolation ON public.user_sessions
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE license_key = current_setting('app.current_license', true)::text
        )
        OR current_setting('app.is_admin', true)::boolean = true
        OR current_user = 'postgres'
    );

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to generate license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS VARCHAR(20) AS $$
DECLARE
    v_key VARCHAR(20);
BEGIN
    -- Format: INTL-XXXX-XXXX-XXXX
    v_key := 'INTL-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' ||
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' ||
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    RETURN v_key;
END;
$$ LANGUAGE plpgsql;

-- Function to lock domain for a license
CREATE OR REPLACE FUNCTION lock_domain(
    p_license_key VARCHAR(20),
    p_domain VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.licenses
    SET domain = p_domain,
        domain_locked_at = CURRENT_TIMESTAMP
    WHERE license_key = p_license_key
    AND domain IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;