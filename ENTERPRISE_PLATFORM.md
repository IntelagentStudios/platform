# 🚀 Intelagent Enterprise Platform

## Overview

The Intelagent Platform has been transformed into a production-grade, enterprise-ready system with comprehensive monitoring, security, and scalability features. This platform is designed to handle 100,000+ active users with full observability and control.

## 🎯 Key Features

### Master Admin Dashboard
- **Real-time System Monitoring**: Live metrics for CPU, memory, disk, and network
- **Service Management**: Start/stop/restart services with one click
- **Error & Fault Management**: Comprehensive error tracking with Sentry integration
- **User Management**: Complete user lifecycle management with GDPR compliance
- **Performance Analytics**: Business metrics, conversion funnels, and KPIs
- **Debug Tools**: Built-in terminal, database query tool, API playground

### Infrastructure Components
- **Redis Integration**: Caching, sessions, pub/sub, and job queues
- **BullMQ Job Processing**: Scalable background job processing
- **WebSocket Real-time**: Live updates and notifications
- **Security Layer**: Rate limiting, CSRF protection, API keys, 2FA
- **Monitoring Stack**: OpenTelemetry, Prometheus, Grafana
- **Audit Logging**: Complete audit trail for compliance

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
│                         (Nginx/CDN)                          │
└────────────────────┬────────────────────────────────────────┘
                      │
     ┌────────────────┼────────────────┬─────────────────┐
     │                │                 │                 │
┌────▼────┐    ┌─────▼─────┐    ┌─────▼─────┐    ┌──────▼──────┐
│  Admin  │    │ Customer  │    │  Chatbot  │    │Sales Agent  │
│ Portal  │    │  Portal   │    │  Service  │    │   Service   │
└────┬────┘    └─────┬─────┘    └─────┬─────┘    └──────┬──────┘
     │                │                 │                 │
     └────────────────┼─────────────────┼─────────────────┘
                      │                 │
            ┌─────────▼───────┬─────────▼──────────┐
            │                 │                     │
       ┌────▼────┐      ┌────▼────┐         ┌─────▼─────┐
       │  Redis  │      │Database │         │   Queue   │
       │  Cache  │      │(Postgres)│        │  (BullMQ) │
       └─────────┘      └─────────┘         └───────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/IntelagentStudios/platform.git
cd platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start services**

**Development:**
```bash
npm run dev
```

**Production with Docker:**
```bash
docker-compose up -d
```

## 📊 Admin Dashboard Features

### System Health Monitoring
- Real-time service status (green/yellow/red indicators)
- Resource usage graphs (CPU, memory, disk)
- Response time tracking
- Active connections monitoring
- Database connection pool status
- Redis memory and hit rates
- Queue depth and processing rates

### Service Management
- Live service control (start/stop/restart)
- Real-time log viewing
- Manual scaling controls
- Environment variable management
- Zero-downtime deployments
- One-click rollback capabilities

### Error & Fault Management
- Real-time error feed with stack traces
- Automatic error grouping and deduplication
- Error pattern analysis
- Alert configuration
- Error assignment and tracking
- Sentry integration for detailed analysis

### User Account Management
- Advanced user search and filtering
- Complete activity history
- User impersonation for debugging
- Permission and license management
- Account suspension/deletion
- GDPR data export
- Bulk operations support

### Performance Analytics
- API endpoint performance metrics
- Slow query identification
- Resource usage trends
- Cost analysis per user/feature
- Conversion funnel tracking
- Revenue metrics and MRR tracking
- User engagement analytics

### Debug Tools
- **Terminal**: Execute commands directly
- **Database Inspector**: Run SQL queries, view tables
- **API Playground**: Test API endpoints with full request/response
- **Event Stream**: Real-time WebSocket event monitoring
- **Cache Inspector**: View and manage Redis cache entries

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Session management with Redis
- API key management system
- Two-factor authentication support
- Role-based access control (RBAC)

### Security Measures
- Rate limiting per user/IP
- CSRF protection
- Request validation with Zod
- SQL injection prevention
- XSS protection
- Security headers (HSTS, CSP, etc.)
- Audit logging for compliance

