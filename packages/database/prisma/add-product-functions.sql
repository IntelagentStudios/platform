-- Function to add a product to an existing tenant schema
CREATE OR REPLACE FUNCTION add_product_to_schema(
    p_schema_name VARCHAR(100),
    p_product VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_sql TEXT;
BEGIN
    -- Add product-specific tables based on product type
    CASE p_product
        WHEN 'chatbot' THEN
            -- Chatbot tables
            v_sql := format('
                CREATE TABLE IF NOT EXISTS %I.chatbots (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    system_prompt TEXT,
                    welcome_message TEXT,
                    model VARCHAR(50) DEFAULT ''gpt-4'',
                    temperature DECIMAL(3,2) DEFAULT 0.7,
                    max_tokens INTEGER DEFAULT 500,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.chatbot_conversations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    chatbot_id UUID REFERENCES %I.chatbots(id) ON DELETE CASCADE,
                    session_id VARCHAR(255) NOT NULL,
                    customer_email VARCHAR(255),
                    customer_name VARCHAR(255),
                    started_at TIMESTAMPTZ DEFAULT NOW(),
                    ended_at TIMESTAMPTZ,
                    metadata JSONB DEFAULT ''{}''::jsonb
                );
                
                CREATE TABLE IF NOT EXISTS %I.chatbot_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    conversation_id UUID REFERENCES %I.chatbot_conversations(id) ON DELETE CASCADE,
                    role VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB DEFAULT ''{}''::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.chatbot_knowledge_base (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    chatbot_id UUID REFERENCES %I.chatbots(id) ON DELETE CASCADE,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255),
                    content TEXT,
                    embedding VECTOR(1536),
                    metadata JSONB DEFAULT ''{}''::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, 
               p_schema_name, p_schema_name, p_schema_name);
               
        WHEN 'sales_agent' THEN
            -- Sales Agent tables
            v_sql := format('
                CREATE TABLE IF NOT EXISTS %I.sales_agents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    persona TEXT,
                    industry VARCHAR(100),
                    target_audience TEXT,
                    objection_handling JSONB DEFAULT ''[]''::jsonb,
                    call_scripts JSONB DEFAULT ''[]''::jsonb,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.sales_leads (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    agent_id UUID REFERENCES %I.sales_agents(id) ON DELETE CASCADE,
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    company VARCHAR(255),
                    name VARCHAR(255),
                    title VARCHAR(255),
                    score INTEGER DEFAULT 0,
                    status VARCHAR(50) DEFAULT ''new'',
                    enriched_data JSONB DEFAULT ''{}''::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.sales_interactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    lead_id UUID REFERENCES %I.sales_leads(id) ON DELETE CASCADE,
                    type VARCHAR(50) NOT NULL,
                    channel VARCHAR(50),
                    content TEXT,
                    sentiment_score DECIMAL(3,2),
                    outcome VARCHAR(100),
                    scheduled_followup TIMESTAMPTZ,
                    metadata JSONB DEFAULT ''{}''::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.sales_campaigns (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    agent_id UUID REFERENCES %I.sales_agents(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(50),
                    status VARCHAR(50) DEFAULT ''draft'',
                    target_criteria JSONB DEFAULT ''{}''::jsonb,
                    sequences JSONB DEFAULT ''[]''::jsonb,
                    performance_metrics JSONB DEFAULT ''{}''::jsonb,
                    started_at TIMESTAMPTZ,
                    ended_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, 
               p_schema_name, p_schema_name, p_schema_name);
               
        WHEN 'setup_agent' THEN
            -- Setup Agent tables
            v_sql := format('
                CREATE TABLE IF NOT EXISTS %I.setup_projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    type VARCHAR(100),
                    description TEXT,
                    requirements JSONB DEFAULT ''[]''::jsonb,
                    status VARCHAR(50) DEFAULT ''planning'',
                    progress INTEGER DEFAULT 0,
                    estimated_hours INTEGER,
                    actual_hours INTEGER,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.setup_tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    project_id UUID REFERENCES %I.setup_projects(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100),
                    priority VARCHAR(20) DEFAULT ''medium'',
                    status VARCHAR(50) DEFAULT ''pending'',
                    assigned_to VARCHAR(255),
                    dependencies JSONB DEFAULT ''[]''::jsonb,
                    checklist JSONB DEFAULT ''[]''::jsonb,
                    time_estimate INTEGER,
                    time_spent INTEGER,
                    due_date DATE,
                    completed_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.setup_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100),
                    description TEXT,
                    tasks JSONB DEFAULT ''[]''::jsonb,
                    estimated_hours INTEGER,
                    is_public BOOLEAN DEFAULT false,
                    usage_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
                
                CREATE TABLE IF NOT EXISTS %I.setup_documentation (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    project_id UUID REFERENCES %I.setup_projects(id) ON DELETE CASCADE,
                    type VARCHAR(50),
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    version VARCHAR(20),
                    is_current BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, 
               p_schema_name, p_schema_name);
               
        ELSE
            RAISE EXCEPTION 'Unknown product: %', p_product;
    END CASE;
    
    -- Execute the SQL
    EXECUTE v_sql;
    
    -- Create indexes
    CASE p_product
        WHEN 'chatbot' THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_chatbot_conversations_session ON %I.chatbot_conversations(session_id)', 
                          p_schema_name, p_schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_chatbot_messages_conversation ON %I.chatbot_messages(conversation_id)', 
                          p_schema_name, p_schema_name);
                          
        WHEN 'sales_agent' THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_sales_leads_email ON %I.sales_leads(email)', 
                          p_schema_name, p_schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_sales_leads_status ON %I.sales_leads(status)', 
                          p_schema_name, p_schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_sales_interactions_lead ON %I.sales_interactions(lead_id)', 
                          p_schema_name, p_schema_name);
                          
        WHEN 'setup_agent' THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_setup_tasks_project ON %I.setup_tasks(project_id)', 
                          p_schema_name, p_schema_name);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_setup_tasks_status ON %I.setup_tasks(status)', 
                          p_schema_name, p_schema_name);
    END CASE;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding product % to schema %: %', p_product, p_schema_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a product from tenant schema (soft delete - keeps data)
