-- Security Policies and Row Level Security (RLS) for Multi-tenant Database
-- This script implements comprehensive security policies for tenant isolation

-- ============================================
-- 1. ENABLE ROW LEVEL SECURITY ON PUBLIC TABLES
-- ============================================

-- Enable RLS on all public tables
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. CREATE SECURITY FUNCTIONS
-- ============================================

-- Function to get current user's license key from JWT
CREATE OR REPLACE FUNCTION auth.current_license_key()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_license', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_role', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.is_admin', true)::BOOLEAN;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. LICENSE POLICIES
-- ============================================

-- Admins can see all licenses
CREATE POLICY admin_all_licenses ON public.licenses
    FOR ALL
    TO authenticated
    USING (auth.is_admin());

-- Users can only see their own license
CREATE POLICY users_own_license ON public.licenses
    FOR SELECT
    TO authenticated
    USING (license_key = auth.current_license_key());

-- ============================================
-- 4. USER POLICIES
-- ============================================

-- Admins can manage all users
CREATE POLICY admin_all_users ON public.users
    FOR ALL
    TO authenticated
    USING (auth.is_admin());

-- Users can see other users in same license
CREATE POLICY users_same_license ON public.users
    FOR SELECT
    TO authenticated
    USING (license_key = auth.current_license_key());

-- Users can update their own profile
CREATE POLICY users_update_self ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.current_user_id())
    WITH CHECK (id = auth.current_user_id());

-- License owners can manage team members
CREATE POLICY owner_manage_team ON public.users
    FOR ALL
    TO authenticated
    USING (
        license_key = auth.current_license_key() 
        AND auth.current_user_role() IN ('owner', 'admin')
    );

-- ============================================
-- 5. PRODUCT POLICIES
-- ============================================

-- Everyone can view active products
CREATE POLICY view_active_products ON public.products
    FOR SELECT
    TO authenticated
    USING (active = true);

-- Only admins can manage products
CREATE POLICY admin_manage_products ON public.products
    FOR ALL
    TO authenticated
    USING (auth.is_admin());

-- ============================================
-- 6. BILLING POLICIES
-- ============================================

-- Users can view their own billing history
CREATE POLICY users_own_billing ON public.billing_history
    FOR SELECT
    TO authenticated
    USING (license_key = auth.current_license_key());

-- Admins can view all billing
CREATE POLICY admin_all_billing ON public.billing_history
    FOR ALL
    TO authenticated
    USING (auth.is_admin());

-- ============================================
-- 7. API KEY POLICIES
-- ============================================

-- Users can manage their own API keys
CREATE POLICY users_own_api_keys ON public.api_keys
    FOR ALL
    TO authenticated
    USING (user_id = auth.current_user_id())
    WITH CHECK (user_id = auth.current_user_id());

-- Users can view API keys of same license
CREATE POLICY users_view_license_keys ON public.api_keys
    FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE license_key = auth.current_license_key()
        )
    );

-- ============================================
-- 8. SESSION POLICIES
-- ============================================

-- Users can only see their own sessions
CREATE POLICY users_own_sessions ON public.user_sessions
    FOR ALL
    TO authenticated
    USING (user_id = auth.current_user_id())
    WITH CHECK (user_id = auth.current_user_id());

-- ============================================
-- 9. AUDIT LOG POLICIES
-- ============================================

-- Users can view audit logs for their license
CREATE POLICY users_license_audit ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (license_key = auth.current_license_key());

-- Only system can insert audit logs
CREATE POLICY system_insert_audit ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- 10. TENANT SCHEMA SECURITY
-- ============================================

-- Function to ensure tenant isolation in queries
CREATE OR REPLACE FUNCTION enforce_tenant_isolation()
RETURNS event_trigger AS $$
DECLARE
    cmd record;
    schema_name text;
BEGIN
    FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        -- Extract schema from object identity
        schema_name := split_part(cmd.object_identity, '.', 1);
        
        -- Prevent cross-schema access except for admins
        IF schema_name LIKE 'license_%' AND NOT auth.is_admin() THEN
            IF schema_name != ('license_' || replace(lower(auth.current_license_key()), '-', '_')) THEN
                RAISE EXCEPTION 'Access denied: Cannot access schema %', schema_name;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger for DDL commands
DROP EVENT TRIGGER IF EXISTS enforce_tenant_isolation_trigger;
CREATE EVENT TRIGGER enforce_tenant_isolation_trigger
    ON ddl_command_end
    EXECUTE FUNCTION enforce_tenant_isolation();

