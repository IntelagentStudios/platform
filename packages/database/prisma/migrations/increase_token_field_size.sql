-- Increase the token field size in user_sessions table
-- JWT tokens can be quite long (often 500+ characters)
ALTER TABLE user_sessions 
ALTER COLUMN token TYPE TEXT;

-- Ensure the unique constraint still works
-- (It should automatically adapt to the new type)