### API Security
```typescript
// Rate limiting configuration
const rateLimiters = {
  api: 100 requests/minute,
  auth: 5 attempts/15 minutes,
  export: 10 exports/hour,
  webhook: 1000 calls/minute
}
```

## 📈 Monitoring & Observability

### Metrics Collection
- OpenTelemetry instrumentation
- Prometheus metrics endpoint
- Custom business metrics
- Performance tracking

### Dashboards
- System health overview
- Service status grid
- Error rate tracking
- Performance trends
- Business KPIs

### Alerting
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Service health degradation
- High error rates

## 🔄 Queue Processing

### Available Queues
- **Email Queue**: Transactional and marketing emails
- **Enrichment Queue**: Data enrichment jobs
- **Analytics Queue**: Event processing
- **Export Queue**: Data exports (CSV, PDF)
- **Notification Queue**: Multi-channel notifications
- **Webhook Queue**: External service callbacks

### Queue Management
- Visual queue monitoring via Bull Board
- Pause/resume queue processing
- Retry failed jobs
- Clean completed jobs
- Real-time job progress tracking

## 🌐 WebSocket Real-time Features

### Channels
- System alerts
- Service health updates
- Error notifications
- Queue status updates
- User-specific notifications

### Client Connection
```javascript
const socket = io('wss://platform.example.com', {
  auth: { token: authToken }
});

socket.on('system:alert', (alert) => {
  console.log('System alert:', alert);
});

socket.on('health:update', (health) => {
  console.log('Service health:', health);
});
```

## 🚢 Deployment

### Railway Deployment
```bash
railway up
```

### Docker Deployment
```bash
docker-compose up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_ENDPOINT=/metrics

# Services
ADMIN_PORTAL_URL=https://admin.example.com
CUSTOMER_PORTAL_URL=https://portal.example.com
API_URL=https://api.example.com
```

## 📊 Performance Benchmarks

- **Response Time**: P50 < 100ms, P95 < 500ms, P99 < 1s
- **Throughput**: 10,000+ requests/minute per service
- **Availability**: 99.9% uptime SLA
- **Error Rate**: < 1% target
- **Queue Processing**: 1,000+ jobs/minute
- **WebSocket Connections**: 10,000+ concurrent

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

### Test Coverage
- Unit Tests: 80%+ coverage
- Integration Tests: Critical paths
- E2E Tests: User journeys
- Load Tests: 10,000 concurrent users

## 📝 API Documentation

### Health Check
```http
GET /health
```

### Metrics
```http
GET /metrics
```

### Admin APIs
```http
GET /api/admin/system/status
GET /api/admin/services
GET /api/admin/queues/stats
GET /api/admin/users
GET /api/admin/errors
GET /api/admin/analytics/performance
```

## 🛠️ Maintenance

### Database Migrations
```bash
npm run db:migrate
```

### Cache Management
```bash
# Clear all cache
redis-cli FLUSHALL

# Clear specific pattern
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL
```

### Log Management
```bash
# View logs
docker-compose logs -f admin-portal

# Export logs
docker-compose logs > logs.txt
```

## 📈 Scaling Guidelines

### Horizontal Scaling
- Add more service instances
- Use load balancer for distribution
- Implement sticky sessions for WebSocket

### Vertical Scaling
- Increase CPU/Memory for services
- Optimize database queries
- Implement caching strategies

### Database Scaling
- Read replicas for queries
- Connection pooling
- Query optimization
- Partitioning for large tables

## 🆘 Troubleshooting

### Common Issues

**High Memory Usage**
- Check for memory leaks
- Increase Node.js heap size
- Implement cache eviction

**Slow Queries**
- Check database indexes
- Analyze query plans
- Implement query caching

**Queue Backlog**
- Scale worker processes
- Optimize job processing
- Check for failed jobs

## 📚 Additional Resources

- [Architecture Documentation](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Security Guidelines](./docs/security.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 Support

For enterprise support, contact: support@intelagentstudios.com

---

Built with ❤️ by Intelagent Studios - Enterprise Platform v2.0