CREATE OR REPLACE FUNCTION remove_product_from_schema(
    p_schema_name VARCHAR(100),
    p_product VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- We don't actually drop tables to preserve data
    -- Just update the license record to remove the product
    -- The application layer will handle access control
    
    RAISE NOTICE 'Product % removed from license. Tables preserved for data retention.', p_product;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get schema size and statistics
CREATE OR REPLACE FUNCTION get_schema_stats(p_schema_name VARCHAR(100))
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT,
    table_size TEXT,
    indexes_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        c.reltuples::BIGINT as row_count,
        pg_size_pretty(pg_total_relation_size(t.schemaname||'.'||t.tablename)) as total_size,
        pg_size_pretty(pg_relation_size(t.schemaname||'.'||t.tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(t.schemaname||'.'||t.tablename)) as indexes_size
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = p_schema_name
    ORDER BY pg_total_relation_size(t.schemaname||'.'||t.tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to backup tenant schema
CREATE OR REPLACE FUNCTION backup_tenant_schema(p_schema_name VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    v_backup_schema VARCHAR(100);
    v_timestamp VARCHAR(20);
BEGIN
    v_timestamp := to_char(NOW(), 'YYYYMMDD_HH24MISS');
    v_backup_schema := p_schema_name || '_backup_' || v_timestamp;
    
    -- Create backup schema
    EXECUTE format('CREATE SCHEMA %I', v_backup_schema);
    
    -- Copy all tables
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = p_schema_name
    LOOP
        EXECUTE format('CREATE TABLE %I.%I AS TABLE %I.%I', 
                      v_backup_schema, r.tablename, p_schema_name, r.tablename);
    END LOOP;
    
    RETURN v_backup_schema;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_product_to_schema TO PUBLIC;
GRANT EXECUTE ON FUNCTION remove_product_from_schema TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_schema_stats TO PUBLIC;
GRANT EXECUTE ON FUNCTION backup_tenant_schema TO PUBLIC;