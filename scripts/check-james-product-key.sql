-- Check if James has a product key generated
SELECT 
    '=== JAMES PRODUCT KEY STATUS ===' as section;

SELECT 
    pk.product_key,
    pk.status,
    pk.created_at,
    pk.last_used_at,
    pk.metadata,
    CASE 
        WHEN pk.product_key IS NOT NULL THEN '✅ Embed code generated'
        ELSE '❌ No embed code yet'
    END as embed_status
FROM licenses l
LEFT JOIN product_keys pk ON l.license_key = pk.license_key AND pk.product = 'chatbot'
WHERE l.license_key = 'INTL-NW1S-QANW-2025';

-- Check setup agent logs for James's session
SELECT 
    '=== RECENT SETUP ATTEMPTS ===' as section;

SELECT 
    session_id,
    user_message,
    agent_response,
    domain,
    timestamp
FROM setup_agent_logs
WHERE agent_response LIKE '%INTL-NW1S-QANW-2025%'
   OR user_message LIKE '%INTL-NW1S-QANW-2025%'
   OR domain LIKE '%steppedin%'
ORDER BY timestamp DESC
LIMIT 5;