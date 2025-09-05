-- Create skill_logs table for tracking all skill executions
CREATE TABLE IF NOT EXISTS skill_logs (
  id SERIAL PRIMARY KEY,
  skill_id VARCHAR(100) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  product_key VARCHAR(255),
  domain VARCHAR(255),
  log_type VARCHAR(50) NOT NULL, -- 'request', 'response', 'error'
  data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_skill_logs_session (session_id),
  INDEX idx_skill_logs_skill (skill_id),
  INDEX idx_skill_logs_product (product_key),
  INDEX idx_skill_logs_timestamp (timestamp),
  INDEX idx_skill_logs_domain (domain)
);