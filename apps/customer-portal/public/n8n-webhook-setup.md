# n8n Webhook Configuration for Intelagent Chatbot

## Webhook Endpoint
Your n8n webhook should be configured to receive POST requests at:
```
https://n8n.intelagentstudios.com/webhook/chatbot
```

## Expected Payload Structure
The widget sends the following data to your webhook:

```json
{
  "message": "User's message",
  "sessionId": "Unique session identifier",
  "productKey": "The product key for the chatbot",
  "timestamp": "ISO 8601 timestamp",
  "customKnowledge": "Custom knowledge base content from dashboard",
  "responseStyle": "professional | casual | technical",
  "domain": "The website domain where chat originated"
}
```

## Using Custom Knowledge in n8n

The `customKnowledge` field contains the knowledge base content you've configured in the dashboard. To use it effectively:

### 1. In your HTTP Request node to OpenAI/Claude:
Include the custom knowledge as system context:

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Use the following knowledge base to answer questions accurately:\n\n{{$json.customKnowledge}}\n\nResponse style: {{$json.responseStyle}}"
    },
    {
      "role": "user",
      "content": "{{$json.message}}"
    }
  ]
}
```

### 2. Response Format
Your webhook should return a JSON response:

```json
{
  "response": "The assistant's response message",
  "success": true
}
```

## Logging Conversations

To track conversations in the dashboard, ensure your n8n workflow logs to the database:

### Database Insert Node Configuration:
- Table: `chatbot_logs`
- Fields to insert:
  - `product_key`: {{$json.productKey}}
  - `domain`: {{$json.domain}}
  - `session_id`: {{$json.sessionId}}
  - `conversation_id`: Generate unique ID
  - `customer_message`: {{$json.message}}
  - `bot_response`: {{$json.response}}
  - `timestamp`: {{$json.timestamp}}

## Testing Your Configuration

1. Use the test endpoint to verify custom knowledge is being fetched:
   ```
   POST https://dashboard.intelagentstudios.com/api/chatbot/knowledge
   Body: { "productKey": "YOUR_PRODUCT_KEY" }
   ```

2. The response will contain your custom knowledge:
   ```json
   {
     "knowledge": "Your custom knowledge content",
     "hasKnowledge": true,
     "knowledgeCount": 1,
     "licenseKey": "Associated license key"
   }
   ```

## Important Notes

- Custom knowledge is refreshed every 30 seconds in the widget
- Settings changes (colors, position, etc.) are applied automatically
- The widget sends custom knowledge with EVERY message to ensure freshness
- Response style should affect the tone of your AI responses
- Make sure to handle errors gracefully and return a helpful message

## Example n8n Workflow Structure

1. **Webhook Node**: Receives the POST request
2. **Set Node**: Extract and prepare data
3. **HTTP Request Node**: Send to AI service with custom knowledge
4. **Set Node**: Format response
5. **Postgres Node**: Log conversation to database
6. **Respond to Webhook Node**: Return response to widget