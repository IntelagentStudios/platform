-- Immediate fix for your specific licenses
-- Run each section one at a time to see results

-- SECTION 1: Setup BOSS-MODE account (Harry's main)
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
VALUES 
    ('INTL-AGNT-BOSS-MODE', 'chatbot', 'chat_boss' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('INTL-AGNT-BOSS-MODE', 'sales-agent', 'sale_boss' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('INTL-AGNT-BOSS-MODE', 'setup-agent', 'agnt_boss' || substr(md5(random()::text), 1, 12), 'active', now());

-- SECTION 2: Setup friend's test account
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
VALUES 
    ('INTL-8K3M-QB7X-2024', 'chatbot', 'chat_test' || substr(md5(random()::text), 1, 12), 'active', now());

-- SECTION 3: Setup Harry's other licenses (59BB and 7559)
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
VALUES 
    ('59BB-5046-A795-2713', 'chatbot', 'chat_59bb' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('59BB-5046-A795-2713', 'sales-agent', 'sale_59bb' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('59BB-5046-A795-2713', 'data-enrichment', 'data_59bb' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('59BB-5046-A795-2713', 'setup-agent', 'agnt_59bb' || substr(md5(random()::text), 1, 12), 'active', now());

INSERT INTO product_keys (license_key, product, product_key, status, created_at)
VALUES 
    ('7559-1F5D-842B-A27B', 'chatbot', 'chat_7559' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('7559-1F5D-842B-A27B', 'sales-agent', 'sale_7559' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('7559-1F5D-842B-A27B', 'data-enrichment', 'data_7559' || substr(md5(random()::text), 1, 12), 'active', now()),
    ('7559-1F5D-842B-A27B', 'setup-agent', 'agnt_7559' || substr(md5(random()::text), 1, 12), 'active', now());

-- SECTION 4: Clear all site_keys
UPDATE licenses SET site_key = NULL;

-- SECTION 5: Verify everything worked
SELECT 
    l.license_key,
    l.customer_name,
    l.products as purchased_products,
    array_agg(
        pk.product || ': ' || pk.product_key 
        ORDER BY pk.product
    ) FILTER (WHERE pk.product_key IS NOT NULL) as configured_keys,
    COUNT(pk.product_key) as key_count
FROM licenses l
LEFT JOIN product_keys pk ON pk.license_key = l.license_key
GROUP BY l.license_key, l.customer_name, l.products
ORDER BY l.license_key;