-- Create product key for your chatbot
-- This will properly migrate you to the product key system

-- First, check if the product key already exists
DO $$
BEGIN
    -- Insert the product key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM product_keys 
        WHERE product_key = 'chat_9b3f7e8a2c5d1f0e'
    ) THEN
        INSERT INTO product_keys (
            product_key,
            license_key,
            product,
            status,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            'chat_9b3f7e8a2c5d1f0e',
            'INTL-AGNT-BOSS-MODE',  -- Your license key
            'chatbot',
            'active',
            '{"domain": "intelagentstudios.com"}',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Product key created successfully: chat_9b3f7e8a2c5d1f0e';
    ELSE
        RAISE NOTICE 'Product key already exists: chat_9b3f7e8a2c5d1f0e';
    END IF;
END $$;

-- Verify the product key was created
SELECT 
    product_key,
    license_key,
    product,
    status,
    metadata->>'domain' as domain
FROM product_keys 
WHERE product_key = 'chat_9b3f7e8a2c5d1f0e';

-- Also update your license to ensure it has the chatbot product
UPDATE licenses 
SET products = array_append(
    CASE 
        WHEN 'chatbot' = ANY(products) THEN products
        ELSE products
    END, 
    'chatbot'
)
WHERE license_key = 'INTL-AGNT-BOSS-MODE'
  AND NOT ('chatbot' = ANY(products));