-- Check if there are any setup logs with site keys
SELECT * FROM setup_agent_logs 
WHERE site_key IS NOT NULL 
ORDER BY timestamp DESC 
LIMIT 5;

-- Check all site_keys table
SELECT * FROM site_keys 
ORDER BY created_at DESC 
LIMIT 5;