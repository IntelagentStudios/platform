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

    let knowledgeFiles = [];
    try {
      knowledgeFiles = await prisma.knowledge_files.findMany({
        where: { product_key: productKey },
        select: { filename: true, content: true }
      });
    } catch (error) {
      console.log('Knowledge files table not available:', error);
    }

    let customKnowledge = [];
    try {
      customKnowledge = await prisma.custom_knowledge.findMany({
        where: { product_key: productKey, is_active: true },
        select: { content: true, knowledge_type: true }
      });
      
      if (customKnowledge.length === 0 && productKeyInfo.license_key) {
        customKnowledge = await prisma.custom_knowledge.findMany({
          where: { license_key: productKeyInfo.license_key, is_active: true },
          select: { content: true, knowledge_type: true }
        });
      }
    } catch (error) {
      console.log('Custom knowledge table not available:', error);
    }

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
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};
    
    const version = Date.now();

    // Widget script that fetches config dynamically
    const widgetScript = `
(function() {
  console.log('[IntelagentChat] Loading version ${version}');
  const PRODUCT_KEY = '${productKey}';
  
  // Fetch configuration dynamically
  async function loadWidgetConfig() {
    try {
      // Use the same origin as the widget script for config API
      const scriptTag = document.querySelector('script[src*="/api/widget/dynamic"]');
      const widgetOrigin = scriptTag ? new URL(scriptTag.src).origin : 'https://dashboard.intelagentstudios.com';
      const configUrl = widgetOrigin + '/api/widget/config?key=' + PRODUCT_KEY;
      
      console.log('[IntelagentChat] Fetching config for key:', PRODUCT_KEY);
      console.log('[IntelagentChat] Config URL:', configUrl);
      
      const response = await fetch(configUrl);
      const data = await response.json();
      console.log('[IntelagentChat] Config response:', data);
      
      if (data.config) {
        console.log('[IntelagentChat] Using config:', data.config);
        return data.config;
      }
      
      console.log('[IntelagentChat] No config found, using defaults');
      return {
        themeColor: '#0070f3',
        widgetTitle: 'Chat Assistant',
        titleColor: '#ffffff',
        welcomeMessage: 'How can I help you today?',
        responseStyle: 'professional',
        autoReopenOnResponse: true
      };
    } catch (error) {
      console.error('[IntelagentChat] Failed to load widget config:', error);
      return {
        themeColor: '#0070f3',
        widgetTitle: 'Chat Assistant',
        titleColor: '#ffffff',
        welcomeMessage: 'How can I help you today?',
        responseStyle: 'professional',
        autoReopenOnResponse: true
      };
    }
  }
  
  // Initialize widget with fetched config
  loadWidgetConfig().then(function(WIDGET_CONFIG) {
    console.log('[IntelagentChat] Final config being applied:', WIDGET_CONFIG);
  
  if (document.getElementById('intelagent-chat-widget')) {
    document.getElementById('intelagent-chat-widget').remove();
  }

  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'intelagent-chat-widget';
  widgetContainer.style.cssText = 'position: fixed; z-index: 999999; bottom: 0; right: 0;';
  document.body.appendChild(widgetContainer);

  let sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  let chatHistory = [];

  // Fixed position (bottom-right)
  const buttonPosition = 'bottom: 28px;';
  const buttonSide = 'right: 28px;';
  const boxPosition = 'bottom: 120px;';
  const boxSide = 'right: 28px;';
  
  
  // Ensure color is in proper format
  let userMsgColor = WIDGET_CONFIG.themeColor || '#0070f3';
  console.log('[IntelagentChat] Theme color from config:', WIDGET_CONFIG.themeColor);
  console.log('[IntelagentChat] Widget title from config:', WIDGET_CONFIG.widgetTitle);
  console.log('[IntelagentChat] Title color from config:', WIDGET_CONFIG.titleColor);
  
  // Remove # if present and ensure it's 6 characters
  userMsgColor = userMsgColor.replace('#', '');
  if (userMsgColor.length === 3) {
    // Convert 3-char hex to 6-char (e.g., 'f00' -> 'ff0000')
    userMsgColor = userMsgColor.split('').map(c => c + c).join('');
  }
  // Add back the # for use in CSS
  userMsgColor = '#' + userMsgColor;
  
  // Create a style element with dynamic values
  const styleElement = document.createElement('style');
  styleElement.id = 'intelagent-dynamic-styles';
  
  // Remove any existing dynamic styles
  const existingStyle = document.getElementById('intelagent-dynamic-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  styleElement.textContent = [
    '@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");',
    '#intelagent-chat-widget * { box-sizing: border-box !important; margin: 0; padding: 0; font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }',
    '.intelagent-chat-button { position: fixed; ' + buttonPosition + ' ' + buttonSide,
    'background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px) saturate(150%);',
    '-webkit-backdrop-filter: blur(12px) saturate(150%); border: 1px solid rgba(255, 255, 255, 0.4);',
    'border-radius: 50%; width: 68px; height: 68px; display: flex; justify-content: center;',
    'align-items: center; cursor: pointer; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);',
    'z-index: 1000000; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }',
    '.intelagent-chat-button:hover { transform: scale(1.05); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15); }',
    '.intelagent-chat-box { position: fixed; ' + boxPosition + ' ' + boxSide,
    'width: 400px; height: 600px; max-height: calc(100vh - 150px);',
    'background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(24px) saturate(150%);',
    '-webkit-backdrop-filter: blur(24px) saturate(150%); border: 1px solid rgba(255, 255, 255, 0.3);',
    'border-radius: 20px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1); display: none;',
    'flex-direction: column; overflow: hidden; z-index: 999999; }',
    '.intelagent-chat-box.open { display: flex; }',
    // Header with theme color
    '.intelagent-chat-header {',
    'background: linear-gradient(135deg, ' + userMsgColor + 'dd 0%, ' + userMsgColor + 'cc 100%) !important;',
    'color: ' + (WIDGET_CONFIG.titleColor || '#ffffff') + ' !important;',
    'font-weight: 600 !important; font-size: 16px !important; }',
    // User messages with theme color
    '.intelagent-message.user .intelagent-message-content {',
    'background: linear-gradient(135deg, ' + userMsgColor + 'ee 0%, ' + userMsgColor + 'dd 100%) !important;',
    'color: white !important; border-bottom-right-radius: 6px; }',
    // Send button with theme color
    '.intelagent-send-button { background: ' + userMsgColor + '15 !important; }',
    '.intelagent-send-button:hover { background: ' + userMsgColor + '30 !important; }',
    '.intelagent-send-button svg { fill: ' + userMsgColor + ' !important; }',
    // Chat button with theme accent
    '.intelagent-chat-button {',
    'background: linear-gradient(135deg, white 0%, ' + userMsgColor + '10 100%) !important; }',
    '.intelagent-chat-button svg { fill: ' + userMsgColor + ' !important; }',
    // Close and new buttons
    '.intelagent-close-button { color: white !important; }',
    '.intelagent-new-button { color: white !important; }',
    // Footer and disclaimer with theme color
    '.intelagent-ai-disclaimer {',
    'background: ' + userMsgColor + '10 !important;',
    'border-top: 1px solid ' + userMsgColor + '30 !important; }',
    '.intelagent-chat-footer {',
    'background: linear-gradient(135deg, ' + userMsgColor + 'dd 0%, ' + userMsgColor + 'cc 100%) !important;',
    'color: white !important; }',
    // Input field focus border
    '.intelagent-chat-input textarea:focus {',
    'border-color: ' + userMsgColor + ' !important;',
    'box-shadow: 0 0 0 2px ' + userMsgColor + '20 !important; }'
  ].join(' ');
  
  // Append the style element to the head
  document.head.appendChild(styleElement);
  
  console.log('[IntelagentChat] Dynamic styles applied with color:', userMsgColor);
  console.log('[IntelagentChat] Full CSS for user messages:', '.intelagent-message.user .intelagent-message-content { background: linear-gradient(135deg, ' + userMsgColor + 'ee 0%, ' + userMsgColor + 'dd 100%) !important; }');
  
  widgetContainer.innerHTML = \`
    <style>
      .intelagent-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      }
      .intelagent-chat-button svg {
        width: 30px;
        height: 30px;
        fill: #666;
      }
      
      /* Additional button hover styles */
      .intelagent-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      }
      .intelagent-chat-button svg {
        width: 30px;
        height: 30px;
        fill: #666;
      }
      
      .intelagent-chat-box.open {
        display: flex;
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
        padding: 20px 24px !important;
        font-size: 17px;
        letter-spacing: -0.02em;
        color: #1a1a1a;
        font-weight: 600;
        border-bottom: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
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
        flex: 1 1 auto;
        padding: 20px !important;
        overflow-y: auto;
        font-size: 14.5px;
        color: #333;
        line-height: 1.5;
        scroll-behavior: smooth;
        background: transparent;
        min-height: 0;
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
        margin: 25px 0 !important; /* INCREASED FROM 16px */
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
        padding: 14px 20px !important;
        border-radius: 18px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        font-size: 14.5px;
        line-height: 1.5;
        letter-spacing: -0.01em;
      }
      
      /* User message colors are set dynamically above */
      
      .intelagent-message.bot .intelagent-message-content {
        background: rgba(243, 243, 243, 0.9);
        color: #1a1a1a;
        border-bottom-left-radius: 6px;
      }
      
      .intelagent-chat-input {
        display: flex;
        border-top: none;
        padding: 20px 25px !important; /* INCREASED FROM 12px 16px */
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        gap: 10px;
        align-items: center;
        flex-shrink: 0;
      }
      
      .intelagent-chat-input textarea {
        flex-grow: 1;
        padding: 12px 18px !important; /* INCREASED FROM 6px 12px */
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        font-family: 'Inter', sans-serif;
        background: white;
        resize: none;
        height: 40px; /* INCREASED FROM 32px */
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
        padding: 15px 25px !important; /* INCREASED FROM 8px 16px */
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: none;
        line-height: 1.4;
        flex-shrink: 0;
      }
      
      .intelagent-chat-footer {
        font-size: 11px;
        text-align: center;
        color: #999;
        padding: 18px !important; /* INCREASED FROM 10px */
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        flex-shrink: 0;
      }
      
      .intelagent-typing-indicator {
        display: inline-block;
        padding: 18px 25px !important; /* INCREASED FROM 12px 18px */
        background: rgba(243, 243, 243, 0.9);
        border-radius: 18px;
        border-bottom-left-radius: 6px;
        margin: 25px 0 !important; /* INCREASED FROM 16px */
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
    </style>
    
    <div class="intelagent-chat-button" id="chatButton">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>

    <div class="intelagent-chat-box" id="chatBox">
      <div class="intelagent-chat-header">
        <span id="widget-title">Chat Assistant</span>
        <div style="display: flex; gap: 6px;">
          <button class="intelagent-new-button" aria-label="New conversation">↺</button>
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

  const chatButton = document.getElementById('chatButton');
  const chatBox = document.getElementById('chatBox');
  const closeButton = document.querySelector('.intelagent-close-button');
  const newButton = document.querySelector('.intelagent-new-button');
  const messageInput = document.getElementById('intelagent-input');
  const sendButton = document.getElementById('intelagent-send');
  const messagesContainer = document.getElementById('intelagent-messages');
  const widgetTitle = document.getElementById('widget-title');
  
  // Update widget title from config
  if (widgetTitle && WIDGET_CONFIG.widgetTitle) {
    widgetTitle.textContent = WIDGET_CONFIG.widgetTitle;
  }
  
  // Update title color if specified
  if (WIDGET_CONFIG.titleColor) {
    const headerElement = document.querySelector('.intelagent-chat-header');
    if (headerElement) {
      headerElement.style.color = WIDGET_CONFIG.titleColor + ' !important';
    }
  }
  
  // Add initial message
  messagesContainer.innerHTML = '<div class="intelagent-message bot"><div class="intelagent-message-content">' + WIDGET_CONFIG.welcomeMessage + '</div></div>';
  
  chatButton.addEventListener('click', () => {
    chatBox.classList.add('open');
    chatButton.style.display = 'none';
    messageInput.focus();
  });
  
  closeButton.addEventListener('click', () => {
    chatBox.classList.remove('open');
    chatButton.style.display = 'flex';
  });
  
  newButton.addEventListener('click', () => {
    if (confirm('Start a new conversation?')) {
      chatHistory = [];
      messagesContainer.innerHTML = '<div class="intelagent-message bot"><div class="intelagent-message-content">' + WIDGET_CONFIG.welcomeMessage + '</div></div>';
    }
  });
  
  messageInput.addEventListener('input', function() {
    this.style.height = '40px';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
  
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Add user message
    const userDiv = document.createElement('div');
    userDiv.className = 'intelagent-message user';
    userDiv.innerHTML = '<div class="intelagent-message-content">' + message + '</div>';
    messagesContainer.appendChild(userDiv);
    
    messageInput.value = '';
    messageInput.style.height = '40px';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'intelagent-typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
      // Use the same origin for API calls
      const scriptTag = document.querySelector('script[src*="/api/widget/dynamic"]');
      const apiOrigin = scriptTag ? new URL(scriptTag.src).origin : 'https://dashboard.intelagentstudios.com';
      
      const response = await fetch(apiOrigin + '/api/chatbot-skills/modular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          productKey: PRODUCT_KEY,
          chatHistory: chatHistory
        })
      });
      
      const data = await response.json();
      typingDiv.remove();
      
      const botDiv = document.createElement('div');
      botDiv.className = 'intelagent-message bot';
      botDiv.innerHTML = '<div class="intelagent-message-content">' + (data.response || 'Sorry, I could not process your request.') + '</div>';
      messagesContainer.appendChild(botDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Auto-reopen widget when bot responds (if enabled)
      if (WIDGET_CONFIG.autoReopenOnResponse && !chatBox.classList.contains('open')) {
        chatBox.classList.add('open');
        chatButton.style.display = 'none';
      }
      
    } catch (error) {
      typingDiv.remove();
      const errorDiv = document.createElement('div');
      errorDiv.className = 'intelagent-message bot';
      errorDiv.innerHTML = '<div class="intelagent-message-content">Sorry, there was an error. Please try again.</div>';
      messagesContainer.appendChild(errorDiv);
    }
  }
  
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  }); // End of loadWidgetConfig().then()
})();
`;

    return new NextResponse(widgetScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error generating dynamic widget:', error);
    return new NextResponse(`// Error: ${error}`, {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}