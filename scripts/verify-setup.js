#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks that all components are properly configured
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`
  };
  
  console.log(`${prefix[type] || ''}  ${message}${colors.reset}`);
}

async function verifySetup() {
  console.log('\n========================================');
  console.log('Verifying Intelagent Platform Setup');
  console.log('========================================\n');

  let errors = 0;
  let warnings = 0;
  let success = 0;

  // 1. Check Node.js version
  console.log('1. Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    log(`Node.js ${nodeVersion} installed`, 'success');
    success++;
  } else {
    log(`Node.js ${nodeVersion} is too old (need v18+)`, 'error');
    errors++;
  }

  // 2. Check required packages
  console.log('\n2. Checking required packages...');
  const requiredPackages = [
    '@prisma/client',
    'stripe',
    'jsonwebtoken',
    'jose',
    'next',
    'react',
    'typescript'
  ];

  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );

  for (const pkg of requiredPackages) {
    const installed = 
      packageJson.dependencies?.[pkg] || 
      packageJson.devDependencies?.[pkg] ||
      checkWorkspacePackage(pkg);
    
    if (installed) {
      log(`${pkg} installed`, 'success');
      success++;
    } else {
      log(`${pkg} not found`, 'warning');
      warnings++;
    }
  }

  // 3. Check environment files
  console.log('\n3. Checking environment files...');
  const envFiles = [
    '.env',
    'apps/customer-portal/.env.local',
    'apps/admin-portal/.env.local'
  ];

  for (const envFile of envFiles) {
    const filePath = path.join(process.cwd(), envFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for required variables
      const hasDatabase = content.includes('DATABASE_URL');
      const hasJWT = content.includes('JWT_SECRET');
      const hasRedis = content.includes('REDIS_URL');
      
      if (hasDatabase && hasJWT && hasRedis) {
        log(`${envFile} configured`, 'success');
        success++;
      } else {
        const missing = [];
        if (!hasDatabase) missing.push('DATABASE_URL');
        if (!hasJWT) missing.push('JWT_SECRET');
        if (!hasRedis) missing.push('REDIS_URL');
        log(`${envFile} missing: ${missing.join(', ')}`, 'warning');
        warnings++;
      }
    } else {
      log(`${envFile} not found`, 'error');
      errors++;
    }
  }

  // 4. Check database connection
  console.log('\n4. Checking database connection...');
  try {
    await prisma.$connect();
    log('Database connected', 'success');
    success++;

    // Check for required tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const requiredTables = ['licenses', 'users', 'products'];
    for (const required of requiredTables) {
      const found = tables.some(t => t.table_name === required);
      if (found) {
        log(`Table '${required}' exists`, 'success');
        success++;
      } else {
        log(`Table '${required}' missing`, 'error');
        errors++;
      }
    }

    // Check for test license
    const license = await prisma.$queryRaw`
      SELECT license_key, status, schema_name 
      FROM licenses 
      WHERE license_key = 'INTL-AGNT-BOSS-MODE'
    `;

    if (license && license.length > 0) {
      log(`Test license INTL-AGNT-BOSS-MODE found (${license[0].status})`, 'success');
      success++;
      
      // Check if schema exists
      const schemaExists = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.schemata 
        WHERE schema_name = ${license[0].schema_name}
      `;
      
      if (schemaExists[0].count > 0) {
        log(`Tenant schema '${license[0].schema_name}' exists`, 'success');
        success++;
      } else {
        log(`Tenant schema '${license[0].schema_name}' missing`, 'warning');
        warnings++;
      }
    } else {
      log('Test license INTL-AGNT-BOSS-MODE not found', 'warning');
      warnings++;
    }

    await prisma.$disconnect();
  } catch (error) {
    log(`Database error: ${error.message}`, 'error');
    errors++;
  }

  // 5. Check Redis connection
  console.log('\n5. Checking Redis connection...');
  try {
    const RedisManager = require('../packages/redis/dist/index.js').RedisManager;
    const redis = RedisManager.getClient('cache');
    
    if (redis) {
      // Test Redis with a simple ping
      await redis.set('test:ping', 'pong', 'EX', 10);
      const result = await redis.get('test:ping');
      
      if (result === 'pong') {
        log('Redis connected and working', 'success');
        success++;
      } else {
        log('Redis connected but not responding correctly', 'warning');
        warnings++;
      }
    } else {
      log('Redis using fallback memory cache', 'warning');
      warnings++;
    }
  } catch (error) {
    log('Redis not configured (using memory cache)', 'warning');
    warnings++;
  }

  // 6. Check build status
  console.log('\n6. Checking package builds...');
  const packagesToCheck = [
    'packages/database/dist',
    'packages/redis/dist',
    'packages/billing/dist',
    'packages/compliance/dist'
  ];

  for (const pkg of packagesToCheck) {
    const distPath = path.join(process.cwd(), pkg);
    if (fs.existsSync(distPath)) {
      log(`${pkg} built`, 'success');
      success++;
    } else {
      log(`${pkg} not built`, 'warning');
      warnings++;
    }
  }

  // 7. Check for Stripe configuration
  console.log('\n7. Checking Stripe configuration...');
  const customerPortalEnv = path.join(process.cwd(), 'apps/customer-portal/.env.local');
  if (fs.existsSync(customerPortalEnv)) {
    const content = fs.readFileSync(customerPortalEnv, 'utf8');
    
    if (content.includes('sk_test_') || content.includes('sk_live_')) {
      log('Stripe keys configured', 'success');
      success++;
    } else {
      log('Stripe keys not configured (update in .env.local)', 'warning');
      warnings++;
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Verification Summary');
  console.log('========================================');
  console.log(`${colors.green}✅ Success: ${success}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${errors}${colors.reset}`);

  if (errors === 0) {
    console.log(`\n${colors.green}🎉 Setup verification passed!${colors.reset}`);
    
    if (warnings > 0) {
      console.log(`\n${colors.yellow}Some optional features need configuration:${colors.reset}`);
      console.log('1. Configure Stripe API keys in .env.local files');
      console.log('2. Ensure all packages are built with: npm run build');
      console.log('3. Create test license if needed');
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Start development: npm run dev');
    console.log('2. Access customer portal: http://localhost:3000');
    console.log('3. Access admin portal: http://localhost:3001');
    
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Setup verification failed!${colors.reset}`);
    console.log('\nPlease fix the errors above and run setup again.');
    process.exit(1);
  }
}

function checkWorkspacePackage(packageName) {
  // Check if it's a workspace package
  const workspacePackages = [
    '@intelagent/database',
    '@intelagent/redis',
    '@intelagent/billing',
    '@intelagent/compliance',
    '@intelagent/enrichment-module'
  ];
  
  if (workspacePackages.includes(packageName)) {
    const packagePath = packageName.replace('@intelagent/', 'packages/');
    return fs.existsSync(path.join(process.cwd(), packagePath));
  }
  
  // Check in node_modules
  return fs.existsSync(path.join(process.cwd(), 'node_modules', packageName));
}

// Run verification
verifySetup().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});