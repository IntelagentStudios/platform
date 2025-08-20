# n8n Chatbot Integration Setup

## Overview

Your advanced AI chatbot uses n8n workflows with a double agent system (Atlas & Hermes) for intelligent, context-aware responses.

## Features

- 🤖 **Double Agent System**: Atlas (Search) + Hermes (Response)
- 🔍 **Vector Search**: Intelligent content matching
- 🌐 **Website Indexing**: Automatic content discovery
- 💬 **Context Memory**: Conversation history tracking
- 🎯 **Intent Recognition**: Understanding user needs
- 📊 **Smart Routing**: Dynamic response generation

## Quick Start

### 1. Install n8n

```bash
# Using npm
npm install -g n8n

# Or using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Start n8n

```bash
n8n start
```

Access n8n at: http://localhost:5678

### 3. Import Workflows

Your workflow files are located in:
- `Intelagent Chatbot/chatbot (26).json` - Main chatbot workflow
- `Intelagent Chatbot/chatbot-setup (12).json` - Setup agent workflow
- `Intelagent Chatbot/chatbot-index (3).json` - Indexing workflow
- `Intelagent Chatbot/chatbot-vector.json` - Vector search workflow

To import:
1. Open n8n (http://localhost:5678)
2. Click "Workflows" → "Import from File"
3. Select each JSON file
4. Save and activate each workflow

### 4. Configure Webhooks

Each workflow needs a webhook trigger. After importing:

1. **Main Chatbot Workflow**:
   - Open the workflow
   - Click on the Webhook node
   - Copy the webhook URL (e.g., `http://localhost:5678/webhook/chatbot`)
   - Set to POST method
   
2. **Setup Agent Workflow**:
   - Open the workflow
   - Click on the Webhook node
   - Copy the webhook URL (e.g., `http://localhost:5678/webhook/setup-agent`)
   - Set to POST method

### 5. Update Environment Variables

Add these to your `.env.local`:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chatbot
N8N_SETUP_WEBHOOK=http://localhost:5678/webhook/setup-agent
CHAT_MODE=n8n
```

### 6. Index Your Website

Use the Setup Agent to index your website:

1. Go to Admin Portal → Products → Advanced AI Chatbot
2. Click "Setup Agent" tab
3. Enter your website URL
4. Click "Index Website"

This will:
- Crawl all pages
- Extract content
- Create vectors
- Build knowledge graph

### 7. Deploy the Widget

Add this code to your website:

```html
<!-- Intelagent Advanced Chatbot -->
<script 
  src="https://yourdomain.com/widget-n8n.js" 
  data-site="ik_n8n_indexed_xxxxx" 
  data-n8n="true">
</script>
```

## Workflow Details

### Main Chatbot Workflow (`chatbot (26).json`)

**Components:**
- Input Validation
- Agent 1: Atlas (Search Strategy)
- Vector Search
- Website Scraping
- Agent 2: Hermes (Response Generation)
- Conversation Memory

**Flow:**
1. Receives message via webhook
2. Atlas analyzes intent and searches vectors
3. Scrapes relevant website pages
4. Hermes creates personalized response
5. Returns formatted response with links

### Setup Agent Workflow (`chatbot-setup (12).json`)

**Components:**
- Website Crawler
- Content Extractor
- Vector Creator
- Index Storage

**Flow:**
1. Receives website URL
2. Discovers all pages
3. Extracts content
4. Creates vectors
5. Stores in database

## Testing

### Test the Webhook

```bash
curl -X POST http://localhost:5678/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your products",
    "site_key": "ik_test_12345",
    "session_id": "test_session_1"
  }'
```

### Expected Response

```json
{
  "output": "We offer three amazing products...",
  "session_id": "test_session_1",
  "metadata": {
    "agent_used": "double-agent",
    "search_path": "/products",
    "intent": "products"
  }
}
```

## Agent Personalities

### Atlas (Search Strategist)
- Analyzes user intent
- Searches vector database
- Selects best content
- Plans information retrieval

### Hermes (Response Specialist)
- Creates engaging responses
- Adds personality and warmth
- Includes relevant links
- Maintains conversation flow

## Troubleshooting

### Webhook Not Responding
- Check n8n is running (`n8n start`)
- Verify webhook URL in workflow
- Ensure workflow is activated
- Check firewall/port settings

### Indexing Failed
- Verify setup agent workflow is active
- Check website is accessible
- Review n8n execution logs
- Ensure database connection

### No Vector Results
- Index website first
- Check vector workflow is active
- Verify database has vectors
- Review search queries

## Advanced Configuration

### Custom Agents

Modify agent prompts in the workflow:

1. Open workflow in n8n
2. Click on Agent node
3. Edit system message
4. Save and test

### Vector Database

Configure your vector storage:
- Pinecone
- Weaviate
- Qdrant
- PostgreSQL with pgvector

### Scaling

For production:
- Use n8n cloud or self-hosted with PM2
- Configure Redis for session storage
- Set up load balancing
- Enable webhook authentication

## Support

- n8n Documentation: https://docs.n8n.io
- Workflow files: `/Intelagent Chatbot/` directory
- Admin Portal: http://localhost:3003/admin/products/chatbot-n8n

## Next Steps

1. ✅ Import all workflows
2. ✅ Configure webhooks
3. ✅ Index your website
4. ✅ Test the chatbot
5. ✅ Deploy to production

Your n8n chatbot is now ready to provide intelligent, context-aware support!