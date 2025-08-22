#!/usr/bin/env node

/**
 * Automated Environment Variables Setup
 * Creates .env files with proper configuration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('Setting up environment variables...');

// Generate secure random keys
const jwtSecret = crypto.randomBytes(32).toString('hex');
const adminJwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Base environment variables
const baseEnv = `# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intelagent

# Redis (Railway configuration provided)
REDIS_URL=redis://default:xBwSBDDRKbzlHmxfWLxKVfIeztNfxSeG@junction.proxy.rlwy.net:21284

# Security Keys
JWT_SECRET=${jwtSecret}
ADMIN_JWT_SECRET=${adminJwtSecret}
ENCRYPTION_KEY=${encryptionKey}

# Node Environment
NODE_ENV=development

# Existing License (for testing)
TEST_LICENSE_KEY=INTL-AGNT-BOSS-MODE
`;

// Customer Portal specific env
const customerPortalEnv = baseEnv + `
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Stripe (Customer Portal)
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT=true
`;

// Admin Portal specific env
const adminPortalEnv = baseEnv + `
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Admin Configuration
ADMIN_EMAIL=admin@intelagent.com
ADMIN_INITIAL_PASSWORD=changeme123

# Stripe (Admin Portal)
STRIPE_SECRET_KEY=sk_test_xxx
`;

// Agent Portal specific env
const agentPortalEnv = baseEnv + `
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# Agent Configuration
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;

// Services env
const servicesEnv = baseEnv + `
# Service Ports
ENRICHMENT_PORT=4001
CHATBOT_PORT=4002
SALES_PORT=4003
SETUP_PORT=4004

# External APIs (optional)
CLEARBIT_API_KEY=
HUNTER_API_KEY=
APOLLO_API_KEY=

# OpenAI (for services)
OPENAI_API_KEY=
`;

// Write environment files
const envFiles = [
  { path: '.env', content: baseEnv },
  { path: '.env.local', content: baseEnv },
  { path: 'apps/customer-portal/.env.local', content: customerPortalEnv },
  { path: 'apps/admin-portal/.env.local', content: adminPortalEnv },
  { path: 'apps/agent-portal/.env.local', content: agentPortalEnv },
  { path: 'services/.env', content: servicesEnv }
];

let created = 0;
let skipped = 0;

for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file.path);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    // Check if it has actual configuration
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing.includes('DATABASE_URL') && existing.includes('JWT_SECRET')) {
      console.log(`  ⚠ Skipping ${file.path} (already configured)`);
      skipped++;
      continue;
    }
    
    // Backup existing file
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`  📦 Backed up existing ${file.path}`);
  }
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write new env file
  fs.writeFileSync(filePath, file.content);
  console.log(`  ✅ Created ${file.path}`);
  created++;
}

console.log(`\n📝 Environment setup complete!`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files (already configured)`);

// Create a credentials file for reference
const credentialsPath = path.join(process.cwd(), 'CREDENTIALS.md');
const credentialsContent = `# Intelagent Platform - Generated Credentials

## Security Keys (Generated)
- **JWT Secret**: ${jwtSecret}
- **Admin JWT Secret**: ${adminJwtSecret}
- **Encryption Key**: ${encryptionKey}

## Test License
- **License Key**: INTL-AGNT-BOSS-MODE

## Database
- **Connection**: postgresql://postgres:postgres@localhost:5432/intelagent
- Update with your actual PostgreSQL credentials

## Redis (Railway)
- **URL**: redis://default:xBwSBDDRKbzlHmxfWLxKVfIeztNfxSeG@junction.proxy.rlwy.net:21284

## Stripe (To Configure)
1. Go to https://dashboard.stripe.com
2. Get your API keys
3. Update the .env.local files with:
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

## Default Ports
- Customer Portal: http://localhost:3000
- Admin Portal: http://localhost:3001
- Agent Portal: http://localhost:3002

**⚠️ IMPORTANT**: 
- Keep this file secure and do not commit to git
- Add to .gitignore if not already present
- Update Stripe keys before running billing features
`;

fs.writeFileSync(credentialsPath, credentialsContent);
console.log(`\n📋 Credentials saved to CREDENTIALS.md`);
console.log('   ⚠️  Keep this file secure and update Stripe keys!');

// Update .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

if (!gitignoreContent.includes('CREDENTIALS.md')) {
  gitignoreContent += '\n# Credentials file\nCREDENTIALS.md\n';
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('\n✅ Added CREDENTIALS.md to .gitignore');
}