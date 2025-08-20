// Intelagent Chatbot Widget with n8n Integration
(function() {
  'use strict';
  
  // Configuration
  const WIDGET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3003' : 'https://chat.intelagent.ai';
  const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/chatbot'; // Update with your n8n webhook URL
  const API_ENDPOINT = window.location.hostname === 'localhost' ? 'http://localhost:3003/api/chat' : 'https://api.intelagent.ai/chat';
  
  // Get the site key from the script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="widget"]');
  const siteKey = currentScript.getAttribute('data-site') || new URLSearchParams(currentScript.src.split('?')[1]).get('id');
  const useN8n = currentScript.getAttribute('data-n8n') === 'true';
  
  if (!siteKey) {
    console.error('Intelagent Chatbot: No site key provided');
    return;
  }
  
  let sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let chatHistory = [];
  
  // Create the chat widget with beautiful glassmorphism styling
  function createChatWidget() {
    // Create container with glassmorphism effects
    const container = document.createElement('div');
    container.id = 'intelagent-chatbot-container';
    container.style.cssText = `
      position: fixed;
      bottom: 110px;
      right: 28px;
      width: 380px;
      height: 600px;
      max-width: 90vw;
      max-height: 80vh;
      z-index: 999999;
      display: none;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(24px) saturate(150%);
      -webkit-backdrop-filter: blur(24px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Create header with glassmorphism
    const header = document.createElement('div');
    header.style.cssText = `
      background-color: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 20px 24px;
      font-size: 20px;
      color: #1a1a1a;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
        <span>Intelagent Support</span>
        ${useN8n ? '<span style="font-size: 12px; opacity: 0.6;">(AI Enhanced)</span>' : ''}
      </div>
      <button id="intelagent-close" style="
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      ">×</button>
    `;
    
    // Create messages container with custom scrollbar
    const messagesContainer = document.createElement('div');
    messagesContainer.id = 'intelagent-messages';
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: rgba(249, 250, 251, 0.5);
    `;
    
    // Add welcome message
    messagesContainer.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="
          display: inline-block;
          max-width: 80%;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        ">
          <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.5;">
            Hello! 👋 I'm your Intelagent assistant. How can I help you today?
          </p>
        </div>
      </div>
    `;
    
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      padding: 20px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(226, 232, 240, 0.5);
      display: flex;
      gap: 12px;
    `;
    
    const input = document.createElement('input');
    input.id = 'intelagent-input';
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 12px 16px;
      background: rgba(249, 250, 251, 0.8);
      border: 1px solid rgba(203, 213, 224, 0.5);
      border-radius: 12px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    `;
    input.addEventListener('focus', () => {
      input.style.borderColor = 'rgba(102, 126, 234, 0.5)';
      input.style.background = 'rgba(255, 255, 255, 0.9)';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = 'rgba(203, 213, 224, 0.5)';
      input.style.background = 'rgba(249, 250, 251, 0.8)';
    });
    
    const sendButton = document.createElement('button');
    sendButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;
    sendButton.style.cssText = `
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    `;
    sendButton.addEventListener('mouseenter', () => {
      sendButton.style.transform = 'scale(1.05)';
      sendButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });
    sendButton.addEventListener('mouseleave', () => {
      sendButton.style.transform = 'scale(1)';
      sendButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });
    
    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);
    
    // Create chat button with glassmorphism
    const chatButton = document.createElement('button');
    chatButton.id = 'intelagent-chat-button';
    chatButton.style.cssText = `
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px) saturate(150%);
      -webkit-backdrop-filter: blur(12px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.4);
      cursor: pointer;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    chatButton.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    `;
    
    chatButton.addEventListener('mouseenter', () => {
      chatButton.style.transform = 'scale(1.08)';
      chatButton.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
    });
    chatButton.addEventListener('mouseleave', () => {
      chatButton.style.transform = 'scale(1)';
      chatButton.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
    });
    
    // Add components to container
    container.appendChild(header);
    container.appendChild(messagesContainer);
    container.appendChild(inputContainer);
    
    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      #intelagent-messages::-webkit-scrollbar {
        width: 6px;
      }
      #intelagent-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      #intelagent-messages::-webkit-scrollbar-thumb {
        background: rgba(203, 213, 224, 0.5);
        border-radius: 3px;
      }
      #intelagent-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(160, 174, 192, 0.5);
      }
      
      .intelagent-message-appear {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(container);
    document.body.appendChild(chatButton);
    
    // Handle open/close
    chatButton.onclick = function() {
      container.style.display = 'flex';
      chatButton.style.display = 'none';
      input.focus();
    };
    
    document.getElementById('intelagent-close').onclick = function() {
      container.style.display = 'none';
      chatButton.style.display = 'flex';
    };
    
    // Handle sending messages
    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage(message, 'user');
      input.value = '';
      
      // Update chat history
      chatHistory.push({ role: 'user', content: message });
      
      // Show typing indicator
      const typingId = showTypingIndicator();
      
      try {
        let response, data;
        
        if (useN8n) {
          // Use n8n webhook for double agent system
          response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              site_key: siteKey,
              session_id: sessionId,
              chat_history: chatHistory.map(h => `${h.role}: ${h.content}`).join('\n')
            })
          });
          
          data = await response.json();
        } else {
          // Use direct OpenAI API
          response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              apiKey: siteKey,
              sessionId: sessionId,
              context: 'Website: ' + window.location.hostname
            })
          });
          
          data = await response.json();
        }
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        if (response.ok && (data.response || data.output)) {
          const botResponse = data.response || data.output || data.message;
          // Add bot response
          addMessage(botResponse, 'bot');
          chatHistory.push({ role: 'assistant', content: botResponse });
          
          // Update session ID if provided
          if (data.sessionId || data.session_id) {
            sessionId = data.sessionId || data.session_id;
          }
        } else {
          addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
        }
      } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addMessage('Sorry, I\'m having trouble connecting. Please check your internet connection and try again.', 'bot');
      }
    }
    
    function addMessage(text, sender) {
      const messagesEl = document.getElementById('intelagent-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'intelagent-message-appear';
      messageDiv.style.cssText = `margin-bottom: 16px; display: flex; ${sender === 'user' ? 'justify-content: flex-end;' : ''}`;
      
      const bubble = document.createElement('div');
      bubble.style.cssText = `
        display: inline-block;
        max-width: 80%;
        padding: 14px 18px;
        background: ${sender === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)'};
        backdrop-filter: blur(8px);
        color: ${sender === 'user' ? 'white' : '#2d3748'};
        border-radius: 18px;
        box-shadow: 0 2px 8px ${sender === 'user' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(0,0,0,0.06)'};
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      `;
      
      // Parse text for links and formatting
      if (sender === 'bot') {
        bubble.innerHTML = formatBotMessage(text);
      } else {
        bubble.textContent = text;
      }
      
      messageDiv.appendChild(bubble);
      messagesEl.appendChild(messageDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    function formatBotMessage(text) {
      // Convert markdown-style links and basic formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #667eea; text-decoration: underline;">$1</a>')
        .replace(/\n/g, '<br>');
    }
    
    function showTypingIndicator() {
      const messagesEl = document.getElementById('intelagent-messages');
      const typingDiv = document.createElement('div');
      const typingId = 'typing_' + Date.now();
      typingDiv.id = typingId;
      typingDiv.className = 'intelagent-message-appear';
      typingDiv.style.cssText = 'margin-bottom: 16px;';
      typingDiv.innerHTML = `
        <div style="
          display: inline-block;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        ">
          <div style="display: flex; gap: 4px; align-items: center;">
            <div style="width: 8px; height: 8px; background: #718096; border-radius: 50%; animation: pulse 1.4s infinite;"></div>
            <div style="width: 8px; height: 8px; background: #718096; border-radius: 50%; animation: pulse 1.4s infinite; animation-delay: 0.2s;"></div>
            <div style="width: 8px; height: 8px; background: #718096; border-radius: 50%; animation: pulse 1.4s infinite; animation-delay: 0.4s;"></div>
          </div>
        </div>
      `;
      messagesEl.appendChild(typingDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return typingId;
    }
    
    function removeTypingIndicator(typingId) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) {
        typingEl.remove();
      }
    }
    
    // Handle enter key
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', sendMessage);
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
})();