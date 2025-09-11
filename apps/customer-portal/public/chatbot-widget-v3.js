(function() {
  // Get the product key from the script tag
  const script = document.currentScript;
  const productKey = script.getAttribute('data-product-key') || 
                     script.getAttribute('data-site-key') || 
                     script.getAttribute('data-site');
  
  if (!productKey) {
    console.error('IntelagentChat: No product key provided. Use data-product-key attribute.');
    return;
  }
  
  console.log('IntelagentChat: Initializing with product key:', productKey);

  // Check if widget already exists
  if (document.getElementById('intelagent-chat-widget')) {
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'intelagent-chat-widget';
  widgetContainer.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 999999;
  `;
  document.body.appendChild(widgetContainer);

  // Generate session ID
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  let currentConfig = null;
  let customKnowledge = null;

  // Fetch configuration from API
  async function fetchConfig() {
    try {
      const response = await fetch(`https://dashboard.intelagentstudios.com/api/widget/config?key=${productKey}`);
      if (response.ok) {
        const data = await response.json();
        return data.config;
      }
    } catch (error) {
      console.error('Failed to fetch widget config:', error);
    }
    
    // Return default config if fetch fails
    return {
      primaryColor: '#0070f3',
      headerColor: '#0070f3',
      backgroundColor: '#ffffff',
      welcomeMessage: 'Hello! How can I help you today?',
      position: 'bottom-right',
      responseStyle: 'professional'
    };
  }

  // Fetch custom knowledge
  async function fetchCustomKnowledge() {
    try {
      const response = await fetch('https://dashboard.intelagentstudios.com/api/chatbot/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productKey })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.knowledge || null;
      }
    } catch (error) {
      console.error('Failed to fetch custom knowledge:', error);
    }
    return null;
  }

  // Apply configuration to widget
  function applyConfiguration(config) {
    currentConfig = config;
    
    // Update CSS variables for dynamic theming
    const style = document.getElementById('intelagent-chat-style') || document.createElement('style');
    style.id = 'intelagent-chat-style';
    style.textContent = `
      :root {
        --intelagent-primary: ${config.primaryColor};
        --intelagent-header: ${config.headerColor};
        --intelagent-bg: ${config.backgroundColor};
      }
    `;
    if (!document.getElementById('intelagent-chat-style')) {
      document.head.appendChild(style);
    }

    // Update position
    widgetContainer.style[config.position === 'bottom-left' ? 'left' : 'right'] = '0';
    widgetContainer.style[config.position === 'bottom-left' ? 'right' : 'left'] = 'auto';
  }

  // Initialize widget
  async function initWidget() {
    // Fetch configuration
    const config = await fetchConfig();
    applyConfiguration(config);
    
    // Fetch custom knowledge
    customKnowledge = await fetchCustomKnowledge();
    console.log('Custom knowledge loaded:', customKnowledge ? 'Yes' : 'No');
    
    // Create widget HTML
    widgetContainer.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        #intelagent-chat-widget * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .intelagent-chat-button {
          position: fixed;
          bottom: 28px;
          ${config.position === 'bottom-left' ? 'left: 28px;' : 'right: 28px;'}
          background: var(--intelagent-primary, ${config.primaryColor});
          border-radius: 50%;
          width: 68px;
          height: 68px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .intelagent-chat-button:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        .intelagent-chat-button svg {
          width: 30px;
          height: 30px;
          fill: white;
        }
        
        .intelagent-chat-box {
          position: fixed;
          bottom: 120px;
          ${config.position === 'bottom-left' ? 'left: 28px;' : 'right: 28px;'}
          width: 380px;
          max-height: 600px;
          background: var(--intelagent-bg, ${config.backgroundColor});
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        
        .intelagent-chat-box.open {
          display: flex;
          animation: smoothSlideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes smoothSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .intelagent-chat-header {
          background: var(--intelagent-header, ${config.headerColor});
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .intelagent-chat-header h3 {
          font-size: 17px;
          font-weight: 600;
        }
        
        .intelagent-chat-close {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background 0.2s;
        }
        
        .intelagent-chat-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .intelagent-chat-close svg {
          width: 16px;
          height: 16px;
          fill: white;
        }
        
        .intelagent-chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: var(--intelagent-bg, ${config.backgroundColor});
        }
        
        .intelagent-chat-message {
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          animation: messageSlide 0.3s ease-out;
        }
        
        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .intelagent-chat-message.user {
          flex-direction: row-reverse;
        }
        
        .intelagent-chat-message-content {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .intelagent-chat-message.bot .intelagent-chat-message-content {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }
        
        .intelagent-chat-message.user .intelagent-chat-message-content {
          background: var(--intelagent-primary, ${config.primaryColor});
          color: white;
        }
        
        .intelagent-chat-message-content a {
          color: var(--intelagent-primary, ${config.primaryColor});
          text-decoration: underline;
        }
        
        .intelagent-chat-message.user .intelagent-chat-message-content a {
          color: white;
        }
        
        .intelagent-chat-input-container {
          padding: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          background: var(--intelagent-bg, ${config.backgroundColor});
        }
        
        .intelagent-chat-input-wrapper {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .intelagent-chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 24px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .intelagent-chat-input:focus {
          border-color: var(--intelagent-primary, ${config.primaryColor});
        }
        
        .intelagent-chat-send {
          background: var(--intelagent-primary, ${config.primaryColor});
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .intelagent-chat-send:hover {
          transform: scale(1.05);
        }
        
        .intelagent-chat-send svg {
          width: 20px;
          height: 20px;
          fill: white;
        }
      </style>
      
      <div class="intelagent-chat-button" id="chatButton">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>

      <div class="intelagent-chat-box" id="chatBox">
        <div class="intelagent-chat-header">
          <h3>Chat Support</h3>
          <button class="intelagent-chat-close" id="closeButton">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="intelagent-chat-messages" id="messages">
          <div class="intelagent-chat-message bot">
            <div class="intelagent-chat-message-content">
              ${config.welcomeMessage}
            </div>
          </div>
        </div>
        <div class="intelagent-chat-input-container">
          <div class="intelagent-chat-input-wrapper">
            <input 
              type="text" 
              class="intelagent-chat-input" 
              id="messageInput"
              placeholder="Type your message..."
            />
            <button class="intelagent-chat-send" id="sendButton">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const chatButton = document.getElementById('chatButton');
    const chatBox = document.getElementById('chatBox');
    const closeButton = document.getElementById('closeButton');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesContainer = document.getElementById('messages');
    
    chatButton.addEventListener('click', () => {
      chatBox.classList.add('open');
      chatButton.style.display = 'none';
      messageInput.focus();
    });
    
    closeButton.addEventListener('click', () => {
      chatBox.classList.remove('open');
      chatButton.style.display = 'flex';
    });
    
    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;
      
      // Add user message to chat
      const userMessageDiv = document.createElement('div');
      userMessageDiv.className = 'intelagent-chat-message user';
      userMessageDiv.innerHTML = `<div class="intelagent-chat-message-content">${message}</div>`;
      messagesContainer.appendChild(userMessageDiv);
      
      messageInput.value = '';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Refresh custom knowledge if needed
      if (!customKnowledge) {
        customKnowledge = await fetchCustomKnowledge();
      }
      
      // Send to n8n webhook with custom knowledge
      try {
        const webhookData = {
          message: message,
          sessionId: sessionId,
          productKey: productKey,
          timestamp: new Date().toISOString(),
          customKnowledge: customKnowledge,
          responseStyle: currentConfig.responseStyle || 'professional',
          domain: window.location.hostname
        };
        
        console.log('Sending to webhook with custom knowledge:', webhookData);
        
        const response = await fetch('https://n8n.intelagentstudios.com/webhook/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        const data = await response.json();
        
        // Add bot response to chat
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'intelagent-chat-message bot';
        
        // Process response to handle links properly
        let processedResponse = data.response || 'I understand your message. How else can I help you?';
        
        // Convert URLs to proper links that open in new window
        processedResponse = processedResponse.replace(
          /(https?:\/\/[^\s]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        botMessageDiv.innerHTML = `<div class="intelagent-chat-message-content">${processedResponse}</div>`;
        messagesContainer.appendChild(botMessageDiv);
        
        // Add click handlers to prevent navigation
        const links = botMessageDiv.querySelectorAll('a');
        links.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(link.href, '_blank');
          });
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (error) {
        console.error('Error sending message:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'intelagent-chat-message bot';
        errorDiv.innerHTML = '<div class="intelagent-chat-message-content">Sorry, I encountered an error. Please try again.</div>';
        messagesContainer.appendChild(errorDiv);
      }
    }
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Refresh configuration every 30 seconds
    setInterval(async () => {
      const newConfig = await fetchConfig();
      if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
        console.log('Configuration updated, applying changes...');
        applyConfiguration(newConfig);
        
        // Update colors dynamically
        const chatButton = document.querySelector('.intelagent-chat-button');
        const chatHeader = document.querySelector('.intelagent-chat-header');
        const chatBox = document.querySelector('.intelagent-chat-box');
        const sendButton = document.querySelector('.intelagent-chat-send');
        const userMessages = document.querySelectorAll('.intelagent-chat-message.user .intelagent-chat-message-content');
        
        if (chatButton) chatButton.style.background = newConfig.primaryColor;
        if (chatHeader) chatHeader.style.background = newConfig.headerColor;
        if (chatBox) chatBox.style.background = newConfig.backgroundColor;
        if (sendButton) sendButton.style.background = newConfig.primaryColor;
        
        userMessages.forEach(msg => {
          msg.style.background = newConfig.primaryColor;
        });
      }
      
      // Also refresh custom knowledge
      const newKnowledge = await fetchCustomKnowledge();
      if (newKnowledge !== customKnowledge) {
        console.log('Custom knowledge updated');
        customKnowledge = newKnowledge;
      }
    }, 30000);
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();