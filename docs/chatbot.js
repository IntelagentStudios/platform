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
  if (document.getElementById('intelagent-chat-widget-container')) {
    return;
  }

  // Create styles
  const style = document.createElement('style');
  style.textContent = `
    #intelagent-chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    #intelagent-chat-button {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    }
    
    #intelagent-chat-button:hover {
      transform: scale(1.05);
    }
    
    #intelagent-chat-window {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    
    #intelagent-chat-window.open {
      display: flex;
    }
    
    #intelagent-chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #intelagent-close {
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }
    
    #intelagent-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #fafafa;
    }
    
    .intelagent-message {
      margin: 10px 0;
      display: flex;
    }
    
    .intelagent-message.user {
      justify-content: flex-end;
    }
    
    .intelagent-message.bot {
      justify-content: flex-start;
    }
    
    .intelagent-message-bubble {
      max-width: 70%;
      padding: 10px 15px;
      border-radius: 18px;
      word-wrap: break-word;
    }
    
    .intelagent-message.user .intelagent-message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .intelagent-message.bot .intelagent-message-bubble {
      background: white;
      color: #333;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    #intelagent-input-container {
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      background: white;
    }
    
    #intelagent-input-wrapper {
      display: flex;
      gap: 10px;
    }
    
    #intelagent-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 20px;
      outline: none;
      font-size: 14px;
    }
    
    #intelagent-input:focus {
      border-color: #667eea;
    }
    
    #intelagent-send {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    
    #intelagent-send:hover {
      opacity: 0.9;
    }
    
    @media (max-width: 480px) {
      #intelagent-chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Create widget HTML
  const container = document.createElement('div');
  container.id = 'intelagent-chat-widget-container';
  
  container.innerHTML = `
    <div id="intelagent-chat-button">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>
    <div id="intelagent-chat-window">
      <div id="intelagent-chat-header">
        <span>Chat Support</span>
        <span id="intelagent-close">&times;</span>
      </div>
      <div id="intelagent-messages"></div>
      <div id="intelagent-input-container">
        <div id="intelagent-input-wrapper">
          <input id="intelagent-input" type="text" placeholder="Type your message..." />
          <button id="intelagent-send">Send</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  // Widget functionality
  const button = document.getElementById('intelagent-chat-button');
  const chatWindow = document.getElementById('intelagent-chat-window');
  const messagesDiv = document.getElementById('intelagent-messages');
  const input = document.getElementById('intelagent-input');
  const sendBtn = document.getElementById('intelagent-send');
  const closeBtn = document.getElementById('intelagent-close');
  
  let sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Toggle chat window
  button.addEventListener('click', function() {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open') && messagesDiv.children.length === 0) {
      addMessage('bot', 'Hello! How can I help you today?');
      input.focus();
    }
  });
  
  closeBtn.addEventListener('click', function() {
    chatWindow.classList.remove('open');
  });
  
  // Add message to chat
  function addMessage(type, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'intelagent-message ' + type;
    
    const bubble = document.createElement('div');
    bubble.className = 'intelagent-message-bubble';
    bubble.innerHTML = text;
    
    msgDiv.appendChild(bubble);
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  // Send message to webhook
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    
    addMessage('user', message);
    input.value = '';
    
    // Add typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'intelagent-message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="intelagent-message-bubble">...</div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    try {
      const response = await fetch('https://1ntelagent.up.railway.app/webhook/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          productKey: productKey
        })
      });
      
      // Remove typing indicator
      typingDiv.remove();
      
      const data = await response.json();
      const botResponse = data.message || data.response || data.chatbot_response || 'I apologize, but I encountered an error.';
      addMessage('bot', botResponse);
      
    } catch (error) {
      console.error('Chat error:', error);
      // Remove typing indicator
      document.getElementById('typing-indicator')?.remove();
      addMessage('bot', 'Sorry, I am having trouble connecting. Please try again later.');
    }
  }
  
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
  
  console.log('IntelagentChat: Widget loaded successfully');
})();