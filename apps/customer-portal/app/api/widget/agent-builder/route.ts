import { NextRequest, NextResponse } from 'next/server';

// Special endpoint for the agent builder AI assistant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');
  const config = searchParams.get('config');

  // Validate this is the agent builder key
  if (productKey !== 'PK-AGENT-BUILDER-AI') {
    return NextResponse.json({ error: 'Invalid product key' }, { status: 403 });
  }

  // Parse current configuration
  let currentConfig = {};
  try {
    if (config) {
      currentConfig = JSON.parse(decodeURIComponent(config));
    }
  } catch (e) {
    console.error('Failed to parse config:', e);
  }

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
    }

    .input-field::placeholder {
      color: rgba(169, 189, 203, 0.5);
    }

    .input-field:focus {
      border-color: rgba(169, 189, 203, 0.5);
      background: rgba(30, 33, 33, 0.7);
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
      color: rgb(169, 189, 203);
      padding: 12px;
      border-radius: 8px;
      margin: 8px 0;
      font-size: 13px;
      border: 1px solid rgba(169, 189, 203, 0.2);
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="messages" id="messages">
      <div class="message assistant">
        <div>
          👋 Hello! I'm your AI Configuration Expert. I have access to our complete library of 539+ skills across all categories.
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
        <input
          type="text"
          class="input-field"
          id="userInput"
          placeholder="Describe your business needs..."
          autocomplete="off"
        />
        <button type="submit" class="send-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  </div>

  <script>
    // Current configuration from parent
    let currentConfig = ${JSON.stringify(currentConfig)};

    // Message handling
    const messagesEl = document.getElementById('messages');
    const formEl = document.getElementById('chatForm');
    const inputEl = document.getElementById('userInput');

    // Listen for config updates from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'config-update') {
        currentConfig = event.data.config;
        console.log('Received config update:', currentConfig);
      }
    });

    // Send message using existing chatbot infrastructure
    async function sendMessage(message) {
      // Show user message
      addMessage(message, 'user');

      // Show typing indicator
      const typingId = showTyping();

      try {
        // Use the existing chatbot-skills/modular endpoint like regular chatbots
        const response = await fetch('/api/chatbot-skills/modular', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message + ' [CONTEXT: Agent Builder - Current config has ' +
                     (currentConfig.skills ? currentConfig.skills.length + ' skills' : 'no skills') + ', ' +
                     (currentConfig.features ? currentConfig.features.length + ' features' : 'no features') + ', ' +
                     (currentConfig.integrations ? currentConfig.integrations.length + ' integrations' : 'no integrations') + ']',
            sessionId: 'agent-builder-' + Date.now(),
            productKey: 'PK-AGENT-BUILDER-AI',
            chatHistory: []
          })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTyping(typingId);

        // Show AI response (uses 'response' field from modular endpoint)
        if (data.response) {
          addMessage(data.response, 'assistant');

          // Parse response for skill suggestions
          const skillPattern = /skill[s]?:?\s*([a-z_,\s]+)/gi;
          const matches = data.response.match(skillPattern);

          if (matches) {
            // Extract skill names and update configuration
            const suggestedSkills = [];
            matches.forEach(match => {
              const skills = match.replace(/skill[s]?:?\s*/i, '').split(',').map(s => s.trim());
              suggestedSkills.push(...skills);
            });

            if (suggestedSkills.length > 0) {
              // Send config update to parent with suggested skills
              window.parent.postMessage({
                type: 'agent-config-update',
                config: {
                  skills: [...new Set([...currentConfig.skills || [], ...suggestedSkills])]
                }
              }, '*');

              // Show skill suggestions
              addSkillSuggestions(suggestedSkills.slice(0, 5));
            }
          }
        } else if (data.error) {
          addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }

      } catch (error) {
        console.error('Failed to send message:', error);
        removeTyping(typingId);
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
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
      updateEl.innerHTML = '✨ Configuration updated: ' +
        (config.skills ? config.skills.length + ' skills, ' : '') +
        (config.features ? config.features.length + ' features, ' : '') +
        (config.integrations ? config.integrations.length + ' integrations' : '');
      messagesEl.appendChild(updateEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Add skill suggestions
    function addSkillSuggestions(skills) {
      const suggestionsEl = document.createElement('div');
      suggestionsEl.className = 'message assistant';
      suggestionsEl.innerHTML = '<div>Consider adding these skills:</div>';

      skills.forEach(skill => {
        const skillEl = document.createElement('span');
        skillEl.className = 'skill-suggestion';
        skillEl.textContent = skill.replace(/_/g, ' ');
        skillEl.onclick = () => {
          inputEl.value = 'Add ' + skill.replace(/_/g, ' ') + ' skill';
          formEl.dispatchEvent(new Event('submit'));
        };
        suggestionsEl.appendChild(skillEl);
      });

      messagesEl.appendChild(suggestionsEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Handle form submission
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = inputEl.value.trim();
      if (message) {
        inputEl.value = '';
        await sendMessage(message);
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