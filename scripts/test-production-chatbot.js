#!/usr/bin/env node

/**
 * Production Testing Script for Chatbot Migration
 * Run this after deploying to verify the skills system is working
 */

const https = require('https');

// Configuration
const CONFIG = {
  production: {
    url: 'https://dashboard.intelagentstudios.com',
    testKey: 'test-production-2025' // Change this in production
  },
  staging: {
    url: 'https://staging.dashboard.intelagentstudios.com',
    testKey: 'test-staging-2025'
  },
  local: {
    url: 'http://localhost:3000',
    testKey: 'test-local'
  }
};

// Select environment
const env = process.argv[2] || 'local';
const config = CONFIG[env];

if (!config) {
  console.error(`Invalid environment: ${env}`);
  console.log('Usage: node test-production-chatbot.js [production|staging|local]');
  process.exit(1);
}

console.log(`\n🧪 Testing Chatbot Migration on ${env.toUpperCase()}`);
console.log(`URL: ${config.url}`);
console.log('=====================================\n');

// Test cases
const testCases = [
  {
    name: 'Health Check',
    endpoint: '/api/chatbot-skills/test',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Full Diagnostics',
    endpoint: '/api/chatbot-skills/test',
    method: 'POST',
    body: { testKey: config.testKey },
    expectedStatus: 200
  },
  {
    name: 'Monitoring Endpoint',
    endpoint: '/api/chatbot-skills/monitoring?period=1h',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Basic Chat Message',
    endpoint: '/api/chatbot-skills',
    method: 'POST',
    body: {
      message: 'Hello, test message',
      sessionId: `test-${Date.now()}`,
      productKey: 'test-key'
    },
    expectedStatus: 200
  },
  {
    name: 'Services Query',
    endpoint: '/api/chatbot-skills',
    method: 'POST',
    body: {
      message: 'What services do you offer?',
      sessionId: `test-${Date.now()}`,
      productKey: 'test-key'
    },
    expectedStatus: 200
  }
];

// Test runner
async function runTest(testCase) {
  return new Promise((resolve) => {
    const url = new URL(config.url + testCase.endpoint);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const startTime = Date.now();
    
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode === testCase.expectedStatus;
        
        let responseData = null;
        try {
          responseData = JSON.parse(data);
        } catch {
          responseData = data;
        }
        
        resolve({
          name: testCase.name,
          success,
          statusCode: res.statusCode,
          expectedStatus: testCase.expectedStatus,
          responseTime,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        name: testCase.name,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });
    
    if (testCase.body) {
      req.write(JSON.stringify(testCase.body));
    }
    
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  const results = [];
  
  for (const testCase of testCases) {
    process.stdout.write(`Running: ${testCase.name}... `);
    const result = await runTest(testCase);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ PASS (${result.responseTime}ms)`);
      
      // Show additional details for diagnostic tests
      if (testCase.name === 'Full Diagnostics' && result.data) {
        console.log(`  Health Score: ${result.data.healthScore}`);
        console.log(`  Tests:`, result.data.tests);
      }
      
      if (testCase.name === 'Monitoring Endpoint' && result.data) {
        console.log(`  Status: ${result.data.status}`);
        console.log(`  Success Rate: ${result.data.metrics?.successRate}%`);
        console.log(`  Avg Response: ${result.data.metrics?.avgResponseTime}`);
      }
      
    } else {
      console.log(`❌ FAIL`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      } else {
        console.log(`  Expected: ${result.expectedStatus}, Got: ${result.statusCode}`);
      }
      if (result.data?.error) {
        console.log(`  Message: ${result.data.error}`);
      }
    }
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log('=====================================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime}ms`);
  
  // Recommendations
  console.log('\n📋 Recommendations:');
  
  if (failed === 0) {
    console.log('✨ All tests passed! System is ready for production use.');
    console.log('   - Monitor the /api/chatbot-skills/monitoring endpoint regularly');
    console.log('   - Set up alerts for response times > 1000ms');
    console.log('   - Review conversation logs daily during migration');
  } else {
    console.log('⚠️  Some tests failed. Please review:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - Fix ${r.name}: ${r.error || `Status ${r.statusCode}`}`);
    });
    console.log('\n   Run deployment checklist:');
    console.log('   1. Check environment variables');
    console.log('   2. Verify database connection');
    console.log('   3. Rebuild skills-orchestrator package');
    console.log('   4. Review error logs');
  }
  
  // Performance warning
  if (avgResponseTime > 1000) {
    console.log('\n⚠️  Performance Warning:');
    console.log(`   Average response time (${avgResponseTime}ms) is above target (1000ms)`);
    console.log('   Consider scaling infrastructure or optimizing queries');
  }
  
  console.log('\n=====================================\n');
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Execute tests
runAllTests().catch(console.error);