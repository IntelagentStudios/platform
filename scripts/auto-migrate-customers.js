#!/usr/bin/env node

/**
 * Automated Customer Migration Script
 * Gradually migrates customers from n8n to skills system
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  batchSize: 10,           // Number of customers to migrate per run
  testDuration: 86400000,  // 24 hours in milliseconds
  errorThreshold: 0.05,    // 5% error rate threshold
  responseTimeThreshold: 1000, // 1000ms threshold
  dryRun: process.argv.includes('--dry-run')
};

// Migration phases
const PHASES = {
  TESTING: 'testing',
  GRADUAL: 'gradual', 
  ACCELERATED: 'accelerated',
  FINAL: 'final'
};

class CustomerMigrator {
  constructor() {
    this.stats = {
      migrated: 0,
      failed: 0,
      skipped: 0,
      rollback: 0
    };
  }

  async run() {
    console.log('🚀 Starting Customer Migration Process');
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('=====================================\n');

    try {
      // Get current migration phase
      const phase = await this.getCurrentPhase();
      console.log(`Current Phase: ${phase}\n`);

      // Get customers to migrate
      const customers = await this.getCustomersToMigrate(phase);
      console.log(`Found ${customers.length} customers to migrate\n`);

      if (customers.length === 0) {
        console.log('✅ No customers to migrate at this time');
        return;
      }

      // Check system health before migration
      const healthCheck = await this.checkSystemHealth();
      if (!healthCheck.healthy) {
        console.error('❌ System health check failed:', healthCheck.reason);
        console.log('Migration postponed. Please resolve issues and try again.');
        return;
      }

      // Migrate customers in batches
      for (let i = 0; i < customers.length; i += CONFIG.batchSize) {
        const batch = customers.slice(i, i + CONFIG.batchSize);
        await this.migrateBatch(batch, phase);
        
        // Check health after each batch
        const postBatchHealth = await this.checkSystemHealth();
        if (!postBatchHealth.healthy) {
          console.error('⚠️ Health check failed after batch. Stopping migration.');
          break;
        }
        
        // Add delay between batches
        if (i + CONFIG.batchSize < customers.length) {
          console.log('Waiting 30 seconds before next batch...');
          await this.delay(30000);
        }
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  async getCurrentPhase() {
    // Check migration progress from database or config
    try {
      const totalCustomers = await prisma.productKey.count();
      const migratedCustomers = await prisma.productKey.count({
        where: {
          metadata: {
            path: '$.migrationStatus',
            equals: 'skills'
          }
        }
      });

      const percentage = (migratedCustomers / totalCustomers) * 100;

      if (percentage < 10) return PHASES.TESTING;
      if (percentage < 30) return PHASES.GRADUAL;
      if (percentage < 70) return PHASES.ACCELERATED;
      return PHASES.FINAL;
    } catch {
      return PHASES.TESTING;
    }
  }

  async getCustomersToMigrate(phase) {
    // Select customers based on phase
    const criteria = this.getMigrationCriteria(phase);
    
    try {
      const customers = await prisma.productKey.findMany({
        where: {
          isActive: true,
          NOT: {
            metadata: {
              path: '$.migrationStatus',
              equals: 'skills'
            }
          },
          ...criteria
        },
        take: this.getBatchLimit(phase),
        orderBy: [
          { priority: 'desc' },  // Migrate high-priority customers first
          { createdAt: 'asc' }   // Older customers first
        ]
      });

      return customers;
    } catch {
      // Fallback to mock data if database not available
      return CONFIG.dryRun ? this.getMockCustomers() : [];
    }
  }

  getMigrationCriteria(phase) {
    switch (phase) {
      case PHASES.TESTING:
        // Only test/internal accounts
        return {
          OR: [
            { productKey: { contains: 'test' } },
            { email: { endsWith: '@intelagentstudios.com' } }
          ]
        };
      
      case PHASES.GRADUAL:
        // Low-traffic customers
        return {
          // Customers with < 100 conversations per day
          metadata: {
            path: '$.dailyConversations',
            lte: 100
          }
        };
      
      case PHASES.ACCELERATED:
        // Most customers except high-value
        return {
          NOT: {
            metadata: {
              path: '$.tier',
              equals: 'enterprise'
            }
          }
        };
      
      case PHASES.FINAL:
        // Everyone
        return {};
        
      default:
        return {};
    }
  }

  getBatchLimit(phase) {
    switch (phase) {
      case PHASES.TESTING: return 5;
      case PHASES.GRADUAL: return 10;
      case PHASES.ACCELERATED: return 50;
      case PHASES.FINAL: return 100;
      default: return CONFIG.batchSize;
    }
  }

  async migrateBatch(customers, phase) {
    console.log(`\nMigrating batch of ${customers.length} customers...`);

    for (const customer of customers) {
      try {
        // Step 1: Update customer configuration
        if (!CONFIG.dryRun) {
          await this.updateCustomerConfig(customer);
        }
        
        console.log(`✅ Migrated: ${customer.productKey} (${customer.email || 'N/A'})`);
        this.stats.migrated++;

        // Step 2: Test the migration
        const testResult = await this.testCustomerMigration(customer);
        
        if (!testResult.success) {
          console.log(`⚠️ Test failed for ${customer.productKey}, rolling back...`);
          if (!CONFIG.dryRun) {
            await this.rollbackCustomer(customer);
          }
          this.stats.rollback++;
        }

        // Step 3: Send notification (if in production phase)
        if (phase !== PHASES.TESTING && !CONFIG.dryRun) {
          await this.notifyCustomer(customer);
        }

      } catch (error) {
        console.error(`❌ Failed to migrate ${customer.productKey}:`, error.message);
        this.stats.failed++;
      }

      // Small delay between customers
      await this.delay(1000);
    }
  }

  async updateCustomerConfig(customer) {
    // Update customer metadata to use skills system
    return prisma.productKey.update({
      where: { id: customer.id },
      data: {
        metadata: {
          ...customer.metadata,
          migrationStatus: 'skills',
          migrationDate: new Date().toISOString(),
          previousMode: 'n8n'
        }
      }
    });
  }

  async testCustomerMigration(customer) {
    // Send test message to verify migration
    try {
      const response = await fetch('https://dashboard.intelagentstudios.com/api/chatbot-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Migration test message',
          productKey: customer.productKey,
          sessionId: `migration-test-${Date.now()}`
        })
      });

      const responseTime = response.headers.get('x-response-time');
      const data = await response.json();

      return {
        success: response.ok && !data.error,
        responseTime: parseInt(responseTime) || 0,
        data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async rollbackCustomer(customer) {
    // Revert customer to n8n mode
    return prisma.productKey.update({
      where: { id: customer.id },
      data: {
        metadata: {
          ...customer.metadata,
          migrationStatus: 'n8n',
          rollbackDate: new Date().toISOString(),
          rollbackReason: 'test_failed'
        }
      }
    });
  }

  async notifyCustomer(customer) {
    // Send email notification about successful migration
    console.log(`📧 Sending notification to ${customer.email}`);
    
    // In production, this would send actual email
    // For now, just log
    if (!CONFIG.dryRun) {
      // await emailService.send({
      //   to: customer.email,
      //   template: 'migration_success',
      //   data: { productKey: customer.productKey }
      // });
    }
  }

  async checkSystemHealth() {
    try {
      // Check skills API health
      const healthResponse = await fetch(
        'https://dashboard.intelagentstudios.com/api/chatbot-skills/monitoring?period=1h'
      );
      
      if (!healthResponse.ok) {
        return { healthy: false, reason: 'API not responding' };
      }

      const health = await healthResponse.json();
      
      // Check error rate
      if (health.metrics?.successRate < (100 - CONFIG.errorThreshold * 100)) {
        return { 
          healthy: false, 
          reason: `Error rate too high: ${100 - health.metrics.successRate}%` 
        };
      }

      // Check response time
      const avgResponse = parseInt(health.metrics?.avgResponseTime) || 0;
      if (avgResponse > CONFIG.responseTimeThreshold) {
        return { 
          healthy: false, 
          reason: `Response time too slow: ${avgResponse}ms` 
        };
      }

      return { healthy: true };
      
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  getMockCustomers() {
    // Mock customers for testing
    return [
      {
        id: '1',
        productKey: 'test-key-001',
        email: 'test1@example.com',
        metadata: {}
      },
      {
        id: '2',
        productKey: 'test-key-002',
        email: 'test2@example.com',
        metadata: {}
      }
    ];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    console.log('\n=====================================');
    console.log('📊 Migration Summary');
    console.log('=====================================');
    console.log(`✅ Successfully migrated: ${this.stats.migrated}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏩ Skipped: ${this.stats.skipped}`);
    console.log(`↩️ Rolled back: ${this.stats.rollback}`);
    console.log('=====================================\n');

    // Exit code based on results
    const exitCode = this.stats.failed > 0 || this.stats.rollback > 0 ? 1 : 0;
    process.exit(exitCode);
  }
}

// Run migration
const migrator = new CustomerMigrator();
migrator.run().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Migration interrupted by user');
  await prisma.$disconnect();
  process.exit(1);
});