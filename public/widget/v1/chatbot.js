/**
 * Intelagent Chatbot Widget Loader v1.0.0
 * Production CDN: https://embed.intelagentstudios.com
 * Usage: <script src="https://embed.intelagentstudios.com/v1/chatbot.js" data-product-key="YOUR_KEY"></script>
 */

(function() {
  'use strict';

  // Get configuration from script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="chatbot.js"]');
  const productKey = currentScript ? currentScript.getAttribute('data-product-key') : null;
  const apiEndpoint = currentScript ? (currentScript.getAttribute('data-api-endpoint') || 'https://dashboard.intelagentstudios.com') : 'https://dashboard.intelagentstudios.com';

  if (!productKey) {
    console.error('[Intelagent Chatbot] Product key is required. Add data-product-key="YOUR_KEY" to the script tag.');
    return;
  }

  // Version tracking for cache busting
  const WIDGET_VERSION = '1.0.0';
  const CACHE_BUSTER = Date.now();

  // Create a unique namespace to avoid conflicts
  window.IntelagentChat = window.IntelagentChat || {};

  // Load the dynamic widget from the API
  function loadWidget() {
    const script = document.createElement('script');
    script.src = `${apiEndpoint}/api/widget/dynamic?key=${productKey}&v=${WIDGET_VERSION}&_t=${CACHE_BUSTER}`;
    script.async = true;
    script.onerror = function() {
      console.error('[Intelagent Chatbot] Failed to load widget. Please check your product key and network connection.');
    };
    script.onload = function() {
      console.log(`[Intelagent Chatbot] Widget v${WIDGET_VERSION} loaded successfully`);
    };
    document.head.appendChild(script);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget);
  } else {
    loadWidget();
  }

  // Public API for programmatic control
  window.IntelagentChat.version = WIDGET_VERSION;
  window.IntelagentChat.open = function() {
    const chatBox = document.getElementById('chatBox');
    const chatButton = document.getElementById('chatButton');
    if (chatBox && chatButton) {
      chatBox.classList.add('open');
      chatButton.style.display = 'none';
    }
  };

  window.IntelagentChat.close = function() {
    const chatBox = document.getElementById('chatBox');
    const chatButton = document.getElementById('chatButton');
    if (chatBox && chatButton) {
      chatBox.classList.remove('open');
      chatButton.style.display = 'flex';
    }
  };

  window.IntelagentChat.sendMessage = function(message) {
    const messageInput = document.getElementById('intelagent-input');
    const sendButton = document.getElementById('intelagent-send');
    if (messageInput && sendButton) {
      messageInput.value = message;
      sendButton.click();
    }
  };
})();