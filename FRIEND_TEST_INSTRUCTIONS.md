# Chatbot Test Instructions for Your Friend

## Quick Login (Simplified for Testing)

Since we're having some issues with the full registration system, here's a simplified login just for testing:

### Login Credentials:
- **URL:** https://dashboard.intelagentstudios.com/login
- **Email:** friend@testbusiness.com  
- **Password:** TestDemo123!

### Steps:

1. **Login to Dashboard**
   - Go to https://dashboard.intelagentstudios.com/login
   - Enter the email and password above
   - Click "Sign In"

2. **Configure Chatbot** (if not already configured)
   - Once logged in, go to Products page
   - Find "Chatbot" and click "Configure"
   - Complete the setup wizard:
     - Enter business name
     - Enter website domain
     - Choose chatbot personality
   - Save configuration

3. **Get Embed Code**
   - After configuration, click "Manage" on the Chatbot
   - Copy the embed code (looks like this):
   ```html
   <script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" 
           data-site-key="YOUR_SITE_KEY"></script>
   ```

4. **Add to Website**
   - Paste the embed code just before the `</body>` tag on their website
   - The chatbot will appear as a bubble in the bottom right

5. **Test the Chatbot**
   - Visit their website
   - Click the chat bubble
   - Have a conversation
   - Check the dashboard to see conversations tracked

## What Works:
- ✅ Login to dashboard
- ✅ View products
- ✅ Configure chatbot
- ✅ Get embed code
- ✅ Chat widget on website
- ✅ Conversation tracking
- ✅ Real-time updates (10 second refresh)

## Known Issues:
- The main registration/login system has some bugs
- Using simplified auth for now
- Some features may require page refresh

## Support:
If they have any issues, they can:
1. Try refreshing the page
2. Clear browser cookies and login again
3. Contact you for help

## License Info:
- License Key: TEST-CHAT-BOT1-2024
- Business: Test Business Inc
- Products: Chatbot (Pro Plan)

---

Note: This is a test account with simplified authentication. The full system will use proper registration with license keys.