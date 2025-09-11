# n8n Visual Setup Guide for Intelagent Chatbot

## Quick Setup - Copy & Paste Expressions

### 1. OpenAI Node - Messages Field Expression
Click "Add Expression" on the messages field and paste:

```javascript
[
  {
    "role": "system",
    "content": "You are a helpful customer support assistant." + 
              ($json.customKnowledge ? "\n\nKnowledge Base:\n" + $json.customKnowledge : "") +
              "\n\nResponse style: " + ($json.responseStyle || "professional") +
              "\n\nImportant: Use the knowledge base information to answer questions accurately."
  },
  {
    "role": "user",
    "content": $json.message
  }
]
```

### 2. Postgres Node - Column Mappings

| Column | Expression |
|--------|------------|
| product_key | `{{$json.productKey}}` |
| domain | `{{$json.domain}}` |
| session_id | `{{$json.sessionId}}` |
| conversation_id | `{{$guid()}}` |
| customer_message | `{{$json.message}}` |
| bot_response | `{{$node["OpenAI"].json.choices[0].message.content}}` |
| timestamp | `{{$now}}` |
| response_time_ms | `{{Date.now() - Date.parse($json.timestamp)}}` |

### 3. Response to Webhook - JSON Expression

```javascript
{
  "response": $node["OpenAI"].json.choices[0].message.content,
  "success": true,
  "sessionId": $json.sessionId,
  "conversationId": $node["Postgres"].json.conversation_id
}
```

## Testing Custom Knowledge

1. Add knowledge in dashboard: "Our business hours are 9-5 EST. Email: support@example.com"
2. Ask the chatbot: "What are your business hours?"
3. It should respond using the knowledge base information

## Common Issues & Fixes

### Issue: "customKnowledge is undefined"
**Fix:** Update widget to v3: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget-v3.js">`

### Issue: "Conversations still showing 0"
**Fix:** Make sure Postgres node has correct table name: `chatbot_logs` (not `chatbot_conversations`)

### Issue: "Bot ignores custom knowledge"
**Fix:** Check the system message includes the customKnowledge variable in OpenAI node

### Issue: "Cannot read property 'choices' of undefined"
**Fix:** Add error handling with IF node checking `{{$node["OpenAI"].json.choices}}`