import { NextRequest, NextResponse } from 'next/server';

// Special endpoint for the agent builder AI assistant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');

  // Validate this is the agent builder key
  if (productKey !== 'PK-AGENT-BUILDER-AI') {
    return NextResponse.json({ error: 'Invalid product key' }, { status: 403 });
  }

  // Don't pass context in URL, it's too large
  let currentConfig = {};

  // Generate the widget HTML with special configuration for agent building
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Builder AI Assistant</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e2121;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      max-width: 100%;
      margin: 0 auto;
      background: rgba(30, 33, 33, 0.98);
      backdrop-filter: blur(10px);
      overflow: hidden;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .messages::-webkit-scrollbar {
      width: 8px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background-color: rgba(169, 189, 203, 0.3);
      border-radius: 4px;
    }

    .messages::-webkit-scrollbar-thumb:hover {
      background-color: rgba(169, 189, 203, 0.5);
    }

    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
      align-self: flex-end;
      background: rgba(169, 189, 203, 0.15);
      color: rgb(229, 227, 220);
      border-bottom-right-radius: 4px;
      border: 1px solid rgba(169, 189, 203, 0.2);
    }

    .message.assistant {
      align-self: flex-start;
      background: rgba(58, 64, 64, 0.5);
      color: rgb(229, 227, 220);
      border-bottom-left-radius: 4px;
      border: 1px solid rgba(169, 189, 203, 0.15);
    }

    .message.assistant.typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 16px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      background: rgb(169, 189, 203);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .input-area {
      padding: 20px;
      background: rgba(58, 64, 64, 0.3);
      border-top: 1px solid rgba(169, 189, 203, 0.15);
    }

    .input-form {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .input-field {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid rgba(169, 189, 203, 0.3);
      border-radius: 24px;
      font-size: 15px;
      outline: none;
      transition: all 0.3s ease;
      background: rgba(30, 33, 33, 0.5);
      color: rgb(229, 227, 220);
      resize: none;
      min-height: 48px;
      max-height: 120px;
      overflow-y: auto;
      font-family: inherit;
      line-height: 1.5;
    }

    .input-field::placeholder {
      color: rgba(169, 189, 203, 0.5);
    }

    .input-field:focus {
      border-color: rgba(169, 189, 203, 0.5);
      background: rgba(30, 33, 33, 0.7);
    }

    .input-field::-webkit-scrollbar {
      width: 6px;
    }

    .input-field::-webkit-scrollbar-track {
      background: transparent;
    }

    .input-field::-webkit-scrollbar-thumb {
      background: rgba(169, 189, 203, 0.3);
      border-radius: 3px;
    }

    .file-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: transparent;
      color: rgba(169, 189, 203, 0.6);
      border: 1px solid rgba(169, 189, 203, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      margin-right: 8px;
    }

    .file-button:hover {
      background: rgba(169, 189, 203, 0.1);
      color: rgba(169, 189, 203, 0.8);
      border-color: rgba(169, 189, 203, 0.5);
    }

    .send-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgb(169, 189, 203);
      color: rgb(30, 33, 33);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .send-button:hover {
      transform: scale(1.05);
    }

    .send-button:active {
      transform: scale(0.95);
    }

    .skill-suggestion {
      display: inline-block;
      padding: 6px 12px;
      margin: 4px;
      background: rgba(169, 189, 203, 0.15);
      color: rgb(229, 227, 220);
      border: 1px solid rgba(169, 189, 203, 0.2);
      border-radius: 16px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .skill-suggestion:hover {
      background: rgba(169, 189, 203, 0.25);
      transform: translateY(-1px);
    }

    .config-update {
      background: rgba(169, 189, 203, 0.1);
      color: rgb(229, 227, 220);
      padding: 12px;
      border-radius: 8px;
      margin: 8px 0;
      font-size: 13px;
      border: 1px solid rgba(169, 189, 203, 0.2);
      transition: all 0.2s ease;
      user-select: none;
    }

    .config-update:hover {
      background: rgba(169, 189, 203, 0.15);
      border-color: rgba(169, 189, 203, 0.3);
    }

    .config-update strong {
      color: rgb(169, 189, 203);
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="messages" id="messages">
      <div class="message assistant">
        <div>
          Hello! I'm your AI Configuration Expert. I have access to our complete library of 539+ skills across all categories.
          <br><br>
          Tell me about your business needs, and I'll help you build the perfect AI agent configuration with:
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Optimal skill selection from our catalog</li>
            <li>Smart integrations recommendations</li>
            <li>Volume discount optimization</li>
            <li>Feature suggestions based on your industry</li>
          </ul>
          What kind of AI agent would you like to build today?
        </div>
      </div>
    </div>

    <div class="input-area">
      <form class="input-form" id="chatForm">
        <input type="file" id="fileInput" style="display: none;" accept=".pdf,.doc,.docx,.txt,.csv" />
        <button type="button" class="file-button" onclick="document.getElementById('fileInput').click()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </button>
        <textarea
          class="input-field"
          id="userInput"
          placeholder="Describe your business needs..."
          autocomplete="off"
          rows="1"
        ></textarea>
        <button type="submit" class="send-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14"></path>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </form>
    </div>
  </div>

  <script>
    // Current configuration from parent
    let currentConfig = {};
    let contextData = {};
    let versionInfo = null;

    // Message handling
    const messagesEl = document.getElementById('messages');
    const formEl = document.getElementById('chatForm');
    const inputEl = document.getElementById('userInput');

    // Listen for initial context and config updates from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'initial-context') {
        currentConfig = event.data.config || {};
        contextData = event.data;
        versionInfo = event.data.versionInfo || null;
        console.log('Received initial context with version info:', versionInfo);
      } else if (event.data.type === 'config-update') {
        currentConfig = event.data.config;
        versionInfo = event.data.versionInfo || null;
        console.log('Received config update with version info:', versionInfo);
      }
    });

    // Send message using existing chatbot infrastructure
    async function sendMessage(message) {
      // Show user message
      addMessage(message, 'user');

      // Show typing indicator
      const typingId = showTyping();

      try {
        console.log('Sending message:', message);
        console.log('Current config:', currentConfig);

        // Use the proxy endpoint to avoid CORS issues
        const response = await fetch('/api/chatbot/configurator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message + ' [CONTEXT: Agent Builder - ' + JSON.stringify({
                     skills: currentConfig.skills || [],
                     features: currentConfig.features || [],
                     integrations: currentConfig.integrations || [],
                     availableSkills: contextData.availableSkills || [],
                     availableFeatures: contextData.availableFeatures || [],
                     availableIntegrations: contextData.availableIntegrations || [],
                     pricing: contextData.pricing || {},
                     versionInfo: versionInfo
                   }) + ']'
          })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          console.error('Response not OK:', response.status, response.statusText);
          removeTyping(typingId);
          addMessage('Sorry, the service is temporarily unavailable. Please try again later.', 'assistant');
          return;
        }

        let data;
        try {
          const text = await response.text();
          console.log('Response text:', text.substring(0, 200));
          data = text ? JSON.parse(text) : { response: 'No response received' };
          console.log('Parsed data:', data);
          console.log('Recommendations:', data.recommendations);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          data = { response: 'Sorry, I received an invalid response. Please try again.' };
        }

        // Remove typing indicator
        removeTyping(typingId);

        // Show AI response
        if (data && data.response) {
          console.log('Adding AI response to chat');
          addMessage(data.response, 'assistant');

          // Handle structured response from n8n workflow
          if (data.recommendations && data.recommendations.skills && data.recommendations.skills.length > 0) {
            console.log('Sending skills to parent:', data.recommendations.skills);
            console.log('Action type:', data.recommendations.action);

            // Determine the action based on AI recommendation
            let action = 'set_skills'; // default to replace
            if (data.recommendations.action === 'ADD') {
              action = 'add_skills';
            } else if (data.recommendations.action === 'NONE') {
              action = 'no_change';
            }

            // Send all skill updates to parent at once
            if (action !== 'no_change') {
              window.parent.postMessage({
                type: 'agent-config-update',
                config: {
                  action: action,
                  skills: data.recommendations.skills
                }
              }, '*');
            }

            // Show visual feedback with pricing info
            if (data.recommendations.pricing) {
              const pricing = data.recommendations.pricing;
              addConfigUpdate({
                skills: data.recommendations.skills,
                pricing: pricing
              });
            } else {
              // If no pricing, just show skills
              addConfigUpdate({
                skills: data.recommendations.skills,
                message: 'Skills recommended based on your needs'
              });
            }
          }

          // Handle any actions from the response
          if (data.actions && data.actions.length > 0) {
            data.actions.forEach(action => {
              if (action.type === 'add_skill' && action.skill) {
                // Already handled above
                console.log('Skill action:', action.skill);
              }
            });
          }
        } else if (data.error) {
          console.log('Error in response:', data.error);
          addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        } else {
          console.log('No response field in data:', data);
          addMessage('I received your message but got an unexpected response format. Please try again.', 'assistant');
        }

      } catch (error) {
        console.error('Failed to send message:', error);
        removeTyping(typingId);

        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          addMessage('Connection error. Please check your internet connection and try again.', 'assistant');
        } else {
          addMessage('Sorry, I encountered an error processing your request. Please try again.', 'assistant');
        }

        // Prevent any page reload
        return false;
      }
    }

    // Add message to chat
    function addMessage(text, sender) {
      const messageEl = document.createElement('div');
      messageEl.className = 'message ' + sender;
      messageEl.innerHTML = text;
      messagesEl.appendChild(messageEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Show typing indicator
    function showTyping() {
      const typingEl = document.createElement('div');
      const id = 'typing-' + Date.now();
      typingEl.id = id;
      typingEl.className = 'message assistant typing';
      typingEl.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
      messagesEl.appendChild(typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return id;
    }

    // Remove typing indicator
    function removeTyping(id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }

    // Add config update notification
    function addConfigUpdate(config) {
      const updateEl = document.createElement('div');
      updateEl.className = 'config-update';
      updateEl.style.cursor = 'pointer';

      const summary = document.createElement('div');
      summary.style.display = 'flex';
      summary.style.justifyContent = 'space-between';
      summary.style.alignItems = 'center';
      summary.innerHTML =
        '<span>✅ Configuration updated: ' +
        (config.skills ? config.skills.length + ' skills' : '') +
        (config.pricing ? ' - Total: £' + config.pricing.total + '/month' : '') +
        '</span>' +
        '<span style="font-size: 12px; opacity: 0.7;">▼ Click to expand</span>';

      const details = document.createElement('div');
      details.style.display = 'none';
      details.style.marginTop = '10px';
      details.style.paddingTop = '10px';
      details.style.borderTop = '1px solid rgba(169, 189, 203, 0.2)';

      let detailsHTML = '<strong>Added Skills:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
      if (config.skills && config.skills.length > 0) {
        config.skills.forEach(skill => {
          detailsHTML += '<li>' + skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + '</li>';
        });
      }
      detailsHTML += '</ul>';

      if (config.pricing) {
        detailsHTML += '<strong>Pricing Breakdown:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
        detailsHTML += '<li>Base Platform: £' + config.pricing.base + '/month</li>';
        detailsHTML += '<li>Skills (' + (config.skills ? config.skills.length : 0) + '): £' + config.pricing.skills + '/month</li>';
        if (config.pricing.discount) {
          detailsHTML += '<li>Volume Discount: ' + config.pricing.discount + '</li>';
        }
        detailsHTML += '<li><strong>Total: £' + config.pricing.total + '/month</strong></li>';
        detailsHTML += '</ul>';
      }

      if (config.message) {
        detailsHTML += '<p style="margin-top: 10px; font-style: italic;">' + config.message + '</p>';
      }

      details.innerHTML = detailsHTML;

      updateEl.appendChild(summary);
      updateEl.appendChild(details);

      // Toggle expansion on click
      updateEl.addEventListener('click', function() {
        if (details.style.display === 'none') {
          details.style.display = 'block';
          summary.querySelector('span:last-child').innerHTML = '▲ Click to collapse';
        } else {
          details.style.display = 'none';
          summary.querySelector('span:last-child').innerHTML = '▼ Click to expand';
        }
      });

      messagesEl.appendChild(updateEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }


    // Handle form submission
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = inputEl.value.trim();
      if (message) {
        inputEl.value = '';
        adjustTextareaHeight(); // Reset height after sending
        try {
          await sendMessage(message);
        } catch (error) {
          console.error('Error sending message:', error);
          addMessage('Sorry, there was an error sending your message. Please try again.', 'assistant');
        }
      }
    });

    // Auto-expand textarea as content grows
    function adjustTextareaHeight() {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    }

    // Handle textarea expansion on input
    inputEl.addEventListener('input', adjustTextareaHeight);

    // Handle Enter key for send (Shift+Enter for new line)
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        formEl.dispatchEvent(new Event('submit'));
      }
    });

    // Handle file upload
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Show file name in chat
        addMessage('📎 Attached: ' + file.name, 'user');
        // You can process the file here if needed
        console.log('File attached:', file.name, file.type, file.size);
        // Reset file input
        e.target.value = '';
      }
    });

    // Focus input on load
    inputEl.focus();
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'SAMEORIGIN', // Only allow embedding from same origin
    },
  });
}