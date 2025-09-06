-- Create comprehensive skill execution logging tables

-- Main skill execution log table
CREATE TABLE IF NOT EXISTS skill_executions (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100),
    license_key VARCHAR(255),
    product_key VARCHAR(255),
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    
    -- Request details
    input_params JSONB,
    context JSONB,
    
    -- Execution details
    status VARCHAR(50) NOT NULL, -- 'started', 'success', 'failed', 'timeout'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Response details
    output_data JSONB,
    error_message TEXT,
    error_stack TEXT,
    
    -- Metrics
    tokens_used INTEGER,
    api_calls_made INTEGER,
    external_requests JSONB, -- Array of external API calls made
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_skill_executions_license (license_key),
    INDEX idx_skill_executions_product (product_key),
    INDEX idx_skill_executions_skill (skill_name),
    INDEX idx_skill_executions_status (status),
    INDEX idx_skill_executions_created (created_at DESC)
);

-- Workflow execution tracking
CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(100), -- 'n8n', 'skills-chain', 'custom'
    license_key VARCHAR(255),
    product_key VARCHAR(255),
    
    -- Workflow details
    trigger_type VARCHAR(100), -- 'manual', 'webhook', 'schedule', 'event'
    trigger_data JSONB,
    
    -- Execution chain
    parent_execution_id VARCHAR(255),
    child_executions JSONB, -- Array of child execution IDs
    
    -- Status tracking
    status VARCHAR(50) NOT NULL,
    current_step INTEGER,
    total_steps INTEGER,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Results
    final_output JSONB,
    error_details JSONB,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_executions_license (license_key),
    INDEX idx_workflow_executions_type (workflow_type),
    INDEX idx_workflow_executions_status (status),
    INDEX idx_workflow_executions_created (created_at DESC)
);

-- API request logging for external services
CREATE TABLE IF NOT EXISTS api_request_logs (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(255), -- Links to skill_executions
    request_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Request details
    service_name VARCHAR(255) NOT NULL, -- 'openai', 'n8n', 'webhook', etc.
    endpoint_url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    headers JSONB,
    request_body JSONB,
    
    -- Response details
    status_code INTEGER,
    response_headers JSONB,
    response_body JSONB,
    
    -- Timing
    request_time TIMESTAMP WITH TIME ZONE NOT NULL,
    response_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    license_key VARCHAR(255),
    product_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_logs_execution (execution_id),
    INDEX idx_api_logs_service (service_name),
    INDEX idx_api_logs_created (created_at DESC)
);

-- Performance metrics aggregation
CREATE TABLE IF NOT EXISTS skill_metrics_hourly (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Execution counts
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_duration_ms FLOAT,
    min_duration_ms INTEGER,
    max_duration_ms INTEGER,
    p95_duration_ms INTEGER,
    p99_duration_ms INTEGER,
    
    -- Usage metrics
    total_tokens_used INTEGER DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    
    -- Error metrics
    error_rate FLOAT,
    timeout_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(skill_name, hour_timestamp),
    INDEX idx_metrics_skill (skill_name),
    INDEX idx_metrics_hour (hour_timestamp DESC)
);

-- User activity tracking
CREATE TABLE IF NOT EXISTS user_skill_activity (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    license_key VARCHAR(255),
    
    -- Activity summary
    total_skill_uses INTEGER DEFAULT 0,
    favorite_skills JSONB, -- Array of most used skills
    last_active TIMESTAMP WITH TIME ZONE,
    
    -- Usage patterns
    usage_by_hour JSONB, -- Heat map data
    usage_by_day JSONB,
    average_session_duration INTEGER,
    
    -- Preferences
    preferred_language VARCHAR(10),
    timezone VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, license_key),
    INDEX idx_user_activity_license (license_key)
);

-- Create function to automatically update metrics
CREATE OR REPLACE FUNCTION update_skill_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly metrics when a skill execution completes
    IF NEW.status IN ('success', 'failed') AND NEW.end_time IS NOT NULL THEN
        INSERT INTO skill_metrics_hourly (
            skill_name,
            hour_timestamp,
            total_executions,
            successful_executions,
            failed_executions,
            avg_duration_ms,
            min_duration_ms,
            max_duration_ms,
            total_tokens_used
        )
        VALUES (
            NEW.skill_name,
            date_trunc('hour', NEW.start_time),
            1,
            CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
            CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            NEW.duration_ms,
            NEW.duration_ms,
            NEW.duration_ms,
            COALESCE(NEW.tokens_used, 0)
        )
        ON CONFLICT (skill_name, hour_timestamp)
        DO UPDATE SET
            total_executions = skill_metrics_hourly.total_executions + 1,
            successful_executions = skill_metrics_hourly.successful_executions + 
                CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
            failed_executions = skill_metrics_hourly.failed_executions + 
                CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
            avg_duration_ms = (skill_metrics_hourly.avg_duration_ms * skill_metrics_hourly.total_executions + NEW.duration_ms) / 
                (skill_metrics_hourly.total_executions + 1),
            min_duration_ms = LEAST(skill_metrics_hourly.min_duration_ms, NEW.duration_ms),
            max_duration_ms = GREATEST(skill_metrics_hourly.max_duration_ms, NEW.duration_ms),
            total_tokens_used = skill_metrics_hourly.total_tokens_used + COALESCE(NEW.tokens_used, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic metrics update
CREATE TRIGGER update_metrics_on_execution
AFTER INSERT OR UPDATE ON skill_executions
FOR EACH ROW
EXECUTE FUNCTION update_skill_metrics();

-- Add comments for documentation
COMMENT ON TABLE skill_executions IS 'Comprehensive log of all skill executions across the platform';
COMMENT ON TABLE workflow_executions IS 'Tracks multi-step workflow executions including n8n and skill chains';
COMMENT ON TABLE api_request_logs IS 'Logs all external API requests for debugging and monitoring';
COMMENT ON TABLE skill_metrics_hourly IS 'Aggregated performance metrics by hour for each skill';
COMMENT ON TABLE user_skill_activity IS 'Tracks user engagement and usage patterns with skills';