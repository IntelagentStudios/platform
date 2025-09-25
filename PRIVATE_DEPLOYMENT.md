# 🔒 Private Deployment Guide - Intelagent Platform

## Overview

The Intelagent Platform now supports **fully private deployments** where:
- ✅ Your data never leaves your infrastructure
- ✅ Use your own database (any type)
- ✅ Use your own LLM models (OpenAI, Ollama, custom)
- ✅ Complete data sovereignty and compliance
- ✅ End-to-end encryption

## 🚀 Quick Start

1. Navigate to **Settings → Private Deployment**
2. Configure your database connection
3. Configure your LLM provider
4. Set security preferences
5. Test connections and save

## 🗄️ Database Configuration

### Direct Connection
Connect directly to your database:

```yaml
Supported Databases:
  - PostgreSQL (recommended)
  - MySQL/MariaDB
  - MongoDB
  - SQLite
  - SQL Server
  - Oracle
```

**Configuration:**
```json
{
  "type": "postgres",
  "host": "your-database.com",
  "port": 5432,
  "database": "intelagent_db",
  "username": "your_user",
  "password": "your_password",
  "ssl": true
}
```

### API Connection
Connect via your REST API for maximum isolation:

```json
{
  "connectionMode": "api",
  "apiEndpoint": "https://your-api.com/database",
  "apiKey": "your-api-key",
  "schema": "public"
}
```

**Required API Endpoints:**
```
POST /query        - Execute SQL queries
POST /insert       - Insert records
PUT  /update       - Update records
DELETE /delete     - Delete records
POST /find-one     - Find single record
POST /find-many    - Find multiple records
GET  /health       - Health check
```

## 🤖 LLM Configuration

### 1️⃣ Cloud Providers
Use managed LLM services:

- **OpenAI** - GPT-4, GPT-3.5
- **Anthropic** - Claude 3
- **Azure OpenAI** - Managed OpenAI
- **Cohere** - Command models
- **Hugging Face** - Various models

### 2️⃣ Self-Hosted (Recommended for Privacy)
Run models on your infrastructure:

**Ollama Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2
ollama pull mistral
ollama pull codellama

# Run Ollama server
ollama serve
```

**Configuration:**
```json
{
  "deploymentMode": "self-hosted",
  "apiEndpoint": "http://localhost:11434",
  "model": "llama2"
}
```

### 3️⃣ Private API
Use your custom LLM endpoint:

```json
{
  "deploymentMode": "private-api",
  "apiEndpoint": "https://your-llm.com/completions",
  "apiKey": "your-key",
  "model": "custom-model"
}
```

## 🔐 Security Features

### Data Protection
- **End-to-end encryption** - AES-256 encryption for all data
- **PII Redaction** - Automatic removal of personal information
- **IP Whitelisting** - Restrict access to specific IPs
- **Audit Logging** - Comprehensive activity tracking

### Compliance Modes
- **HIPAA** - Healthcare compliance
- **GDPR** - European data protection
- **SOX** - Financial compliance
- **PCI DSS** - Payment card security

### Encryption
All sensitive data is encrypted using AES-256:

```javascript
// Encryption is automatic for:
- Database passwords
- API keys
- LLM responses
- User data
```

## 🛠️ Deployment Options

### Option 1: Docker Deployment
```yaml
version: '3.8'
services:
  intelagent:
    image: intelagent/platform:latest
    environment:
      - DATABASE_URL=${YOUR_DATABASE_URL}
      - LLM_ENDPOINT=${YOUR_LLM_ENDPOINT}
      - ENCRYPTION_KEY=${YOUR_ENCRYPTION_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

### Option 2: Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intelagent-platform
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: intelagent
        image: intelagent/platform:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: LLM_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: llm-secret
              key: endpoint
```

### Option 3: On-Premise Installation
```bash
# Clone the repository
git clone https://github.com/intelagent/platform.git

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm run start
```

## 📋 Testing Your Configuration

### Database Connection Test
```bash
curl -X POST https://your-instance/api/settings/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "type": "database",
    "config": {
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "database": "test_db",
      "username": "user",
      "password": "pass"
    }
  }'
```

### LLM Connection Test
```bash
curl -X POST https://your-instance/api/settings/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "type": "llm",
    "config": {
      "deploymentMode": "self-hosted",
      "apiEndpoint": "http://localhost:11434",
      "model": "llama2"
    }
  }'
```

## 📡 Network Architecture

```
┌───────────────────────────────┐
│   Your Infrastructure         │
│                               │
│  ┌──────────┐  ┌─────────┐  │
│  │ Database │  │   LLM   │  │
│  └────┬─────┘  └────┬────┘  │
│       │             │        │
│  ┌────┴─────────────┴────┐  │
│  │  Intelagent Platform  │  │
│  └─────────┬───────────┘  │
│             │                │
└─────────────┴───────────────┘
              │
         [Users]
```

## 🔧 Environment Variables

```env
# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=intelagent
DATABASE_USER=admin
DATABASE_PASSWORD=secure_password

# LLM
LLM_PROVIDER=ollama
LLM_ENDPOINT=http://localhost:11434
LLM_MODEL=llama2

# Security
ENCRYPTION_KEY=your-256-bit-hex-key
ENABLE_AUDIT_LOG=true
DATA_RETENTION_DAYS=90
COMPLIANCE_MODE=hipaa

# Network
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
HTTPS_ONLY=true
```

## 👥 Multi-Tenant Isolation

Each tenant gets:
- Isolated database schema/namespace
- Separate encryption keys
- Independent LLM contexts
- Segregated file storage
- Individual audit trails

## 📈 Performance Considerations

### Database
- Use connection pooling (20-50 connections)
- Enable query caching
- Index frequently queried columns
- Partition large tables by tenant

### LLM
- Use GPU acceleration for local models
- Implement response caching
- Batch similar requests
- Use quantized models for faster inference

## 🆘 Support

### Enterprise Support
- Email: enterprise@intelagent.ai
- Slack: intelagent-enterprise.slack.com
- Phone: +1 (555) 123-4567

### Documentation
- [API Reference](https://docs.intelagent.ai/api)
- [Security Best Practices](https://docs.intelagent.ai/security)
- [Compliance Guide](https://docs.intelagent.ai/compliance)

## 📋 Compliance Certifications

- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ HIPAA Compliant
- ✅ GDPR Ready
- ✅ PCI DSS Level 1

## 🔄 Migration Guide

### From Cloud to Private
1. Export data from cloud instance
2. Set up private infrastructure
3. Configure database and LLM
4. Import data
5. Update DNS/routing
6. Test thoroughly

### Data Export
```bash
# Export all data
curl -X POST https://cloud.intelagent.ai/api/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o export.json

# Import to private instance
curl -X POST https://private.yourcompany.com/api/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@export.json"
```

---

**Last Updated:** November 2024  
**Version:** 2.0.0  
**License:** Enterprise