-- Add custom_knowledge table for chatbot customization
CREATE TABLE IF NOT EXISTS custom_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_key VARCHAR(255) NOT NULL REFERENCES product_keys(product_key) ON DELETE CASCADE,
  license_key VARCHAR(255) NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  knowledge_type VARCHAR(50) DEFAULT 'general', -- 'general', 'instructions', 'temporary'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP, -- For temporary knowledge
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255), -- Email of user who added it
  
  -- Indexes for performance
  INDEX idx_custom_knowledge_product_key (product_key),
  INDEX idx_custom_knowledge_license_key (license_key),
  INDEX idx_custom_knowledge_active (is_active),
  UNIQUE KEY unique_product_knowledge_type (product_key, knowledge_type)
);