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

    // Get knowledge files from new table (if it exists)
    let knowledgeFiles = [];
    try {
      knowledgeFiles = await prisma.knowledge_files.findMany({
        where: { 
          product_key: productKey
        },
        select: {
          filename: true,
          content: true
        }
      });
    } catch (error) {
      console.log('Knowledge files table not available:', error);
      // Continue without files
    }

    // Get legacy custom knowledge
    let customKnowledge = [];
    try {
      customKnowledge = await prisma.custom_knowledge.findMany({
        where: { 
          product_key: productKey,  // Try product_key first
          is_active: true
        },
        select: {
          content: true,
          knowledge_type: true
        }
      });
      
      // If no knowledge found with product_key, try license_key
      if (customKnowledge.length === 0) {
        customKnowledge = await prisma.custom_knowledge.findMany({
          where: { 
            license_key: productKeyInfo.license_key,
            is_active: true
          },
          select: {
            content: true,
            knowledge_type: true
          }
        });
      }
    } catch (error) {
      console.log('Custom knowledge table not available:', error);
      // Continue without custom knowledge
    }

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

    // Generate the complete dynamic widget script matching static widget exactly
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
  function getOrCreateSessionId() {
    const lastActivity = localStorage.getItem('intelagent_last_activity');
    const existingSessionId = localStorage.getItem('intelagent_session_id');
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (!existingSessionId || !lastActivity || 
        (Date.now() - parseInt(lastActivity)) > thirtyMinutes) {
      const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('intelagent_session_id', newSessionId);
      localStorage.setItem('intelagent_last_activity', Date.now().toString());
      localStorage.removeItem('intelagent_chat_history');
      return newSessionId;
    }
    
    localStorage.setItem('intelagent_last_activity', Date.now().toString());
    return existingSessionId;
  }
  
  let sessionId = getOrCreateSessionId();
  let chatHistory = loadChatHistory();

  // Load chat history from localStorage
  function loadChatHistory() {
    const savedHistory = localStorage.getItem('intelagent_chat_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  }

  // Save chat history to localStorage
  function saveChatHistory(messages) {
    localStorage.setItem('intelagent_chat_history', JSON.stringify(messages));
    localStorage.setItem('intelagent_last_activity', Date.now().toString());
  }

  // Clear chat history and start new conversation
  function startNewConversation() {
    localStorage.removeItem('intelagent_chat_history');
    localStorage.removeItem('intelagent_session_id');
    localStorage.removeItem('intelagent_last_activity');
    chatHistory = [];
    sessionId = getOrCreateSessionId();
    renderMessages();
  }

  // Initialize widget HTML with exact styles from static widget
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
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px) saturate(150%);
          -webkit-backdrop-filter: blur(12px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          width: 68px;
          height: 68px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          z-index: 1000000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .intelagent-chat-button:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        .intelagent-chat-button svg {
          width: 30px;
          height: 30px;
          fill: #666;
        }
        
        .intelagent-chat-box {
          position: fixed;
          bottom: 120px;
          \${WIDGET_CONFIG.position === 'bottom-left' ? 'left: 28px;' : 'right: 28px;'}
          width: 380px;
          max-height: 600px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
          overflow: hidden;
          z-index: 999999;
          font-family: 'Inter', sans-serif;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
          background-color: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 20px 24px;
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
          border-bottom: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .intelagent-close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: #888;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .intelagent-close-button:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #333;
          transform: scale(1.1);
        }
        
        .intelagent-new-button {
          background: none;
          border: none;
          color: #888;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
          font-weight: normal;
        }
        
        .intelagent-new-button:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #333;
          transform: rotate(-45deg);
        }
        
        .intelagent-chat-messages {
          flex-grow: 1;
          padding: 24px;
          overflow-y: auto;
          font-size: 16px;
          color: #333;
          line-height: 1.6;
          scroll-behavior: smooth;
          background: transparent;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar-track {
          background: rgba(241, 241, 241, 0.3);
          border-radius: 3px;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(136, 136, 136, 0.4);
          border-radius: 3px;
        }
        
        .intelagent-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(85, 85, 85, 0.6);
        }
        
        .intelagent-message {
          margin: 16px 0;
          display: flex;
          align-items: flex-start;
          animation: fadeInUp 0.3s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .intelagent-message.user {
          justify-content: flex-end;
        }
        
        .intelagent-message.bot {
          justify-content: flex-start;
        }
        
        .intelagent-message-content {
          max-width: 75%;
          padding: 12px 18px;
          border-radius: 18px;
          word-wrap: break-word;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .intelagent-message.user .intelagent-message-content {
          background: linear-gradient(135deg, rgba(59, 59, 59, 0.95) 0%, rgba(41, 41, 41, 0.95) 100%);
          color: white;
          border-bottom-right-radius: 6px;
        }
        
        .intelagent-message.bot .intelagent-message-content {
          background: rgba(243, 243, 243, 0.9);
          color: #1a1a1a;
          border-bottom-left-radius: 6px;
        }
        
        .intelagent-message.bot .intelagent-message-content a {
          color: #0066cc;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .intelagent-message.bot .intelagent-message-content a:hover {
          color: #0052a3;
          text-decoration: underline;
        }
        
        .intelagent-message strong {
          display: block;
          font-size: 13px;
          margin-bottom: 6px;
          opacity: 0.6;
          font-weight: 500;
        }
        
        .intelagent-chat-input {
          display: flex;
          border-top: none;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          gap: 10px;
          align-items: center;
        }
        
        .intelagent-chat-input textarea {
          flex-grow: 1;
          padding: 6px 12px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          font-family: 'Inter', sans-serif;
          background: white;
          resize: none;
          height: 32px;
          overflow: hidden;
          line-height: 20px;
          transition: border-color 0.2s, background 0.2s;
        }
        
        .intelagent-chat-input textarea:focus {
          border-color: rgba(0, 0, 0, 0.4);
          background: white;
        }
        
        .intelagent-send-button {
          background: none;
          color: #666;
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        
        .intelagent-send-button:hover {
          background: rgba(0, 0, 0, 0.05);
          transform: scale(1.05);
        }
        
        .intelagent-send-button:hover svg {
          fill: #333;
        }
        
        .intelagent-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .intelagent-send-button svg {
          width: 20px;
          height: 20px;
          fill: #666;
        }
        
        .intelagent-ai-disclaimer {
          font-size: 10px;
          text-align: center;
          color: #888;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: none;
          line-height: 1.4;
        }
        
        .intelagent-chat-footer {
          font-size: 11px;
          text-align: center;
          color: #999;
          padding: 10px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .intelagent-typing-indicator {
          display: inline-block;
          padding: 12px 18px;
          background: rgba(243, 243, 243, 0.9);
          border-radius: 18px;
          border-bottom-left-radius: 6px;
          margin: 16px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .intelagent-typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin: 0 3px;
          background: rgba(153, 153, 153, 0.6);
          border-radius: 50%;
          animation: intelagent-blink 1.4s infinite both;
        }
        
        .intelagent-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .intelagent-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes intelagent-blink {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        pre {
          background: rgba(244, 244, 244, 0.9);
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 14px;
          margin: 8px 0;
        }
        
        @media (max-width: 480px) {
          .intelagent-chat-box {
            width: calc(100vw - 32px);
            right: 16px;
            bottom: 100px;
            max-height: 70vh;
          }
          .intelagent-chat-button {
            right: 16px;
            bottom: 16px;
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
          <span>Chat Assistant</span>
          <div style="display: flex; gap: 6px;">
            <button class="intelagent-new-button" aria-label="New conversation" title="Start new conversation">↺</button>
            <button class="intelagent-close-button" aria-label="Close chat">⨯</button>
          </div>
        </div>
        <div class="intelagent-chat-messages" id="intelagent-messages"></div>
        <div class="intelagent-chat-input">
          <textarea id="intelagent-input" placeholder="Type your message..." rows="1"></textarea>
          <button class="intelagent-send-button" id="intelagent-send" aria-label="Send message">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div class="intelagent-ai-disclaimer">AI can make mistakes. Please confirm important information with the company.</div>
        <div class="intelagent-chat-footer">Powered by Intelagent Studios</div>
      </div>
    \`;

    // Function to render all messages
    function renderMessages() {
      const messagesDiv = document.getElementById('intelagent-messages');
      messagesDiv.innerHTML = '';
      
      // Add initial bot message if no history
      if (chatHistory.length === 0) {
        const initialMsg = {
          type: 'bot',
          content: WIDGET_CONFIG.welcomeMessage,
          timestamp: new Date().toISOString()
        };
        chatHistory.push(initialMsg);
        saveChatHistory(chatHistory);
      }
      
      // Render all messages
      chatHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'intelagent-message ' + msg.type;
        messageDiv.innerHTML = '<div class="intelagent-message-content">' + msg.content + '</div>';
        messagesDiv.appendChild(messageDiv);
      });
      
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Add event listeners
    const chatButton = document.getElementById('chatButton');
    const chatBox = document.getElementById('chatBox');
    const closeButton = document.querySelector('.intelagent-close-button');
    const newButton = document.querySelector('.intelagent-new-button');
    const messageInput = document.getElementById('intelagent-input');
    const sendButton = document.getElementById('intelagent-send');
    const messagesContainer = document.getElementById('intelagent-messages');
    
    let isOpen = false;
    let isSending = false;
    
    chatButton.addEventListener('click', () => {
      isOpen = true;
      chatBox.style.display = 'flex';
      chatButton.style.display = 'none';
      renderMessages();
      messageInput.focus();
    });
    
    closeButton.addEventListener('click', () => {
      isOpen = false;
      chatBox.style.display = 'none';
      chatButton.style.display = 'flex';
    });
    
    newButton.addEventListener('click', () => {
      if (confirm('Start a new conversation? This will clear the current chat history.')) {
        startNewConversation();
      }
    });
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
      this.style.height = '32px';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message || isSending) return;
      
      isSending = true;
      sendButton.disabled = true;
      
      // Add user message
      const userMsg = {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      chatHistory.push(userMsg);
      saveChatHistory(chatHistory);
      renderMessages();
      
      // Clear input
      messageInput.value = '';
      messageInput.style.height = '32px';
      
      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = 'intelagent-typing-indicator';
      typingDiv.innerHTML = '<span></span><span></span><span></span>';
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      try {
        const response = await fetch('https://dashboard.intelagentstudios.com/api/chatbot-skills/modular', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            sessionId: sessionId,
            productKey: PRODUCT_KEY,
            chatHistory: chatHistory.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          })
        });

        const data = await response.json();
        
        // Remove typing indicator
        typingDiv.remove();
        
        // Add bot response
        const botMsg = {
          type: 'bot',
          content: data.response || 'I apologize, but I couldn\\'t process your request. Please try again.',
          timestamp: new Date().toISOString()
        };
        chatHistory.push(botMsg);
        saveChatHistory(chatHistory);
        renderMessages();
        
      } catch (error) {
        console.error('Error sending message:', error);
        typingDiv.remove();
        
        const errorMsg = {
          type: 'bot',
          content: 'I\\'m having trouble connecting. Please check your internet connection and try again.',
          timestamp: new Date().toISOString()
        };
        chatHistory.push(errorMsg);
        saveChatHistory(chatHistory);
        renderMessages();
      } finally {
        isSending = false;
        sendButton.disabled = false;
        messageInput.focus();
      }
    }
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Initialize the widget
  initWidget();

})();
`;

    // Return the script as JavaScript
    return new NextResponse(widgetScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error generating dynamic widget:', error);
    return new NextResponse(`// Error generating widget: ${error}`, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}