-- Migration: Add missing tables for complete platform functionality
-- Date: 2024-08-22

-- Onboarding tracking table
CREATE TABLE IF NOT EXISTS onboarding (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(20) UNIQUE NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_license_key ON onboarding(license_key);
CREATE INDEX idx_onboarding_completed ON onboarding(completed);

-- Product configurations table
CREATE TABLE IF NOT EXISTS product_configs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(20) NOT NULL,
  product VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(license_key, product)
);

CREATE INDEX idx_product_configs_license_key ON product_configs(license_key);
CREATE INDEX idx_product_configs_product ON product_configs(product);

-- Events table for audit and analytics
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(20),
  user_id VARCHAR(36),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_license_key ON events(license_key);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Analytics aggregation table
CREATE TABLE IF NOT EXISTS analytics (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(20) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value FLOAT NOT NULL,
  dimension VARCHAR(100),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(license_key, metric_type, metric_name, period_start)
);

CREATE INDEX idx_analytics_license_key ON analytics(license_key);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);
CREATE INDEX idx_analytics_period_start ON analytics(period_start);

-- Onboarding metrics tracking
CREATE TABLE IF NOT EXISTS onboarding_metrics (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(20) NOT NULL,
  step_completed VARCHAR(50) NOT NULL,
  time_spent INTEGER,
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onboarding_metrics_license_key ON onboarding_metrics(license_key);
CREATE INDEX idx_onboarding_metrics_step_completed ON onboarding_metrics(step_completed);
CREATE INDEX idx_onboarding_metrics_created_at ON onboarding_metrics(created_at);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_configs_updated_at BEFORE UPDATE ON product_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your user setup)
GRANT ALL ON onboarding TO PUBLIC;
GRANT ALL ON product_configs TO PUBLIC;
GRANT ALL ON events TO PUBLIC;
GRANT ALL ON analytics TO PUBLIC;
GRANT ALL ON onboarding_metrics TO PUBLIC;