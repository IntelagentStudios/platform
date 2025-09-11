-- Create knowledge_files table
CREATE TABLE IF NOT EXISTS knowledge_files (
  id VARCHAR(36) PRIMARY KEY DEFAULT (gen_random_uuid())::varchar,
  product_key VARCHAR(255) NOT NULL,
  license_key VARCHAR(20) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_knowledge_files_product_key ON knowledge_files(product_key);
CREATE INDEX idx_knowledge_files_license_key ON knowledge_files(license_key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_files_updated_at BEFORE UPDATE
    ON knowledge_files FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();