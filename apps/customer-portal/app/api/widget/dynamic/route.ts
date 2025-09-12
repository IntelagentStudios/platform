import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');
  
  if (!productKey) {
    return new NextResponse('// Error: Product key required. Use ?key=YOUR_PRODUCT_KEY', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  try {
    // Get the product key info and settings
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyInfo || productKeyInfo.status !== 'active') {
      return new NextResponse(`// Error: Invalid or inactive product key: ${productKey}`, {
        status: 404,
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    // Get knowledge files from new table
    const knowledgeFiles = await prisma.knowledge_files.findMany({
      where: { 
        product_key: productKey
      },
      select: {
        filename: true,
        content: true
      }
    });

    // Get legacy custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        license_key: productKeyInfo.license_key,
        is_active: true
      },
      select: {
        content: true,
        knowledge_type: true
      }
    });

    // Combine all knowledge
    const knowledgePieces: string[] = [];
    
    // Add files
    for (const file of knowledgeFiles) {
      knowledgePieces.push(`[File: ${file.filename}]\n${file.content}`);
    }
    
    // Add legacy custom knowledge
    for (const k of customKnowledge) {
      if (k.knowledge_type !== 'file') {
        knowledgePieces.push(`[${k.knowledge_type}]\n${k.content}`);
      }
    }
    
    const combinedKnowledge = knowledgePieces.join('\n\n---\n\n');

    // Get settings from metadata - handle nested structure
    const metadata = productKeyInfo.metadata as any;
    // The structure is metadata.settings based on your config check
    const settings = metadata?.settings || {};
    
    // Debug logging
    console.log('[Widget Dynamic] Raw metadata:', metadata);
    console.log('[Widget Dynamic] Extracted settings:', settings);
    
    // Simplified configuration - use the actual saved settings
    const config = {
      themeColor: settings.themeColor || '#0070f3',
      position: settings.position || 'bottom-right',
      welcomeMessage: settings.welcomeMessage || 'Hello! How can I help you today?',
      responseStyle: settings.responseStyle || 'professional'
    };
    
    console.log('[Widget Dynamic] Final config for', productKey, ':', config);

    // Generate the complete dynamic widget script
    const widgetScript = `
(function() {
  // Configuration for ${productKey}
  const WIDGET_CONFIG = ${JSON.stringify(config, null, 2)};
  const PRODUCT_KEY = '${productKey}';
  const CUSTOM_KNOWLEDGE = ${JSON.stringify(combinedKnowledge)};
  const HAS_KNOWLEDGE = ${combinedKnowledge.length > 0};
  
  console.log('[IntelagentChat] Initializing with product key:', PRODUCT_KEY);
  console.log('[IntelagentChat] Custom knowledge loaded:', HAS_KNOWLEDGE ? 'Yes (' + CUSTOM_KNOWLEDGE.length + ' chars)' : 'No');

  // Check if widget already exists
  if (document.getElementById('intelagent-chat-widget')) {
    console.log('[IntelagentChat] Widget already exists, removing old instance');
    document.getElementById('intelagent-chat-widget').remove();
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'intelagent-chat-widget';
  widgetContainer.style.cssText = \`
    position: fixed;
    bottom: 0;
    \${WIDGET_CONFIG.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
    z-index: 999999;
  \`;
  document.body.appendChild(widgetContainer);

  // Generate session ID
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Initialize widget HTML with all styles
  function initWidget() {
    widgetContainer.innerHTML = \`
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
          \${WIDGET_CONFIG.position === 'bottom-left' ? 'left: 28px;' : 'right: 28px;'}
          background: \${WIDGET_CONFIG.themeColor};
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
          \${WIDGET_CONFIG.position === 'bottom-left' ? 'left: 28px;' : 'right: 28px;'}
          width: 380px;
          max-width: calc(100vw - 56px);
          height: 600px;
          max-height: calc(100vh - 150px);
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          background: \${WIDGET_CONFIG.themeColor};
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        
        .intelagent-chat-header h3 {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
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
          background: white;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
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
          word-wrap: break-word;
        }
        
        .intelagent-chat-message.bot .intelagent-chat-message-content {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }
        
        .intelagent-chat-message.user .intelagent-chat-message-content {
          background: \${WIDGET_CONFIG.themeColor};
          color: white;
        }
        
        .intelagent-chat-message-content a {
          color: \${WIDGET_CONFIG.themeColor};
          text-decoration: underline;
        }
        
        .intelagent-chat-message.user .intelagent-chat-message-content a {
          color: white;
        }
        
        .intelagent-typing {
          display: none;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 18px;
          width: fit-content;
        }
        
        .intelagent-typing.active {
          display: block;
        }
        
        .intelagent-typing-dots {
          display: flex;
          gap: 4px;
        }
        
        .intelagent-typing-dot {
          width: 8px;
          height: 8px;
          background: #666;
          border-radius: 50%;
          animation: typingDot 1.4s infinite;
        }
        
        .intelagent-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .intelagent-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
        
        .intelagent-chat-input-container {
          padding: 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          background: white;
          flex-shrink: 0;
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          outline: none;
          transition: border-color 0.2s;
          background: white;
        }
        
        .intelagent-chat-input:focus {
          border-color: \${WIDGET_CONFIG.themeColor};
        }
        
        .intelagent-chat-send {
          background: \${WIDGET_CONFIG.themeColor};
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        
        .intelagent-chat-send:hover {
          transform: scale(1.05);
        }
        
        .intelagent-chat-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .intelagent-chat-send svg {
          width: 20px;
          height: 20px;
          fill: white;
        }
        
        @media (max-width: 480px) {
          .intelagent-chat-box {
            width: calc(100vw - 32px);
            height: calc(100vh - 100px);
            bottom: 90px;
            left: 16px !important;
            right: 16px !important;
          }
          
          .intelagent-chat-button {
            width: 60px;
            height: 60px;
            bottom: 20px;
            \${WIDGET_CONFIG.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          }
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
              \${WIDGET_CONFIG.welcomeMessage}
            </div>
          </div>
          <div class="intelagent-typing" id="typingIndicator">
            <div class="intelagent-typing-dots">
              <div class="intelagent-typing-dot"></div>
              <div class="intelagent-typing-dot"></div>
              <div class="intelagent-typing-dot"></div>
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
              autocomplete="off"
            />
            <button class="intelagent-chat-send" id="sendButton">
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    \`;

    // Add event listeners
    const chatButton = document.getElementById('chatButton');
    const chatBox = document.getElementById('chatBox');
    const closeButton = document.getElementById('closeButton');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesContainer = document.getElementById('messages');
    const typingIndicator = document.getElementById('typingIndicator');
    
    let isOpen = false;
    let isSending = false;
    
    chatButton.addEventListener('click', () => {
      isOpen = true;
      chatBox.classList.add('open');
      chatButton.style.display = 'none';
      messageInput.focus();
    });
    
    closeButton.addEventListener('click', () => {
      isOpen = false;
      chatBox.classList.remove('open');
      chatButton.style.display = 'flex';
    });
    
    function playNotificationSound() {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    function showTypingIndicator() {
      typingIndicator.classList.add('active');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function hideTypingIndicator() {
      typingIndicator.classList.remove('active');
    }
    
    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || isSending) return;
      
      isSending = true;
      sendButton.disabled = true;
      
      // Add user message to chat
      const userMessageDiv = document.createElement('div');
      userMessageDiv.className = 'intelagent-chat-message user';
      userMessageDiv.innerHTML = \`<div class="intelagent-chat-message-content">\${escapeHtml(message)}</div>\`;
      messagesContainer.insertBefore(userMessageDiv, typingIndicator);
      
      messageInput.value = '';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Show typing indicator
      showTypingIndicator();
      
      // Send to webhook with custom knowledge
      try {
        const webhookData = {
          message: message,
          session_id: sessionId,  // n8n expects snake_case
          product_key: PRODUCT_KEY,  // n8n expects snake_case
          site_key: PRODUCT_KEY,  // backward compatibility
          timestamp: new Date().toISOString(),
          customKnowledge: CUSTOM_KNOWLEDGE,
          responseStyle: WIDGET_CONFIG.responseStyle,
          domain: window.location.hostname,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        };
        
        console.log('[IntelagentChat] Sending message:', {
          message: message,
          hasKnowledge: HAS_KNOWLEDGE,
          knowledgeLength: CUSTOM_KNOWLEDGE ? CUSTOM_KNOWLEDGE.length : 0,
          responseStyle: WIDGET_CONFIG.responseStyle
        });
        
        const response = await fetch('https://n8n.intelagentstudios.com/webhook/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response to chat
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'intelagent-chat-message bot';
        
        // Process response to handle links properly
        let processedResponse = data.response || 'I understand your message. How else can I help you?';
        
        // Convert URLs to proper links that open in new window
        processedResponse = processedResponse.replace(
          /(https?:\\/\\/[^\\s]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        botMessageDiv.innerHTML = \`<div class="intelagent-chat-message-content">\${processedResponse}</div>\`;
        messagesContainer.insertBefore(botMessageDiv, typingIndicator);
        
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
        console.error('[IntelagentChat] Error sending message:', error);
        hideTypingIndicator();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'intelagent-chat-message bot';
        errorDiv.innerHTML = '<div class="intelagent-chat-message-content">Sorry, I encountered an error. Please try again.</div>';
        messagesContainer.insertBefore(errorDiv, typingIndicator);
      } finally {
        isSending = false;
        sendButton.disabled = false;
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    console.log('[IntelagentChat] Widget initialized successfully with theme color:', WIDGET_CONFIG.themeColor);
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
`;

    return new NextResponse(widgetScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Product-Key': productKey,
        'X-Has-Knowledge': String(customKnowledge.length > 0)
      }
    });
  } catch (error) {
    console.error('Error generating dynamic widget:', error);
    return new NextResponse(`// Error: Failed to generate widget for ${productKey}\n// ${error}`, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}