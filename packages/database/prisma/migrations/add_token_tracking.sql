-- Add token tracking to chatbot_logs
ALTER TABLE chatbot_logs 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_tokens INTEGER DEFAULT 0;

-- Add usage limits to licenses
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS token_limit_monthly INTEGER DEFAULT 50000,
ADD COLUMN IF NOT EXISTS tokens_used_current_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(50) REFERENCES licenses(license_key),
    product_key VARCHAR(20),
    tokens_used INTEGER NOT NULL,
    token_type VARCHAR(50), -- 'input', 'output', 'knowledge'
    model_used VARCHAR(100),
    cost_usd DECIMAL(10, 6),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    month_year VARCHAR(7) -- '2024-01' format for easy grouping
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_usage_license_month 
ON token_usage(license_key, month_year);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_tokens 
ON chatbot_logs(product_key, timestamp);