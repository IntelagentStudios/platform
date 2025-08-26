-- ============================================================
-- CREATE FREE CHATBOT LICENSE FOR FRIEND
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Replace the placeholder values below with your friend's actual details
-- 2. Run this script in your PostgreSQL database
-- 3. Send the welcome email with the license key
-- 
-- LICENSE KEY: INTL-FR3E-CH4T-2024
-- (FR3E = FREE, CH4T = CHAT - special identifier for friend licenses)
-- ============================================================

-- !!! UPDATE THESE VALUES BEFORE RUNNING !!!
DO $$ 
DECLARE
    friend_name TEXT := 'Your Friend Name';      -- <- UPDATE THIS
    friend_email TEXT := 'friend@example.com';   -- <- UPDATE THIS  
    friend_company TEXT := 'Friend Company';     -- <- UPDATE THIS (or use 'Personal')
    license_key TEXT := 'INTL-FR3E-CH4T-2024';   -- Keep as is (or generate new one)
BEGIN
    -- Check if license already exists
    IF EXISTS (SELECT 1 FROM licenses WHERE licenses.license_key = license_key) THEN
        RAISE NOTICE 'License % already exists - updating details...', license_key;
        
        -- Update existing license
        UPDATE licenses 
        SET 
            customer_name = friend_name,
            email = friend_email,
            company_name = friend_company,
            products = ARRAY['chatbot']::text[],
            pro_mode_enabled = false,
            status = 'active',
            subscription_status = 'active'
        WHERE licenses.license_key = license_key;
        
        RAISE NOTICE 'License updated successfully!';
    ELSE
        -- Create new license
        INSERT INTO licenses (
            license_key,
            customer_name,
            email,
            company_name,
            status,
            subscription_status,
            products,
            pro_mode_enabled,
            metadata,
            created_at,
            used_at,
            expires_at
        )
        VALUES (
            license_key,
            friend_name,
            friend_email,
            friend_company,
            'active',
            'active',
            ARRAY['chatbot']::text[],
            false,
            jsonb_build_object(
                'type', 'free_trial',
                'generated_by', 'admin',
                'purpose', 'friend_testing',
                'created_date', CURRENT_TIMESTAMP,
                'notes', 'Free license for friend to test chatbot'
            ),
            CURRENT_TIMESTAMP,
            NULL,  -- Not used yet
            NULL   -- Never expires
        );
        
        RAISE NOTICE 'License created successfully!';
    END IF;
    
    -- Display the created/updated license
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LICENSE DETAILS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'License Key: %', license_key;
    RAISE NOTICE 'Customer: %', friend_name;
    RAISE NOTICE 'Email: %', friend_email;
    RAISE NOTICE 'Company: %', friend_company;
    RAISE NOTICE 'Product: AI Chatbot (Free)';
    RAISE NOTICE 'Status: Active';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Send the welcome email with these links:';
    RAISE NOTICE '1. License Validator: https://dashboard.intelagentstudios.com/validate-license';
    RAISE NOTICE '2. Setup Agent: https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame';
    RAISE NOTICE '3. Dashboard: https://dashboard.intelagentstudios.com/login';
END $$;

-- Verify the license was created/updated
SELECT 
    '✅ License Ready' as status,
    license_key,
    customer_name,
    email,
    company_name,
    products,
    pro_mode_enabled,
    status as license_status,
    created_at
FROM licenses
WHERE license_key = 'INTL-FR3E-CH4T-2024';

-- Show what to include in the email
SELECT 
    E'\n📧 EMAIL TEMPLATE:\n' ||
    E'================\n' ||
    E'Subject: 🎉 Your Free AI Chatbot is Ready!\n\n' ||
    E'Hi ' || customer_name || E',\n\n' ||
    E'Your free AI chatbot license is ready!\n\n' ||
    E'LICENSE KEY: ' || license_key || E'\n\n' ||
    E'Quick Start:\n' ||
    E'1. Validate your license:\n' ||
    E'   https://dashboard.intelagentstudios.com/validate-license\n\n' ||
    E'2. Set up your chatbot:\n' ||
    E'   https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame\n\n' ||
    E'3. Install on your website:\n' ||
    E'   Copy the embed code and paste before </body> tag\n\n' ||
    E'This includes unlimited conversations and 24/7 support!\n\n' ||
    E'Need help? Just reply to this email.\n\n' ||
    E'Best regards,\n' ||
    E'Intelagent Studios Team'
    as email_content
FROM licenses
WHERE license_key = 'INTL-FR3E-CH4T-2024';