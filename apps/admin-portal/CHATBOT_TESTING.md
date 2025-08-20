# Chatbot Testing Guide

## ✅ Setup Complete

Your AI Chatbot is now fully integrated with OpenAI and ready for testing!

## 🚀 Quick Test

### 1. Server is Running
The admin portal is running at: http://localhost:3003

### 2. Test the Chat API
You can test the API directly with this command:
```bash
curl -X POST http://localhost:3003/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","apiKey":"ik_test_key_12345","sessionId":"test_1"}'
```

### 3. Test with the Widget
Open the test page in your browser:
```
http://localhost:3003/test-chatbot.html
```

Look for the purple chat bubble in the bottom-right corner!

## 🎯 What's Working

- ✅ **OpenAI Integration**: Using GPT-3.5-turbo for responses
- ✅ **Conversation Memory**: Maintains context across messages
- ✅ **Beautiful UI**: Modern chat interface with typing indicators
- ✅ **API Endpoints**: RESTful API for chat messages
- ✅ **Session Management**: Tracks conversations per user
- ✅ **Error Handling**: Graceful fallbacks if API fails

## 💬 Sample Conversations

Try these questions to test the chatbot:
1. "What products do you offer?"
2. "Tell me about the AI Chatbot"
3. "How much does the Sales Agent cost?"
4. "Can you help me choose the right product?"
5. "What's included with the Setup Agent?"

## 🔧 Configuration

Your OpenAI API key is configured in `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...
```

## 📝 Widget Installation

To add the chatbot to any website:

1. Go to Admin Portal → Products → AI Chatbot
2. Enter your website URL
3. Copy the embed code
4. Paste it before `</body>` in your HTML

Or use this test code:
```html
<script>
(function() {
  var script = document.createElement('script');
  script.async = true;
  script.src = 'http://localhost:3003/widget.js?id=ik_test_key_12345';
  document.head.appendChild(script);
})();
</script>
```

## 🎨 Features

The chatbot includes:
- Real-time typing indicators
- Conversation history
- Mobile-responsive design
- Smooth animations
- Session persistence
- Token usage tracking

## 📊 API Response Format

```json
{
  "response": "AI generated response",
  "sessionId": "session_id",
  "timestamp": "2025-08-20T13:00:00.000Z",
  "usage": {
    "promptTokens": 91,
    "completionTokens": 68,
    "totalTokens": 159
  }
}
```

## 🚦 Next Steps

1. **Test on your website**: Add the widget to your actual website
2. **Customize appearance**: Modify colors and position in the chatbot settings
3. **Train with your data**: Add FAQs and company-specific information
4. **Monitor usage**: Track conversations and costs in the analytics tab
5. **Deploy to production**: Update URLs in widget.js for production use

## 🐛 Troubleshooting

If the chatbot doesn't appear:
1. Check browser console for errors
2. Verify the server is running on port 3003
3. Ensure API key is properly formatted
4. Check CORS settings if on different domain

## 🎉 Success!

Your Intelagent AI Chatbot is ready to provide 24/7 customer support!