-- Quick migration for BOSS-MODE account
-- Run this directly in Railway PostgreSQL

-- 1. Create new chatbot product key
INSERT INTO product_keys (
    license_key,
    product,
    product_key,
    status,
    created_at
) VALUES (
    'INTL-AGNT-BOSS-MODE',
    'chatbot',
    'chat_boss' || substr(md5(random()::text), 1, 12),  -- Creates something like: chat_boss1a2b3c4d5e6f
    'active',
    now()
);

-- 2. Remove legacy site_key
UPDATE licenses 
SET site_key = NULL
WHERE license_key = 'INTL-AGNT-BOSS-MODE';

-- 3. Show the new key
SELECT * FROM product_keys WHERE license_key = 'INTL-AGNT-BOSS-MODE';