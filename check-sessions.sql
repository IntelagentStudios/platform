-- Check user_sessions table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_sessions';