-- ============================================
-- 11. SECURE VIEWS
-- ============================================

-- Create secure view for license summary
CREATE OR REPLACE VIEW public.license_summary AS
SELECT 
    l.license_key,
    l.products,
    l.is_pro,
    l.status,
    l.total_pence,
    l.currency,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT bh.id) as invoice_count,
    SUM(CASE WHEN bh.status = 'paid' THEN bh.amount_pence ELSE 0 END) as total_paid_pence
FROM public.licenses l
LEFT JOIN public.users u ON u.license_key = l.license_key
LEFT JOIN public.billing_history bh ON bh.license_key = l.license_key
WHERE l.license_key = auth.current_license_key()
GROUP BY l.license_key;

-- Grant access to secure view
GRANT SELECT ON public.license_summary TO authenticated;

-- ============================================
-- 12. SECURITY DEFINER FUNCTIONS
-- ============================================

-- Secure function to create user (checks license limits)
CREATE OR REPLACE FUNCTION public.create_team_member(
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_role VARCHAR(20)
)
RETURNS TABLE(success BOOLEAN, message TEXT, user_id TEXT) 
SECURITY DEFINER AS $$
DECLARE
    v_license_key TEXT;
    v_user_count INT;
    v_max_users INT;
    v_new_user_id TEXT;
BEGIN
    -- Get current license
    v_license_key := auth.current_license_key();
    
    -- Check if caller is owner or admin
    IF auth.current_user_role() NOT IN ('owner', 'admin') THEN
        RETURN QUERY SELECT FALSE, 'Insufficient permissions', NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check user limit based on license
    SELECT COUNT(*) INTO v_user_count
    FROM public.users
    WHERE license_key = v_license_key;
    
    -- Set max users based on license type (example limits)
    SELECT 
        CASE 
            WHEN is_pro THEN 50
            ELSE 10
        END INTO v_max_users
    FROM public.licenses
    WHERE license_key = v_license_key;
    
    IF v_user_count >= v_max_users THEN
        RETURN QUERY SELECT FALSE, 'User limit reached for license', NULL::TEXT;
        RETURN;
    END IF;
    
    -- Create user
    INSERT INTO public.users (id, license_key, email, name, role, created_at)
    VALUES (gen_random_uuid(), v_license_key, p_email, p_name, p_role, NOW())
    RETURNING id INTO v_new_user_id;
    
    RETURN QUERY SELECT TRUE, 'User created successfully', v_new_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. RATE LIMITING
-- ============================================

-- Table for rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, or api_key
    endpoint VARCHAR(255) NOT NULL,
    requests INT DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier VARCHAR(255),
    p_endpoint VARCHAR(255),
    p_limit INT DEFAULT 100,
    p_window_minutes INT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_requests INT;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := date_trunc('minute', NOW());
    
    -- Get current request count
    SELECT requests INTO v_current_requests
    FROM public.rate_limits
    WHERE identifier = p_identifier
        AND endpoint = p_endpoint
        AND window_start = v_window_start;
    
    IF v_current_requests IS NULL THEN
        -- First request in window
        INSERT INTO public.rate_limits (identifier, endpoint, requests, window_start)
        VALUES (p_identifier, p_endpoint, 1, v_window_start)
        ON CONFLICT (identifier, endpoint, window_start) DO NOTHING;
        RETURN TRUE;
    ELSIF v_current_requests < p_limit THEN
        -- Increment counter
        UPDATE public.rate_limits
        SET requests = requests + 1
        WHERE identifier = p_identifier
            AND endpoint = p_endpoint
            AND window_start = v_window_start;
        RETURN TRUE;
    ELSE
        -- Rate limit exceeded
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. ENCRYPTION FUNCTIONS
-- ============================================

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive(p_data TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgcrypto extension for encryption
    RETURN encode(
        encrypt(
            p_data::bytea,
            current_setting('app.encryption_key')::bytea,
            'aes'
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_encrypted TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(
        decrypt(
            decode(p_encrypted, 'base64'),
            current_setting('app.encryption_key')::bytea,
            'aes'
        ),
        'UTF8'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 15. GRANT PERMISSIONS
-- ============================================

-- Create roles
CREATE ROLE authenticated;
CREATE ROLE anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant execute on security functions
GRANT EXECUTE ON FUNCTION auth.current_license_key() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;

-- Grant select on products to anon (for pricing page)
GRANT SELECT ON public.products TO anon;

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;