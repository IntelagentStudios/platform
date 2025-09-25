-- Dashboard customization tables
-- Store user-specific dashboard configurations

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  product_key TEXT NOT NULL,
  layout_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  layout_config JSONB NOT NULL, -- Stores grid layout, widget positions, sizes
  theme_config JSONB, -- Stores colors, fonts, spacing preferences
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_key, layout_name)
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  widget_type TEXT NOT NULL, -- 'chart', 'metric', 'table', 'timeline', 'custom'
  widget_name TEXT NOT NULL,
  widget_description TEXT,
  default_config JSONB NOT NULL, -- Default settings for the widget
  available_for_products TEXT[], -- Array of product types that can use this widget
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_widgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  layout_id TEXT NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
  widget_id TEXT NOT NULL REFERENCES dashboard_widgets(id),
  position JSONB NOT NULL, -- {x, y, w, h} for grid position
  custom_config JSONB, -- User's custom settings for this widget instance
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_dashboard_layouts_user_product ON dashboard_layouts(user_id, product_key);
CREATE INDEX idx_user_widgets_layout ON user_widgets(layout_id);

-- Insert default widgets for Operations Agent
INSERT INTO dashboard_widgets (widget_type, widget_name, widget_description, default_config, available_for_products) VALUES
('metric', 'Active Workflows', 'Shows count of currently running workflows', '{"refreshInterval": 30, "color": "blue"}', ARRAY['ops-agent']),
('chart', 'Workflow Timeline', 'Timeline view of workflow executions', '{"chartType": "timeline", "timeRange": "24h"}', ARRAY['ops-agent']),
('table', 'Recent Runs', 'Table of recent workflow runs', '{"pageSize": 10, "sortBy": "startTime"}', ARRAY['ops-agent']),
('metric', 'SLA Compliance', 'Current SLA compliance percentage', '{"format": "percentage", "threshold": 95}', ARRAY['ops-agent']),
('chart', 'Exception Trends', 'Graph of exceptions over time', '{"chartType": "line", "timeRange": "7d"}', ARRAY['ops-agent']);

-- Insert default widgets for Data/Insights Agent
INSERT INTO dashboard_widgets (widget_type, widget_name, widget_description, default_config, available_for_products) VALUES
('metric', 'Conversion Rate', 'Current conversion rate', '{"format": "percentage", "comparison": "lastPeriod"}', ARRAY['data-insights']),
('metric', 'Average Order Value', 'Average order value metric', '{"format": "currency", "currency": "GBP"}', ARRAY['data-insights']),
('chart', 'KPI Trends', 'Trending KPIs over time', '{"chartType": "multiLine", "metrics": ["conversion", "aov", "traffic"]}', ARRAY['data-insights']),
('table', 'AI Insights', 'AI-generated insights and recommendations', '{"pageSize": 5, "confidenceThreshold": 0.7}', ARRAY['data-insights']),
('chart', 'Anomaly Detection', 'Visual anomaly detection chart', '{"chartType": "scatter", "sensitivity": "medium"}', ARRAY['data-insights']),
('table', 'Data Quality', 'Data quality metrics table', '{"showIssues": true, "refreshInterval": 60}', ARRAY['data-insights']);

-- Insert default widgets for Chatbot
INSERT INTO dashboard_widgets (widget_type, widget_name, widget_description, default_config, available_for_products) VALUES
('metric', 'Total Conversations', 'Total number of conversations', '{"timeRange": "all"}', ARRAY['chatbot']),
('chart', 'Conversation Trends', 'Conversation volume over time', '{"chartType": "area", "timeRange": "30d"}', ARRAY['chatbot']),
('table', 'Recent Conversations', 'List of recent chat sessions', '{"pageSize": 20, "showSentiment": true}', ARRAY['chatbot']),
('metric', 'Response Time', 'Average response time', '{"format": "duration", "unit": "seconds"}', ARRAY['chatbot']),
('chart', 'Topic Distribution', 'Distribution of conversation topics', '{"chartType": "pie", "topN": 10}', ARRAY['chatbot']);