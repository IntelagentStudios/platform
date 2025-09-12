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
    }

    // Get legacy custom knowledge
    let customKnowledge = [];
    try {
      customKnowledge = await prisma.custom_knowledge.findMany({
        where: { 
          product_key: productKey,
          is_active: true
        },
        select: {
          content: true,
          knowledge_type: true
        }
      });
      
      // If no knowledge found with product_key, try license_key
      if (customKnowledge.length === 0 && productKeyInfo.license_key) {
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
    }

    // Combine all knowledge
    const knowledgePieces: string[] = [];
    
    for (const file of knowledgeFiles) {
      knowledgePieces.push(`[File: ${file.filename}]\n${file.content}`);
    }
    
    for (const k of customKnowledge) {
      if (k.knowledge_type !== 'file') {
        knowledgePieces.push(`[${k.knowledge_type}]\n${k.content}`);
      }
    }
    
    const combinedKnowledge = knowledgePieces.join('\n\n---\n\n');

    // Get settings from metadata
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};
    
    const config = {
      themeColor: settings.themeColor || '#0070f3',
      position: settings.position || 'bottom-right',
      welcomeMessage: settings.welcomeMessage || 'How can I help you today?',
      responseStyle: settings.responseStyle || 'professional'
    };

    // Add timestamp to force refresh
    const version = Date.now();

    // Generate widget with VERY OBVIOUS padding and spacing
    const widgetScript = `
(function() {
  // Force refresh with version: ${version}
  console.log('[IntelagentChat] Loading version ${version}');
  
  const WIDGET_CONFIG = ${JSON.stringify(config, null, 2)};
  const PRODUCT_KEY = '${productKey}';
  const CUSTOM_KNOWLEDGE = ${JSON.stringify(combinedKnowledge)};
  const HAS_KNOWLEDGE = ${combinedKnowledge.length > 0};
  
  // Remove any existing widget
  if (document.getElementById('intelagent-chat-widget')) {
    document.getElementById('intelagent-chat-widget').remove();
  }

  // Create container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'intelagent-chat-widget';
  widgetContainer.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 999999;';
  document.body.appendChild(widgetContainer);

  // Session management
  function getOrCreateSessionId() {
    const existingSessionId = localStorage.getItem('intelagent_session_id');
    if (!existingSessionId) {
      const newSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('intelagent_session_id', newSessionId);
      return newSessionId;
    }
    return existingSessionId;
  }
  
  let sessionId = getOrCreateSessionId();
  let chatHistory = JSON.parse(localStorage.getItem('intelagent_chat_history') || '[]');

  function saveChatHistory(messages) {
    localStorage.setItem('intelagent_chat_history', JSON.stringify(messages));
  }

  // Initialize widget with MASSIVE padding for visibility
  widgetContainer.innerHTML = \`
    <style>
      #intelagent-chat-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .icw-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #0070f3;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .icw-button svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      .icw-chat {
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      .icw-chat.open {
        display: flex;
      }
      
      /* HEADER WITH LARGE PADDING */
      .icw-header {
        background: #f8f9fa;
        padding: 25px 30px;
        border-bottom: 2px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      
      .icw-header-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .icw-header-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 5px;
      }
      
      /* MESSAGES AREA WITH LARGE PADDING */
      .icw-messages {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        background: #ffffff;
      }
      
      /* MESSAGE WITH SPACING */
      .icw-message {
        margin-bottom: 25px;
        display: flex;
      }
      
      .icw-message.user {
        justify-content: flex-end;
      }
      
      .icw-message.bot {
        justify-content: flex-start;
      }
      
      /* MESSAGE BUBBLE WITH LARGE PADDING */
      .icw-bubble {
        max-width: 70%;
        padding: 15px 20px;
        border-radius: 12px;
        font-size: 15px;
        line-height: 1.5;
      }
      
      .icw-message.user .icw-bubble {
        background: #0070f3;
        color: white;
      }
      
      .icw-message.bot .icw-bubble {
        background: #f1f3f5;
        color: #333;
      }
      
      /* INPUT AREA WITH LARGE PADDING */
      .icw-input-area {
        padding: 20px 25px;
        background: #f8f9fa;
        border-top: 2px solid #e0e0e0;
        display: flex;
        gap: 15px;
        flex-shrink: 0;
      }
      
      .icw-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 15px;
        outline: none;
      }
      
      .icw-input:focus {
        border-color: #0070f3;
      }
      
      .icw-send {
        padding: 10px 20px;
        background: #0070f3;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        cursor: pointer;
      }
      
      .icw-send:hover {
        background: #0051cc;
      }
      
      /* FOOTER WITH PADDING */
      .icw-footer {
        padding: 15px 20px;
        background: #f8f9fa;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        font-size: 12px;
        color: #666;
        flex-shrink: 0;
      }
    </style>
    
    <button class="icw-button" id="icwButton">
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </button>
    
    <div class="icw-chat" id="icwChat">
      <div class="icw-header">
        <div class="icw-header-title">Chat Support</div>
        <button class="icw-header-close" id="icwClose">×</button>
      </div>
      
      <div class="icw-messages" id="icwMessages">
        <div class="icw-message bot">
          <div class="icw-bubble">\${WIDGET_CONFIG.welcomeMessage}</div>
        </div>
      </div>
      
      <div class="icw-input-area">
        <input type="text" class="icw-input" id="icwInput" placeholder="Type your message...">
        <button class="icw-send" id="icwSend">Send</button>
      </div>
      
      <div class="icw-footer">
        Powered by Intelagent Studios
      </div>
    </div>
  \`;

  // Event listeners
  const button = document.getElementById('icwButton');
  const chat = document.getElementById('icwChat');
  const closeBtn = document.getElementById('icwClose');
  const input = document.getElementById('icwInput');
  const sendBtn = document.getElementById('icwSend');
  const messagesDiv = document.getElementById('icwMessages');
  
  button.addEventListener('click', () => {
    chat.classList.add('open');
    button.style.display = 'none';
    input.focus();
  });
  
  closeBtn.addEventListener('click', () => {
    chat.classList.remove('open');
    button.style.display = 'flex';
  });
  
  // Function to add message
  function addMessage(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'icw-message ' + (isUser ? 'user' : 'bot');
    messageDiv.innerHTML = '<div class="icw-bubble">' + content + '</div>';
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  // Send message
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    input.value = '';
    
    // Save to history
    chatHistory.push({ type: 'user', content: message });
    saveChatHistory(chatHistory);
    
    try {
      const response = await fetch('https://dashboard.intelagentstudios.com/api/chatbot-skills/modular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          productKey: PRODUCT_KEY,
          chatHistory: chatHistory.slice(-10)
        })
      });
      
      const data = await response.json();
      
      // Add bot response
      addMessage(data.response || 'Sorry, I could not process your request.', false);
      
      // Save to history
      chatHistory.push({ type: 'bot', content: data.response });
      saveChatHistory(chatHistory);
      
    } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, there was an error. Please try again.', false);
    }
  }
  
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();
`;

    // Return the script
    return new NextResponse(widgetScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'X-Version': version.toString()
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