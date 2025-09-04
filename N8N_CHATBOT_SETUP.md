# n8n Chatbot Workflow Setup Guide

## Overview
The chatbot system uses n8n for workflow automation and AI logic. The chatbot widget (frontend) communicates with n8n webhooks to process messages.

## Architecture
```
Customer Website → Chatbot Widget → n8n Webhook → AI Processing → Response
```

## n8n Workflow Setup

### 1. Create Webhook Trigger
In your n8n instance, create a new workflow with these nodes:

#### Webhook Node Configuration:
- **Webhook URL Path**: `chatbot/{productKey}`
- **HTTP Method**: POST
- **Response Mode**: "When last node finishes"
- **Response Data**: "First entry JSON"

Expected input from widget:
```json
{
  "message": "User's message",
  "sessionId": "sess_1234567890_abc",
  "productKey": "CB-xxxxx",
  "chatHistory": [...]
}
```

### 2. Add AI Processing Nodes

#### Option A: OpenAI Node
- **Resource**: Message
- **Operation**: Create
- **Model**: gpt-3.5-turbo or gpt-4
- **Messages**: 
  ```json
  [
    {
      "role": "system",
      "content": "You are a helpful assistant for {{$json.productKey}}. Be professional and concise."
    },
    {
      "role": "user", 
      "content": "{{$json.message}}"
    }
  ]
  ```

#### Option B: Custom HTTP Request (for other AI services)
- **Method**: POST
- **URL**: Your AI endpoint
- **Body**: Custom format for your AI service

### 3. Format Response Node (Set Node)
Configure the output format:
```json
{
  "message": "{{$node['AI_Node'].json.choices[0].message.content}}",
  "sessionId": "{{$node['Webhook'].json.sessionId}}",
  "timestamp": "{{$now.toISO()}}",
  "productKey": "{{$node['Webhook'].json.productKey}}"
}
```

### 4. Optional: Add Database Logging
Add a node to log conversations to your database:
- PostgreSQL/MySQL node to store chat history
- Include: sessionId, productKey, message, response, timestamp

### 5. Error Handling
Add an Error Trigger node with a Set node:
```json
{
  "message": "I'm having trouble processing your request. Please try again.",
  "error": true
}
```

## Testing the Integration

### Local Testing:
1. Start n8n locally: `npx n8n`
2. Create the workflow above
3. Activate the workflow
4. Test with curl:
```bash
curl -X POST http://localhost:5678/webhook/chatbot/CB-test \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test123","productKey":"CB-test"}'
```

### Production Testing:
1. Deploy workflow to your n8n instance
2. Ensure webhook is accessible at: `https://1ntelagent.up.railway.app/webhook/chatbot/{productKey}`
3. Test the chatbot widget on a webpage

## Product Key Validation (Optional)
To validate product keys in n8n:

1. Add HTTP Request node after Webhook
2. Call your platform's API to validate the product key
3. Use Switch node to handle valid/invalid keys

## Advanced Features

### Context Management
Store conversation context using:
- n8n's Static Data
- External database (Redis/PostgreSQL)
- In-memory variables for session management

### Multi-Model Support
Use Switch nodes to route to different AI models based on:
- Product key prefix
- User tier/subscription
- Query complexity

### Rate Limiting
Implement rate limiting using:
- Function nodes to check request frequency
- Redis node for counting requests per sessionId

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure n8n allows cross-origin requests
2. **404 errors**: Check webhook path matches exactly
3. **Empty responses**: Verify AI node output path in Set node
4. **Timeout errors**: Increase webhook timeout in n8n settings

### Debug Mode:
Add Console nodes between each step to log data flow

## Integration with Skills System

To integrate with the Intelagent Skills Matrix:

1. Create a Function node that calls the skills API
2. Pass the product key as authentication
3. Route specific intents to different skills:
   - Sales questions → SalesSkill
   - Support queries → SupportSkill
   - General chat → WebsiteChatbotSkill

Example Function node:
```javascript
const skillsApiUrl = 'http://your-platform/api/skills/execute';
const response = await $http.post(skillsApiUrl, {
  skill: 'website_chatbot',
  params: {
    message: $input.item.json.message,
    sessionId: $input.item.json.sessionId
  },
  auth: {
    productKey: $input.item.json.productKey
  }
});
return response;
```

## Deployment Checklist

- [ ] Webhook URL configured correctly
- [ ] AI service credentials set in n8n
- [ ] Error handling workflow active
- [ ] Response format matches widget expectations
- [ ] CORS headers configured if needed
- [ ] Rate limiting implemented
- [ ] Logging/analytics configured
- [ ] Product key validation active

## Support

For issues with:
- **Widget**: Check browser console for errors
- **n8n**: Check workflow execution history
- **AI Service**: Verify API keys and quotas
- **Integration**: Test each component independently