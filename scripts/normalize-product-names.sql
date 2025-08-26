-- Normalize product names in licenses table to match our system
-- This ensures consistency across the platform

-- First, let's see current product names
SELECT license_key, products FROM licenses;

-- Update to consistent naming
UPDATE licenses 
SET products = ARRAY(
    SELECT CASE 
        WHEN elem = 'sales_agent' THEN 'sales-agent'
        WHEN elem = 'setup_agent' THEN 'setup-agent'
        WHEN elem = 'enrichment' THEN 'data-enrichment'
        WHEN elem = 'ai_insights' THEN 'ai-insights'
        WHEN elem = 'admin_panel' THEN 'admin-panel'
        ELSE elem
    END
    FROM unnest(products) AS elem
)
WHERE products && ARRAY['sales_agent', 'setup_agent', 'enrichment', 'ai_insights', 'admin_panel'];

-- Verify the update
SELECT license_key, products FROM licenses;