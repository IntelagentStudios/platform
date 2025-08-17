# Intelagent Platform Services

## Running Services & Ports

### Applications
- **Customer Portal**: http://localhost:3002
  - Customer dashboard for license holders
  - Access to product dashboards, analytics, AI insights (premium)
  
- **Admin Portal**: http://localhost:3003
  - Master admin dashboard
  - Full system overview, license management, revenue tracking

### Products
- **Chatbot**: http://localhost:3000
  - AI customer support chatbot
  - Widget deployment and setup agent
  
- **Sales Agent**: http://localhost:3004
  - Lead discovery and outreach system
  - Campaign management dashboard
  
- **Setup Agent**: http://localhost:3005
  - Universal conversational forms
  - Plug-and-play for any product

### Services
- **Enrichment Service**: http://localhost:3006
  - Email finder
  - Web scraper
  - Company enrichment

## Quick Start Commands

```bash
# Install all dependencies
npm install

# Run specific service
npm run dev -w @intelagent/customer-portal   # Port 3002
npm run dev -w @intelagent/admin-portal      # Port 3003
npm run dev -w @intelagent/chatbot          # Port 3000
npm run dev -w @intelagent/sales-agent      # Port 3004
npm run dev -w @intelagent/setup-agent      # Port 3005
npm run dev -w @intelagent/enrichment       # Port 3006

# Run everything (with Turbo)
npm run dev
```

## Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema to database
npm run db:push
```

## Environment Variables

Create `.env` files in each application:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/intelagent

# Auth
JWT_SECRET=your-secret-key
MASTER_LICENSE_KEY=INTL-MSTR-ADMN-PASS

# APIs
OPENAI_API_KEY=your-openai-key
SENDGRID_API_KEY=your-sendgrid-key

# Webhooks
CHATBOT_WEBHOOK_URL=https://intelagentchatbotn8n.up.railway.app/webhook/setup-agent
SALES_WEBHOOK_URL=https://intelagentsalesn8n.up.railway.app/webhook/setup
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Admin Portal (3003)           │
│         (Master Management)              │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Customer Portal (3002)          │
│         (Licensed Users)                │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────┴────────┐    ┌────────┴────────┐
│ Chatbot (3000) │    │ Sales (3004)    │
└────────────────┘    └─────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────┴────────┐    ┌────────┴────────┐
│ Setup (3005)   │    │ Enrich (3006)   │
└────────────────┘    └─────────────────┘
```

## Testing

```bash
# Test customer portal
curl http://localhost:3002/api/health

# Test admin portal
curl http://localhost:3003/api/health

# Test setup agent
curl http://localhost:3005/health
```

## Production Deployment

Each service can be deployed independently:

- **Railway**: Use railway.json configs
- **Vercel**: Next.js apps auto-deploy
- **Docker**: Use Dockerfile in each service
- **PM2**: Use ecosystem.config.js files

## Support

For issues or questions, check:
- [Platform Architecture](./PLATFORM_ARCHITECTURE.md)
- [Migration Plan](./MIGRATION_PLAN.md)
- [GitHub Issues](https://github.com/IntelagentStudios/platform/issues)