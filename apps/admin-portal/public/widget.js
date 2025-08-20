// Intelagent Chatbot Widget
(function() {
  'use strict';
  
  // Configuration
  const WIDGET_URL = 'https://chat.intelagent.ai'; // Update this to your actual chatbot URL
  const API_ENDPOINT = 'https://api.intelagent.ai/chat'; // Update this to your actual API endpoint
  
  // Get the API key from the script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const apiKey = new URLSearchParams(currentScript.src.split('?')[1]).get('id');
  
  if (!apiKey) {
    console.error('Intelagent Chatbot: No API key provided');
    return;
  }
  
  // Create the chat widget iframe
  function createChatWidget() {
    // Create container
    const container = document.createElement('div');
    container.id = 'intelagent-chatbot-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 600px;
      max-width: 90vw;
      max-height: 80vh;
      z-index: 99999;
      display: none;
      flex-direction: column;
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: #2563eb;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%;"></div>
        <span style="font-weight: 600;">Support Assistant</span>
      </div>
      <button id="intelagent-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">×</button>
    `;
    
    // Create iframe for chat interface
    const iframe = document.createElement('iframe');
    iframe.id = 'intelagent-chatbot-iframe';
    iframe.src = `${WIDGET_URL}?apiKey=${apiKey}&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      flex: 1;
    `;
    
    // Create chat button
    const chatButton = document.createElement('button');
    chatButton.id = 'intelagent-chat-button';
    chatButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2563eb;
      border: none;
      cursor: pointer;
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
    `;
    chatButton.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    `;
    
    chatButton.onmouseover = function() {
      this.style.transform = 'scale(1.1)';
    };
    
    chatButton.onmouseout = function() {
      this.style.transform = 'scale(1)';
    };
    
    // Add components to container
    container.appendChild(header);
    container.appendChild(iframe);
    
    // Add to page
    document.body.appendChild(container);
    document.body.appendChild(chatButton);
    
    // Handle open/close
    chatButton.onclick = function() {
      container.style.display = 'flex';
      chatButton.style.display = 'none';
    };
    
    document.getElementById('intelagent-close').onclick = function() {
      container.style.display = 'none';
      chatButton.style.display = 'flex';
    };
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== WIDGET_URL) return;
      
      // Handle different message types
      if (event.data.type === 'resize') {
        container.style.height = event.data.height + 'px';
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
})();