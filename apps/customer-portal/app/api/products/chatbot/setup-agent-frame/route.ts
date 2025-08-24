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
      padding: 16px;
      border-radius: 12px;
      font-size: 14px;
      margin-bottom: 16px;
      border: 1px solid rgba(169, 189, 203, 0.15);
      scrollbar-width: thin;
      scrollbar-color: rgba(169, 189, 203, 0.3) transparent;
    }
    #chat-log::-webkit-scrollbar {
      width: 8px;
    }
    #chat-log::-webkit-scrollbar-track {
      background: transparent;
    }
    #chat-log::-webkit-scrollbar-thumb {
      background-color: rgba(169, 189, 203, 0.3);
      border-radius: 4px;
    }
    .input-container {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    #chat-input {
      flex: 1;
      padding: 12px 16px;
      font-size: 14px;
      border: 1px solid rgba(169, 189, 203, 0.3);
      border-radius: 8px;
      background: rgba(48, 54, 54, 0.6);
      color: rgb(229, 227, 220);
      transition: all 0.3s ease;
    }
    #chat-input:focus {
      outline: none;
      border-color: rgb(169, 189, 203);
      background: rgba(48, 54, 54, 0.8);
    }
    #chat-input::placeholder {
      color: rgba(169, 189, 203, 0.5);
    }
    button {
      padding: 12px 24px;
      font-size: 14px;
      border-radius: 8px;
      background: rgb(169, 189, 203);
      color: rgb(48, 54, 54);
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .setup-footer {
      font-size: 12px;
      color: rgba(169, 189, 203, 0.6);
      text-align: center;
      margin-top: 24px;
    }
    .typing-indicator {
      display: inline-flex;
      align-items: center;
      padding: 8px 0;
    }
    .typing-indicator span {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin: 0 2px;
      background: rgb(169, 189, 203);
      border-radius: 50%;
      animation: blink 1.4s infinite both;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes blink {
      0%, 80%, 100% { 
        transform: scale(0);
        opacity: 0;
      }
      40% { 
        transform: scale(1);
        opacity: 1;
      }
    }
    #chat-log div {
      margin: 12px 0;
      line-height: 1.6;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { 
        opacity: 0;
        transform: translateY(10px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    #chat-log div strong {
      display: inline-block;
      margin-bottom: 4px;
      color: rgb(169, 189, 203);
      font-weight: 600;
    }
    .user-message {
      background: rgba(169, 189, 203, 0.1);
      padding: 10px 14px;
      border-radius: 8px;
      margin-left: 40px;
      border-left: 3px solid rgb(169, 189, 203);
    }
    .agent-message {
      background: rgba(58, 64, 64, 0.5);
      padding: 10px 14px;
      border-radius: 8px;
      margin-right: 40px;
      border-left: 3px solid rgba(76, 175, 80, 0.6);
    }
    pre {
      background: rgba(48, 54, 54, 0.8);
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      border: 1px solid rgba(169, 189, 203, 0.2);
      color: rgb(169, 189, 203);
      margin: 8px 0;
    }
    code {
      font-family: 'Courier New', monospace;
    }
    .success-message {
      color: #4CAF50;
      font-weight: 600;
    }
    .error-message {
      color: #ff6464;
      font-weight: 600;
    }
    .loading-dots {
      display: inline-block;
      width: 60px;
      text-align: left;
    }
    .loading-dots::after {
      content: '.';
      animation: dots 1.5s steps(5, end) infinite;
    }
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60% { content: '...'; }
      80%, 100% { content: ''; }
    }
  </style>
</head>
<body>
  <div class="setup-container" id="main-container">
    <h1>Intelagent Chatbot Setup</h1>
    <p>I'll help you connect your domain and generate your personalized chatbot key.</p>
    <div id="chat-log"></div>
    <div class="input-container">
      <input autofocus id="chat-input" placeholder="Type your website domain (e.g., example.com)..." type="text"/>
      <button id="send-button">Send</button>
    </div>
    <div class="setup-footer">Powered by Intelagent Studios • Pro Platform</div>
  </div>
  <script>
    const sessionId = localStorage.getItem("setup_session_id") || "sess_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("setup_session_id", sessionId);
    
    // N8N webhook URL
    const WEBHOOK_URL = "https://1ntelagent.up.railway.app/webhook/setup";

    async function sendMessage(messageOverride) {
      const input = document.getElementById("chat-input");
      const chatLog = document.getElementById("chat-log");
      const button = document.getElementById("send-button");
      const message = messageOverride || input.value.trim();
      if (!message) return;

      // Add user message
      chatLog.innerHTML += \`<div class="user-message"><strong>You:</strong> \${message}</div>\`;
      chatLog.innerHTML += \`<div id="typing-indicator" class="agent-message"><strong>Agent:</strong> <span class="typing-indicator"><span></span><span></span><span></span></span></div>\`;
      chatLog.scrollTop = chatLog.scrollHeight;
      
      input.value = "";
      input.disabled = true;
      button.disabled = true;

      try {
        // Send to N8N webhook
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            user_message: message,
            store_id: "chatbot_setup",
            session_id: sessionId,
            timestamp: new Date().toISOString(),
            source: "dashboard"
          })
        });

        let agentReply = "Unable to process your request. Please try again.";
        let data = null;
        
        if (response.ok) {
          // Check if response has content
          const responseText = await response.text();
          console.log("Response text:", responseText);
          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);
          
          if (responseText && responseText.trim() !== '') {
            try {
              data = JSON.parse(responseText);
              console.log("Setup response:", data);
              
              // Extract response from various possible fields
              agentReply = data?.agent_response || 
                          data?.chatbot_response || 
                          data?.agent_message || 
                          data?.message ||
                          data?.response ||
                          data?.text ||
                          JSON.stringify(data) || 
                          "Response received but no message found.";
            } catch (parseError) {
              console.error("JSON parse error:", parseError);
              agentReply = "The setup agent is currently being configured. Please check back later or contact support.";
            }
          } else {
            agentReply = "The setup agent workflow is active but not returning data. Please ensure the N8N workflow has a 'Respond to Webhook' node configured with response data.";
          }
          
          // Check if it's a success response with a site key
          if (data && (data.site_key || data.siteKey)) {
            const siteKey = data.site_key || data.siteKey;
            agentReply = \`<span class="success-message">Success!</span><br><br>
                         Your chatbot has been configured successfully.<br><br>
                         <strong>Your Site Key:</strong><br>
                         <pre><code>\${siteKey}</code></pre>
                         <br><strong>Installation Instructions:</strong><br><br>
                         <strong>For Squarespace:</strong><br>
                         1. Go to Settings → Advanced → Code Injection<br>
                         2. Paste this in the FOOTER section (not Header):<br>
                         <pre><code>&lt;script src="https://intelagentchatbot.up.railway.app/widget.js" 
  data-site-key="\${siteKey}"&gt;&lt;/script&gt;</code></pre>
                         3. Click Save<br><br>
                         <strong>For other websites:</strong><br>
                         Add the script before the closing &lt;/body&gt; tag in your HTML.\`;
          }
        } else {
          console.error("Response not OK:", response.status, response.statusText);
          if (response.status === 404) {
            const errorText = await response.text();
            if (errorText.includes("workflow must be active")) {
              agentReply = \`<span class="error-message">Setup workflow is inactive</span><br>The N8N workflow needs to be activated. Please contact support to enable the setup agent.\`;
            } else {
              agentReply = \`<span class="error-message">Setup agent webhook not found</span><br>The webhook endpoint is not currently available. Please contact support to configure your setup agent.\`;
            }
          } else {
            agentReply = \`<span class="error-message">Connection error (\${response.status})</span><br>Please check your domain and try again.\`;
          }
        }
        
        // Format the reply
        const formattedReply = agentReply
          .replace(/\\n/g, "<br>");

        // Remove typing indicator and add agent response
        const loader = document.getElementById("typing-indicator");
        if (loader) loader.remove();
        
        chatLog.innerHTML += \`<div class="agent-message"><strong>Agent:</strong> \${formattedReply}</div>\`;
        chatLog.scrollTop = chatLog.scrollHeight;
        
      } catch (err) {
        console.error("Setup error:", err);
        console.error("Error details:", err.message, err.stack);
        const loader = document.getElementById("typing-indicator");
        if (loader) loader.remove();
        
        chatLog.innerHTML += \`<div class="agent-message"><strong>Agent:</strong> <span class="error-message">Connection failed</span><br>Error: \${err.message}<br>Please check your connection and try again.</div>\`;
        chatLog.scrollTop = chatLog.scrollHeight;
      } finally {
        input.disabled = false;
        button.disabled = false;
        input.focus();
      }
    }

    window.addEventListener("DOMContentLoaded", () => {
      const input = document.getElementById("chat-input");
      const button = document.getElementById("send-button");

      button.addEventListener("click", () => sendMessage());
      input.addEventListener("keypress", e => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendMessage();
        }
      });

      // Welcome message
      document.getElementById("chat-log").innerHTML = \`
        <div class="agent-message">
          <strong>Agent:</strong> 
          Welcome to the Intelagent Chatbot Setup.<br><br>
          To get started, please provide your website domain (e.g., example.com) and I'll help you set up your chatbot.<br><br>
          <em>Note: Make sure to use the exact domain where you'll install the chatbot.</em>
        </div>
      \`;
      
      input.focus();
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}