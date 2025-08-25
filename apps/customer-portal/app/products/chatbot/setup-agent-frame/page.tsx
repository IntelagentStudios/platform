'use client';

import { useEffect, useState } from 'react';

export default function SetupAgentFramePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize the chat interface once mounted
    const initializeChat = () => {
      const sessionId = localStorage.getItem("setup_session_id") || "sess_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("setup_session_id", sessionId);
      
      const WEBHOOK_URL = "https://1ntelagent.up.railway.app/webhook/setup";

      // Define sendMessage function globally
      (window as any).sendMessage = async function(messageOverride?: string) {
        const input = document.getElementById("chat-input") as HTMLInputElement;
        const chatLog = document.getElementById("chat-log");
        const button = document.getElementById("send-button") as HTMLButtonElement;
        const message = messageOverride || input?.value?.trim();
        
        if (!message || !chatLog) return;

        // Add user message
        chatLog.innerHTML += `
          <div style="background: rgba(169, 189, 203, 0.1); padding: 10px 14px; border-radius: 8px; margin: 12px 0; margin-left: 40px; border-left: 3px solid rgb(169, 189, 203);">
            <strong>You:</strong> ${message}
          </div>`;
        
        chatLog.innerHTML += `
          <div id="typing-indicator" style="background: rgba(58, 64, 64, 0.5); padding: 10px 14px; border-radius: 8px; margin: 12px 0; margin-right: 40px; border-left: 3px solid rgba(76, 175, 80, 0.6);">
            <strong>Agent:</strong> <span>Typing...</span>
          </div>`;
        
        chatLog.scrollTo({
          top: chatLog.scrollHeight,
          behavior: 'smooth'
        });
        
        if (input) {
          input.value = "";
          input.disabled = true;
        }
        if (button) button.disabled = true;

        try {
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
          
          if (response.ok) {
            const responseText = await response.text();
            if (responseText && responseText.trim() !== '') {
              try {
                const data = JSON.parse(responseText);
                agentReply = data?.agent_response || 
                            data?.chatbot_response || 
                            data?.message ||
                            "Response received but no message found.";
                
                // Check for success with site key
                if (data.site_key || data.siteKey) {
                  const siteKey = data.site_key || data.siteKey;
                  
                  // Save configuration
                  fetch('/api/products/configuration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      product: 'chatbot',
                      configuration: {
                        configured: true,
                        site_key: siteKey,
                        domain: data.domain || message,
                        created_at: new Date().toISOString()
                      }
                    })
                  });
                  
                  agentReply = `
                    <span style="color: #4CAF50; font-weight: 600;">Success!</span><br><br>
                    Your chatbot has been configured.<br><br>
                    <strong>Site Key:</strong> ${siteKey}<br><br>
                    <strong>Add this to your website:</strong><br>
                    <pre style="background: rgba(48, 54, 54, 0.8); padding: 12px; border-radius: 8px; margin: 8px 0;">
&lt;script src="https://dashboard.intelagentstudios.com/widget.js" data-site-key="${siteKey}"&gt;&lt;/script&gt;
                    </pre>`;
                }
              } catch (e) {
                agentReply = "Setup agent is being configured. Please try again later.";
              }
            }
          } else {
            agentReply = '<span style="color: #ff6464;">Connection error. Please try again.</span>';
          }
          
          // Remove typing indicator and show response
          const loader = document.getElementById("typing-indicator");
          if (loader) loader.remove();
          
          chatLog.innerHTML += `
            <div style="background: rgba(58, 64, 64, 0.5); padding: 10px 14px; border-radius: 8px; margin: 12px 0; margin-right: 40px; border-left: 3px solid rgba(76, 175, 80, 0.6);">
              <strong>Agent:</strong> ${agentReply}
            </div>`;
          
          chatLog.scrollTo({
            top: chatLog.scrollHeight,
            behavior: 'smooth'
          });
          
        } catch (err: any) {
          const loader = document.getElementById("typing-indicator");
          if (loader) loader.remove();
          
          chatLog.innerHTML += `
            <div style="background: rgba(58, 64, 64, 0.5); padding: 10px 14px; border-radius: 8px; margin: 12px 0; margin-right: 40px; border-left: 3px solid rgba(76, 175, 80, 0.6);">
              <strong>Agent:</strong> <span style="color: #ff6464;">Connection failed. Please try again.</span>
            </div>`;
        } finally {
          if (input) {
            input.disabled = false;
            input.focus();
          }
          if (button) button.disabled = false;
        }
      };

      // Set up event listeners
      const input = document.getElementById("chat-input") as HTMLInputElement;
      const button = document.getElementById("send-button") as HTMLButtonElement;

      if (button) {
        button.onclick = () => (window as any).sendMessage();
      }
      
      if (input) {
        input.onkeypress = (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (window as any).sendMessage();
          }
        };
      }

      // Show welcome message
      const chatLog = document.getElementById("chat-log");
      if (chatLog) {
        chatLog.innerHTML = `
          <div style="background: rgba(58, 64, 64, 0.5); padding: 10px 14px; border-radius: 8px; margin: 12px 0; margin-right: 40px; border-left: 3px solid rgba(76, 175, 80, 0.6);">
            <strong>Agent:</strong> Welcome to the Intelagent Chatbot Setup.<br><br>
            To get started, please provide your website domain (e.g., example.com) and I'll help you set up your chatbot.
          </div>`;
      }
      
      if (input) input.focus();
    };

    // Initialize after a short delay to ensure DOM is ready
    setTimeout(initializeChat, 100);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      margin: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'rgb(48, 54, 54)',
      color: 'rgb(229, 227, 220)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'rgba(58, 64, 64, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        padding: '32px',
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(169, 189, 203, 0.2)'
      }}>
        <h1 style={{
          fontSize: '28px',
          marginBottom: '16px',
          color: 'rgb(229, 227, 220)',
          fontWeight: 600
        }}>Intelagent Chatbot Setup</h1>
        
        <p style={{
          fontSize: '14px',
          marginBottom: '24px',
          color: 'rgba(169, 189, 203, 0.9)'
        }}>I'll help you connect your domain and generate your personalized chatbot key.</p>
        
        <div id="chat-log" style={{
          textAlign: 'left',
          height: '400px',
          overflowY: 'auto',
          background: 'rgba(48, 54, 54, 0.6)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          marginBottom: '16px',
          border: '1px solid rgba(169, 189, 203, 0.15)'
        }}></div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input 
            id="chat-input" 
            placeholder="Type your website domain (e.g., example.com)..." 
            type="text"
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid rgba(169, 189, 203, 0.3)',
              borderRadius: '8px',
              background: 'rgba(48, 54, 54, 0.6)',
              color: 'rgb(229, 227, 220)',
              outline: 'none'
            }}
          />
          <button 
            id="send-button"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              borderRadius: '8px',
              background: 'rgb(169, 189, 203)',
              color: 'rgb(48, 54, 54)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >Send</button>
        </div>
        
        <div style={{
          fontSize: '12px',
          color: 'rgba(169, 189, 203, 0.6)',
          textAlign: 'center',
          marginTop: '24px'
        }}>Powered by Intelagent Studios • Pro Platform</div>
      </div>
    </div>
  );
}