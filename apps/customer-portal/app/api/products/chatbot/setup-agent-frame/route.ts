import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Intelagent Chatbot Setup</title>
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: rgb(48, 54, 54);
      color: rgb(229, 227, 220);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
    .setup-container {
      background: rgba(58, 64, 64, 0.8);
      backdrop-filter: blur(8px);
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      padding: 32px;
      max-width: 700px;
      width: 100%;
      text-align: center;
      border: 1px solid rgba(169, 189, 203, 0.2);
    }
    h1 {
      font-size: 28px;
      margin-bottom: 16px;
      color: rgb(229, 227, 220);
      font-weight: 600;
    }
    p {
      font-size: 14px;
      margin-bottom: 24px;
      color: rgba(169, 189, 203, 0.9);
    }
    #chat-log {
      text-align: left;
      height: 400px;
      overflow-y: auto;
      background: rgba(48, 54, 54, 0.6);
      border: 1px solid rgba(169, 189, 203, 0.15);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      font-size: 14px;
      line-height: 1.6;
    }
    #chat-log::-webkit-scrollbar {
      width: 8px;
    }
    #chat-log::-webkit-scrollbar-track {
      background: rgba(48, 54, 54, 0.3);
      border-radius: 4px;
    }
    #chat-log::-webkit-scrollbar-thumb {
      background: rgba(169, 189, 203, 0.3);
      border-radius: 4px;
    }
    #chat-log::-webkit-scrollbar-thumb:hover {
      background: rgba(169, 189, 203, 0.5);
    }
    .user-message {
      margin-bottom: 12px;
      padding: 10px 12px;
      background: rgba(66, 153, 225, 0.1);
      border-left: 3px solid rgb(66, 153, 225);
      border-radius: 4px;
      animation: slideIn 0.3s ease-out;
    }
    .agent-message {
      margin-bottom: 12px;
      padding: 10px 12px;
      background: rgba(72, 187, 120, 0.1);
      border-left: 3px solid rgb(72, 187, 120);
      border-radius: 4px;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .input-container {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    #chat-input {
      flex: 1;
      padding: 12px 16px;
      background: rgba(48, 54, 54, 0.8);
      border: 1px solid rgba(169, 189, 203, 0.3);
      border-radius: 8px;
      color: rgb(229, 227, 220);
      font-size: 14px;
      transition: all 0.3s ease;
    }
    #chat-input:focus {
      outline: none;
      border-color: rgb(66, 153, 225);
      background: rgba(48, 54, 54, 1);
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
    }
    #chat-input::placeholder {
      color: rgba(169, 189, 203, 0.5);
    }
    #send-button {
      padding: 12px 24px;
      background: linear-gradient(135deg, rgb(66, 153, 225), rgb(59, 130, 246));
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
    }
    #send-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
    }
    #send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(66, 153, 225, 0.5);
    }
    .typing-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 4px;
    }
    .typing-indicator span {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: rgb(72, 187, 120);
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes typing {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: translateY(0);
      }
      30% {
        opacity: 1;
        transform: translateY(-10px);
      }
    }
    .setup-footer {
      margin-top: 24px;
      font-size: 12px;
      color: rgba(169, 189, 203, 0.6);
    }
    pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 6px;
      margin: 8px 0;
      overflow-x: auto;
      text-align: left;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: rgb(147, 197, 253);
    }
    .success-message {
      color: rgb(72, 187, 120);
      font-weight: 600;
    }
    .error-message {
      color: #ff6464;
      font-weight: 600;
    }
    .warning-message {
      color: rgb(251, 191, 36);
      font-weight: 600;
    }
    .info-box {
      background: rgba(66, 153, 225, 0.1);
      border: 1px solid rgba(66, 153, 225, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin: 12px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="setup-container" id="main-container">
    <h1>Intelagent Chatbot Setup</h1>
    <p>Welcome! I'm here to help you set up your AI chatbot. Let's get started!</p>
    <div id="chat-log"></div>
    <div class="input-container">
      <input autofocus id="chat-input" placeholder="Type your response..." type="text"/>
      <button id="send-button">Send</button>
    </div>
    <div class="setup-footer">Powered by Intelagent Studios • Platform</div>
  </div>
  <script>
    // Generate unique session ID for this setup session
    const sessionId = "setup_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    let messageCount = 0;
    let licenseKey = null;
    
    // N8N webhook URL - your setup agent endpoint
    const WEBHOOK_URL = "https://1ntelagent.up.railway.app/webhook/setup";
    
    // Get license key from cookies or localStorage
    async function getLicenseKey() {
      try {
        // Try to get from auth context (passed from parent)
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.user && authData.user.license_key) {
            licenseKey = authData.user.license_key;
            return licenseKey;
          }
        }
      } catch (error) {
        console.error('Failed to get license key:', error);
      }
      return null;
    }
    
    // Initialize chat with welcome message
    async function initializeChat() {
      const chatLog = document.getElementById("chat-log");
      
      // Get license key for the session
      await getLicenseKey();
      
      // Show initial agent message
      chatLog.innerHTML = '<div class="agent-message"><strong>Setup Assistant:</strong> Welcome! I\'m here to help you set up your AI chatbot. To begin, could you please share your website\'s domain?</div>';
      
      // Send initial message to n8n to start conversation
      if (licenseKey) {
        // Send license key with initial context
        sendToN8N("__INIT__", true);
      }
    }
    
    async function sendToN8N(message, isInit = false) {
      const payload = {
        message: isInit ? "start" : message,
        session_id: sessionId,
        message_count: messageCount++,
        timestamp: new Date().toISOString(),
        source: "dashboard_setup",
        context: {
          license_key: licenseKey,
          is_init: isInit,
          current_url: window.location.href
        }
      };
      
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const responseText = await response.text();
          console.log("N8N Response:", responseText);
          
          if (responseText && responseText.trim()) {
            try {
              const data = JSON.parse(responseText);
              return data;
            } catch (e) {
              // If not JSON, return as text
              return { message: responseText };
            }
          }
        }
        
        return null;
      } catch (error) {
        console.error("N8N communication error:", error);
        return null;
      }
    }
    
    async function sendMessage(messageOverride) {
      const input = document.getElementById("chat-input");
      const chatLog = document.getElementById("chat-log");
      const button = document.getElementById("send-button");
      const message = messageOverride || input.value.trim();
      if (!message) return;

      // Add user message
      chatLog.innerHTML += '<div class="user-message"><strong>You:</strong> ' + message + '</div>';
      chatLog.innerHTML += '<div id="typing-indicator" class="agent-message"><strong>Agent:</strong> <span class="typing-indicator"><span></span><span></span><span></span></span></div>';
      
      // Scroll to bottom
      chatLog.scrollTo({
        top: chatLog.scrollHeight,
        behavior: 'smooth'
      });
      
      input.value = "";
      input.disabled = true;
      button.disabled = true;

      try {
        // Send to N8N webhook
        const response = await sendToN8N(message);
        
        let agentReply = "I'm having trouble connecting to the setup service. Please try again or contact support.";
        
        if (response) {
          // Extract the agent's response
          agentReply = response.message || 
                      response.agent_response || 
                      response.response ||
                      response.text ||
                      JSON.stringify(response);
          
          // Check if setup is complete (has product key)
          if (response.product_key || response.site_key) {
            const productKey = response.product_key || response.site_key;
            const domain = response.domain || message;
            
            // Save configuration using the new API
            await fetch('/api/products/chatbot/configure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                domain: domain,
                webhook_url: WEBHOOK_URL,
                settings: {
                  configured_via: 'setup_agent',
                  session_id: sessionId
                }
              })
            });
            
            // Format success message with new product key format
            if (productKey.startsWith('chat_')) {
              agentReply = '<span class="success-message">Perfect! Your chatbot is ready to go.</span><br><br>' +
                          '<strong>Your unique product key:</strong><br>' +
                          '<pre><code>' + productKey + '</code></pre><br>' +
                          '<strong>Simply add this code to your website, just before the &lt;/body&gt; tag:</strong><br>' +
                          '<pre><code>&lt;script src="https://dashboard.intelagentstudios.com/chatbot.js"\\n' +
                          '    data-product-key="' + productKey + '"&gt;&lt;/script&gt;</code></pre>' +
                          '<br><div class="info-box">Your chatbot will activate immediately. Would you like installation guidance for any specific platform?</div>';
            }
          }
        }
        
        // Remove typing indicator
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }
        
        // Add agent response
        chatLog.innerHTML += '<div class="agent-message"><strong>Agent:</strong> ' + agentReply + '</div>';
        
        // Scroll to bottom
        chatLog.scrollTo({
          top: chatLog.scrollHeight,
          behavior: 'smooth'
        });
        
      } catch (error) {
        console.error("Error:", error);
        
        // Remove typing indicator
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) {
          typingIndicator.remove();
        }
        
        chatLog.innerHTML += '<div class="agent-message"><strong>Agent:</strong> <span class="error-message">I apologize, but I\'m having trouble connecting to our setup service. Please try again later or contact support@intelagentstudios.com</span></div>';
      } finally {
        input.disabled = false;
        button.disabled = false;
        input.focus();
      }
    }

    // Initialize on load
    window.onload = function() {
      initializeChat();
      
      // Setup event listeners
      document.getElementById("send-button").addEventListener("click", () => sendMessage());
      document.getElementById("chat-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      });
    };
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}