# Intelagent Platform

A unified, modular AI-powered business automation platform that consolidates multiple products under a single dashboard with consistent design and full compatibility.

## 🚀 Features

### Products
- **Chatbot**: AI-powered customer support with setup agent
- **Sales Agent**: Automated lead discovery and outreach
- **Setup Agent**: Convert any form into an interactive conversation
- **Enrichment Service**: Company and contact data enrichment

### Platform Features
- Unified dashboard for all products
- License-based access control
- AI-powered insights (Premium)
- Real-time analytics
- Multi-product compatibility
- Separate admin and customer portals

## 📁 Repository Structure

```
platform/
├── packages/           # Shared packages
│   ├── core/          # Core utilities and types
│   ├── database/      # Database schemas and migrations
│   ├── auth/          # Authentication service
│   └── ui/            # Shared UI components
├── products/          # Individual products
│   ├── chatbot/       # Chatbot product
│   ├── sales-agent/   # Sales outreach product
│   └── setup-agent/   # Setup agent service
├── apps/              # Applications
│   ├── dashboard/     # Main dashboard
│   ├── admin-portal/  # Admin management portal
│   └── customer-portal/ # Customer dashboard
├── services/          # Microservices
│   ├── enrichment/    # Data enrichment service
│   ├── ai-insights/   # AI analytics service
│   └── webhooks/      # Webhook processors
└── infrastructure/    # Infrastructure configs
    ├── docker/        # Docker configurations
    ├── kubernetes/    # K8s manifests
    └── terraform/     # Infrastructure as code
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma
- **Database**: PostgreSQL (multi-schema)
- **Real-time**: WebSockets
- **Queue**: Bull (job processing)
- **Infrastructure**: Docker, Railway/Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/IntelagentStudios/platform.git
cd platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database:
```bash
npm run db:migrate
npm run db:generate
```

5. Start development servers:
```bash
npm run dev
```

## 📦 Monorepo Management

This project uses npm workspaces and Turborepo for monorepo management.

### Common Commands

```bash
# Run all dev servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Working with Packages

```bash
# Add dependency to specific package
npm install <package> -w @intelagent/core

# Run script in specific package
npm run dev -w @intelagent/chatbot

# Build specific package
npm run build -w @intelagent/dashboard
```

## 🔐 Authentication

The platform uses license-based authentication:

1. **Master Admin**: Full system access with master license key
2. **Customer**: Product-specific access based on license

## 🎯 Product Access

Licenses can grant access to multiple products:
- Single product: `["chatbot"]`
- Multiple products: `["chatbot", "sales"]`
- All products: `["chatbot", "sales", "setup", "enrichment"]`

## 💎 Premium Features

Premium/Enterprise plans include:
- AI-powered insights
- Predictive analytics
- Custom queries
- Advanced reporting
- Priority support

## 🚢 Deployment

### Using Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

### Using Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway up
```

## 📊 Database Schema

The platform uses PostgreSQL with multiple schemas:
- `public`: Core platform data (licenses, logs)
- `sales_agent`: Sales agent specific data
- Additional schemas per product

## 🔄 Migration Guide

For migrating from individual products to the unified platform, see [MIGRATION.md](./docs/MIGRATION.md).

## 📖 Documentation

- [Platform Architecture](./PLATFORM_ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Setup Guide](./docs/SETUP.md)
- [Contributing](./docs/CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- Documentation: [docs.intelagent.com](https://docs.intelagent.com)
- Email: support@intelagentstudios.com
- Issues: [GitHub Issues](https://github.com/IntelagentStudios/platform/issues)

## 🏗️ Roadmap

- [ ] Mobile applications
- [ ] White-label support
- [ ] Custom integrations marketplace
- [ ] Advanced workflow builder
- [ ] Multi-language support
- [ ] Voice interface for setup agent

## 👥 Team

Built with ❤️ by [Intelagent Studios](https://intelagentstudios.com)

---

**Note**: This is an active development repository. For production deployments, please use tagged releases.