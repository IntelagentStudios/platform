# Intelagent Platform API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Core APIs](#core-apis)
  - [License Management](#license-management)
  - [Product APIs](#product-apis)
  - [Analytics](#analytics)
  - [AI Intelligence](#ai-intelligence)
- [Webhook APIs](#webhook-apis)
- [Team Collaboration](#team-collaboration)
- [Error Handling](#error-handling)
- [SDKs and Libraries](#sdks-and-libraries)

## Authentication

All API requests require authentication using either an API key or session cookie.

### API Key Authentication
```http
GET /api/endpoint
X-API-Key: your_api_key_here
```

### Session Authentication
```http
GET /api/endpoint
Cookie: license_key=your_license_key
```

## Rate Limiting

API requests are rate-limited based on your plan:

| Plan | Requests/Minute | Burst Limit |
|------|----------------|-------------|
| Starter | 60 | 100 |
| Professional | 300 | 500 |
| Enterprise | 1000 | 2000 |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Core APIs

### License Management

#### Validate License
```http
POST /api/licenses/validate-n8n
Content-Type: application/json

{
  "license_key": "string",
  "product_id": "string"
}
```

**Response:**
```json
{
  "valid": true,
  "status": "active",
  "plan": "professional",
  "products": ["chatbot", "sales-agent"],
  "usage": {
    "messages": 5000,
    "limit": 10000
  }
}
```

#### Generate API Key
```http
POST /api/licenses/generate-api-key
Content-Type: application/json

{
  "name": "Production API Key",
  "scopes": ["read", "write"],
  "expires_in_days": 90
}
```

**Response:**
```json
{
  "api_key": "sk_live_...",
  "expires_at": "2024-03-01T00:00:00Z"
}
```

### Product APIs

#### Chatbot API

##### Send Message
```http
POST /api/products/chatbot/message
Content-Type: application/json

{
  "session_id": "string",
  "message": "string",
  "context": {}
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?",
  "intent": "greeting",
  "confidence": 0.95,
  "suggestions": ["Ask about pricing", "Get support"]
}
```

##### Train Chatbot
```http
POST /api/products/chatbot/train
Content-Type: application/json

{
  "training_data": [
    {
      "input": "What are your hours?",
      "output": "We're available 24/7 through this chat!",
      "intent": "hours"
    }
  ]
}
```

#### Sales Agent API

##### Create Campaign
```http
POST /api/products/sales-agent/campaigns
Content-Type: application/json

{
  "name": "Q1 Outreach",
  "template": "string",
  "leads": [
    {
      "email": "john@example.com",
      "name": "John Doe",
      "company": "Acme Corp"
    }
  ],
  "schedule": {
    "start_date": "2024-01-01",
    "send_time": "09:00",
    "timezone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "campaign_id": "camp_123",
  "status": "scheduled",
  "total_leads": 150,
  "estimated_completion": "2024-01-15"
}
```

##### Get Campaign Stats
```http
GET /api/products/sales-agent/campaigns/{campaign_id}/stats
```

**Response:**
```json
{
  "sent": 100,
  "opened": 23,
  "clicked": 8,
  "replied": 3,
  "bounced": 2,
  "conversion_rate": 0.03
}
```

#### Data Enrichment API

##### Enrich Contact
```http
POST /api/products/enrichment/enrich
Content-Type: application/json

{
  "email": "john@example.com",
  "domain": "example.com",
  "fields": ["phone", "linkedin", "company"]
}
```

**Response:**
```json
{
  "person": {
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+1-555-0123",
    "linkedin": "linkedin.com/in/johndoe",
    "job_title": "VP Sales"
  },
  "company": {
    "name": "Example Corp",
    "domain": "example.com",
    "industry": "Technology",
    "size": "100-500",
    "revenue": "$10M-50M"
  },
  "confidence": 0.92
}
```

### Analytics

#### Get Cross-Product Analytics
```http
GET /api/analytics/cross-product?range=7d&products=all
```

**Response:**
```json
{
  "timeRange": {
    "start": "2024-01-01",
    "end": "2024-01-07"
  },
  "metrics": {
    "totalInteractions": 47300,
    "breakdown": {
      "chatbot": 25000,
      "salesAgent": 15000,
      "enrichment": 7300
    },
    "trends": {
      "messages": 0.12,
      "emails": 0.08,
      "lookups": 0.15
    }
  },
  "timeSeries": [...],
  "correlations": [...]
}
```

#### Get Usage Report
```http
GET /api/analytics/usage?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "usage": {
    "chatbot_messages": 5000,
    "emails_sent": 2000,
    "enrichments": 1500,
    "api_calls": 8500
  },
  "limits": {
    "chatbot_messages": 10000,
    "emails_sent": 5000,
    "enrichments": 5000,
    "api_calls": 20000
  },
  "overage": {},
  "estimated_cost": 199.00
}
```

### AI Intelligence

#### Generate Insights
```http
POST /api/analytics/ai-insights
Content-Type: application/json

{
  "type": "pattern|anomaly|recommendation|prediction|summary",
  "products": ["chatbot", "sales-agent"],
  "timeRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

**Response:**
```json
{
  "insights": [
    {
      "id": "insight_123",
      "type": "pattern",
      "title": "Peak Usage Hours Detected",
      "description": "Most interactions occur between 2-4 PM EST",
      "impact": "medium",
      "confidence": 0.85,
      "recommendations": [
        "Schedule maintenance outside peak hours",
        "Ensure support coverage during peak times"
      ],
      "data": {...}
    }
  ]
}
```

#### Ask AI Question
```http
POST /api/analytics/ai-query
Content-Type: application/json

{
  "question": "What's driving the increase in chatbot usage?",
  "context": {
    "timeframe": "last_month",
    "products": ["chatbot"]
  }
}
```

## Webhook APIs

### Squarespace Integration
```http
POST /api/webhooks/squarespace
X-Signature: webhook_signature

{
  "order": {
    "id": "order_123",
    "customer": {...},
    "items": [...],
    "total": 199.00
  }
}
```

### Stripe Integration
```http
POST /api/webhooks/stripe
Stripe-Signature: webhook_signature

{
  "type": "payment_intent.succeeded",
  "data": {...}
}
```

## Team Collaboration

### Create Organization
```http
POST /api/organizations
Content-Type: application/json

{
  "name": "Acme Corp",
  "owner_email": "admin@acme.com",
  "owner_name": "Admin User"
}
```

### Invite Team Member
```http
POST /api/organizations/{org_id}/members
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "member",
  "team_id": "team_123"
}
```

### Update Member Permissions
```http
PUT /api/organizations/{org_id}/members/{member_id}
Content-Type: application/json

{
  "role": "admin",
  "permissions": ["view:all", "edit:products"]
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retry_after": 60,
      "limit": 100,
      "current": 101
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

## SDKs and Libraries

### Node.js/TypeScript
```bash
npm install @intelagent/sdk
```

```typescript
import { IntelagentClient } from '@intelagent/sdk';

const client = new IntelagentClient({
  apiKey: 'your_api_key'
});

// Send chatbot message
const response = await client.chatbot.sendMessage({
  sessionId: 'session_123',
  message: 'Hello!'
});

// Enrich contact
const enriched = await client.enrichment.enrich({
  email: 'john@example.com'
});
```

### Python
```bash
pip install intelagent
```

```python
from intelagent import Client

client = Client(api_key="your_api_key")

# Create sales campaign
campaign = client.sales_agent.create_campaign(
    name="Q1 Outreach",
    template="...",
    leads=[...]
)

# Get analytics
analytics = client.analytics.get_cross_product(
    range="7d",
    products=["all"]
)
```

### REST Examples

#### cURL
```bash
curl -X POST https://api.intelagent.ai/v1/chatbot/message \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "message": "Hello!"
  }'
```

#### JavaScript Fetch
```javascript
const response = await fetch('https://api.intelagent.ai/v1/chatbot/message', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: 'session_123',
    message: 'Hello!'
  })
});

const data = await response.json();
```

## Postman Collection

Download our Postman collection for easy API testing:
[Download Postman Collection](https://api.intelagent.ai/docs/postman-collection.json)

## API Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Core product APIs (Chatbot, Sales Agent, Enrichment)
- Analytics and AI Intelligence endpoints
- Team collaboration features
- Webhook integrations

## Support

For API support and questions:
- Email: api-support@intelagent.ai
- Documentation: https://docs.intelagent.ai
- Status Page: https://status.intelagent.ai
- Community Forum: https://community.intelagent.ai