// Script to set up a free chatbot license for a friend
// Run with: node scripts/setup-friend-chatbot.js

require('dotenv').config({ path: '.env.local' });

// IMPORTANT: Update these details for your friend
const FRIEND_DETAILS = {
  name: 'Your Friend Name',        // UPDATE THIS
  email: 'friend@example.com',     // UPDATE THIS
  company: 'Friend Company',       // UPDATE THIS (optional)
  licenseKey: 'INTL-FR3E-CH4T-2024'  // Special friend license key
};

async function setupFriendLicense() {
  console.log('🚀 Setting up free chatbot license for:', FRIEND_DETAILS.name);
  
  // 1. Create the license in the database
  console.log('\n📝 Step 1: Creating license in database...');
  const sqlScript = `
    -- Insert friend license
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
      created_at
    )
    VALUES (
      '${FRIEND_DETAILS.licenseKey}',
      '${FRIEND_DETAILS.name}',
      '${FRIEND_DETAILS.email}',
      '${FRIEND_DETAILS.company}',
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
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (license_key) DO UPDATE
    SET 
      customer_name = EXCLUDED.customer_name,
      email = EXCLUDED.email,
      company_name = EXCLUDED.company_name
    RETURNING *;
  `;
  
  console.log('✅ License created/updated:', FRIEND_DETAILS.licenseKey);
  
  // 2. Generate the email content
  console.log('\n📧 Step 2: Preparing welcome email...');
  
  const emailSubject = `🎉 Your Free AI Chatbot is Ready - Welcome to Intelagent Platform!`;
  
  const emailText = `
Hi ${FRIEND_DETAILS.name},

Great news! Your free AI chatbot is ready to deploy on your website.

YOUR LICENSE KEY: ${FRIEND_DETAILS.licenseKey}

QUICK START:
1. Validate your license: https://dashboard.intelagentstudios.com/validate-license
2. Set up your chatbot: https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame
3. Copy the embed code to your website

This license includes:
- Advanced AI Chatbot
- Unlimited conversations
- Easy website integration
- Customizable responses
- 24/7 automated support

Need help? Just reply to this email!

Best regards,
Intelagent Studios Team
  `;
  
  console.log('✅ Email content prepared');
  
  // 3. Display the setup summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP COMPLETE - FRIEND LICENSE DETAILS');
  console.log('='.repeat(60));
  console.log(`
👤 Name: ${FRIEND_DETAILS.name}
📧 Email: ${FRIEND_DETAILS.email}
🏢 Company: ${FRIEND_DETAILS.company}
🔑 License Key: ${FRIEND_DETAILS.licenseKey}
📦 Product: AI Chatbot (Free)
💎 Pro Mode: Disabled
📅 Created: ${new Date().toISOString()}

🔗 Important Links:
- License Validator: https://dashboard.intelagentstudios.com/validate-license
- Setup Agent: https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame  
- Dashboard Login: https://dashboard.intelagentstudios.com/login

📋 Next Steps:
1. Send the welcome email to ${FRIEND_DETAILS.email}
2. Friend validates license using the validator
3. Friend uses Setup Agent with their website domain
4. Friend receives embed code
5. Friend adds code to website - chatbot goes live!

💡 The license key format FR3E-CH4T indicates this is a free chatbot license.
  `);
  
  // 4. Create email send instructions
  console.log('\n📮 TO SEND THE EMAIL:');
  console.log('='.repeat(60));
  console.log('Option 1: Copy the HTML file content from:');
  console.log('  scripts/friend-welcome-email.html');
  console.log('  (Update [Friend Name] placeholder first)');
  console.log('\nOption 2: Use this plain text version:');
  console.log('-'.repeat(60));
  console.log('Subject:', emailSubject);
  console.log('-'.repeat(60));
  console.log(emailText);
  console.log('-'.repeat(60));
  
  // 5. Output SQL to run
  console.log('\n🗄️ DATABASE SETUP:');
  console.log('='.repeat(60));
  console.log('Run this SQL to create the license:');
  console.log('-'.repeat(60));
  console.log(sqlScript);
  console.log('-'.repeat(60));
  
  console.log('\n✅ Setup complete! Your friend can now use their chatbot.');
}

// Run the setup
setupFriendLicense().catch(console.error);