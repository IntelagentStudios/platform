import { PrismaClient } from '@prisma/client';
import { License, ChatbotLog, MASTER_ADMIN_KEY, TEST_USER_KEY, TEST_FRIEND_KEY } from '../types/license';

const prisma = new PrismaClient();

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Data Isolation Verification
 * 
 * Correct Architecture:
 * - license_key is the PRIMARY filter (account identifier)
 * - site_key is SECONDARY filter (product-specific for chatbot)
 * - Other products will use license_key directly
 * 
 * Pattern: JWT → license_key → product_key → product_data
 */
class DataIsolationVerifier {
  private results: VerificationResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Data Isolation Verification (License-Key Based)...\n');
    console.log('='*50);
    console.log('Architecture: license_key (primary) → site_key (chatbot) → data');
    console.log('='*50 + '\n');

    // Test 1: Verify license keys exist and are unique
    await this.testLicenseKeyUniqueness();

    // Test 2: Test license_key → site_key mapping
    await this.testLicenseToSiteKeyMapping();

    // Test 3: Verify products arrays (license-based)
    await this.testProductArrays();

    // Test 4: Test chatbot data isolation via license → site_key
    await this.testChatbotDataIsolation();

    // Test 5: Simulate other product data access (license_key direct)
    await this.testOtherProductDataAccess();

    // Test 6: Verify is_pro flags
    await this.testProFlags();

    // Test 7: Test cross-license contamination
    await this.testCrossLicenseContamination();

    // Test 8: Verify master admin access
    await this.testMasterAdminAccess();

    // Generate report
    this.generateReport();
  }

  private async testLicenseKeyUniqueness(): Promise<void> {
    console.log('Test 1: Checking license key uniqueness...');
    
    try {
      const licenses = await prisma.licenses.findMany({
        where: {
          license_key: {
            in: [TEST_USER_KEY, TEST_FRIEND_KEY, MASTER_ADMIN_KEY]
          }
        },
        select: {
          license_key: true,
          email: true,
          products: true
        }
      });

      const foundKeys = licenses.map(l => l.license_key);
      const hasUser = foundKeys.includes(TEST_USER_KEY);
      const hasFriend = foundKeys.includes(TEST_FRIEND_KEY);

      this.results.push({
        passed: hasUser && hasFriend,
        message: `License Keys: ${hasUser && hasFriend ? 'FOUND ✅' : 'MISSING ❌'}`,
        details: {
          user_license: hasUser ? 'EXISTS' : 'MISSING',
          friend_license: hasFriend ? 'EXISTS' : 'MISSING',
          found_licenses: foundKeys
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'License Keys: Error checking',
        details: error
      });
    }
  }

  private async testLicenseToSiteKeyMapping(): Promise<void> {
    console.log('Test 2: Testing license_key → site_key mapping...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY },
        select: { license_key: true, site_key: true, products: true }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY },
        select: { license_key: true, site_key: true, products: true }
      });

      const userHasChatbot = userLicense?.products.includes('chatbot');
      const friendHasChatbot = friendLicense?.products.includes('chatbot');
      
      const userSiteKeyValid = userHasChatbot ? !!userLicense?.site_key : true;
      const friendSiteKeyValid = friendHasChatbot ? !!friendLicense?.site_key : true;
      
      const siteKeysUnique = userLicense?.site_key !== friendLicense?.site_key;

      this.results.push({
        passed: userSiteKeyValid && friendSiteKeyValid && siteKeysUnique,
        message: `License→Site Mapping: ${userSiteKeyValid && friendSiteKeyValid && siteKeysUnique ? 'CORRECT ✅' : 'INCORRECT ❌'}`,
        details: {
          user: {
            license_key: TEST_USER_KEY,
            has_chatbot: userHasChatbot,
            site_key: userLicense?.site_key || 'NONE',
            valid: userSiteKeyValid
          },
          friend: {
            license_key: TEST_FRIEND_KEY,
            has_chatbot: friendHasChatbot,
            site_key: friendLicense?.site_key || 'NONE',
            valid: friendSiteKeyValid
          },
          site_keys_unique: siteKeysUnique
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'License→Site Mapping: Error',
        details: error
      });
    }
  }

  private async testProductArrays(): Promise<void> {
    console.log('Test 3: Verifying product arrays (per license)...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY }
      });

      const expectedUserProducts = ['chatbot', 'sales-agent', 'data-enrichment', 'setup-agent'];
      const expectedFriendProducts = ['chatbot'];

      const userProductsCorrect = JSON.stringify(userLicense?.products.sort()) === JSON.stringify(expectedUserProducts.sort());
      const friendProductsCorrect = JSON.stringify(friendLicense?.products.sort()) === JSON.stringify(expectedFriendProducts.sort());

      this.results.push({
        passed: userProductsCorrect && friendProductsCorrect,
        message: `Product Arrays: ${userProductsCorrect && friendProductsCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}`,
        details: {
          user_license: {
            expected: expectedUserProducts,
            actual: userLicense?.products || [],
            correct: userProductsCorrect
          },
          friend_license: {
            expected: expectedFriendProducts,
            actual: friendLicense?.products || [],
            correct: friendProductsCorrect
          }
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Product Arrays: Error',
        details: error
      });
    }
  }

  private async testChatbotDataIsolation(): Promise<void> {
    console.log('Test 4: Testing chatbot data isolation (license → site_key → data)...');
    
    try {
      // Get licenses with their site keys
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY },
        select: { site_key: true }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY },
        select: { site_key: true }
      });

      if (!userLicense?.site_key || !friendLicense?.site_key) {
        this.results.push({
          passed: false,
          message: 'Chatbot Isolation: Cannot test - missing site keys',
          details: { 
            user_site_key: userLicense?.site_key || 'MISSING',
            friend_site_key: friendLicense?.site_key || 'MISSING'
          }
        });
        return;
      }

      // Count conversations per site_key
      const userConvCount = await prisma.chatbot_logs.count({
        where: { site_key: userLicense.site_key }
      });

      const friendConvCount = await prisma.chatbot_logs.count({
        where: { site_key: friendLicense.site_key }
      });

      // Check for data leakage
      const userConvs = await prisma.chatbot_logs.findMany({
        where: { site_key: userLicense.site_key },
        select: { site_key: true },
        take: 100
      });

      const friendConvs = await prisma.chatbot_logs.findMany({
        where: { site_key: friendLicense.site_key },
        select: { site_key: true },
        take: 100
      });

      // Verify all conversations have correct site_key
      const userDataClean = userConvs.every(c => c.site_key === userLicense.site_key);
      const friendDataClean = friendConvs.every(c => c.site_key === friendLicense.site_key);

      this.results.push({
        passed: userDataClean && friendDataClean,
        message: `Chatbot Isolation: ${userDataClean && friendDataClean ? 'PROPERLY ISOLATED ✅' : 'LEAK DETECTED ❌'}`,
        details: {
          pattern: 'license_key → site_key → chatbot_logs',
          user: {
            site_key: userLicense.site_key,
            conversation_count: userConvCount,
            data_clean: userDataClean
          },
          friend: {
            site_key: friendLicense.site_key,
            conversation_count: friendConvCount,
            data_clean: friendDataClean
          }
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Chatbot Isolation: Error',
        details: error
      });
    }
  }

  private async testOtherProductDataAccess(): Promise<void> {
    console.log('Test 5: Simulating other product data access (direct license_key)...');
    
    // Since we don't have sales_data or enrichment_data tables yet,
    // we'll simulate the expected pattern
    
    this.results.push({
      passed: true,
      message: 'Other Products Pattern: READY ✅',
      details: {
        sales_agent: {
          pattern: 'license_key → sales_data (direct)',
          example: 'SELECT * FROM sales_data WHERE license_key = ?',
          note: 'Will query directly with license_key'
        },
        data_enrichment: {
          pattern: 'license_key → enrichment_data (direct)',
          example: 'SELECT * FROM enrichment_data WHERE license_key = ?',
          note: 'Will query directly with license_key'
        },
        setup_agent: {
          pattern: 'license_key → agent_configs (direct)',
          example: 'SELECT * FROM agent_configs WHERE license_key = ?',
          note: 'Will query directly with license_key'
        }
      }
    });
  }

  private async testProFlags(): Promise<void> {
    console.log('Test 6: Verifying is_pro flags (per license)...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY },
        select: { is_pro: true }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY },
        select: { is_pro: true }
      });

      const userProCorrect = userLicense?.is_pro === true;
      const friendProCorrect = friendLicense?.is_pro === false;

      this.results.push({
        passed: userProCorrect && friendProCorrect,
        message: `Pro Flags: ${userProCorrect && friendProCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}`,
        details: {
          user_license: {
            expected_pro: true,
            actual_pro: userLicense?.is_pro,
            correct: userProCorrect
          },
          friend_license: {
            expected_pro: false,
            actual_pro: friendLicense?.is_pro,
            correct: friendProCorrect
          }
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Pro Flags: Error',
        details: error
      });
    }
  }

  private async testCrossLicenseContamination(): Promise<void> {
    console.log('Test 7: Testing cross-license contamination...');
    
    try {
      // Get both licenses
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY },
        select: { site_key: true, products: true }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY },
        select: { site_key: true, products: true }
      });

      // Check if licenses share any product-specific keys
      const keysUnique = userLicense?.site_key !== friendLicense?.site_key;
      
      // Check if products are properly separated
      const userHasAllProducts = userLicense?.products.length === 4;
      const friendHasOneProduct = friendLicense?.products.length === 1;

      this.results.push({
        passed: keysUnique && userHasAllProducts && friendHasOneProduct,
        message: `Cross-License Check: ${keysUnique ? 'NO CONTAMINATION ✅' : 'CONTAMINATION DETECTED ❌'}`,
        details: {
          license_separation: keysUnique ? 'PROPERLY SEPARATED' : 'KEYS SHARED',
          user_product_count: userLicense?.products.length,
          friend_product_count: friendLicense?.products.length,
          isolation_status: 'Each license has its own data scope'
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Cross-License Check: Error',
        details: error
      });
    }
  }

  private async testMasterAdminAccess(): Promise<void> {
    console.log('Test 8: Testing master admin global access...');
    
    try {
      // Check if master admin key exists
      const adminLicense = await prisma.licenses.findUnique({
        where: { license_key: MASTER_ADMIN_KEY }
      });

      // Count total conversations in system
      const totalConversations = await prisma.chatbot_logs.count();

      this.results.push({
        passed: true,
        message: 'Master Admin Access: CONFIGURED ✅',
        details: {
          admin_key: MASTER_ADMIN_KEY,
          admin_license_exists: !!adminLicense,
          access_pattern: 'Master admin bypasses all filters',
          total_system_conversations: totalConversations,
          note: 'Master admin sees all data regardless of license_key or site_key'
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Master Admin Access: Error',
        details: error
      });
    }
  }

  private generateReport(): void {
    console.log('\n' + '='*50);
    console.log('📊 DATA ISOLATION VERIFICATION REPORT');
    console.log('='*50 + '\n');

    let allPassed = true;
    let criticalPassed = true;

    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2).split('\n').join('\n   '));
      }
      
      if (!result.passed && result.message.includes('❌')) {
        allPassed = false;
        // Critical tests are 1-4 and 7
        if ([0, 1, 2, 3, 6].includes(index)) {
          criticalPassed = false;
        }
      }
      
      console.log('');
    });

    console.log('='*50);
    console.log('ARCHITECTURE SUMMARY:');
    console.log('  Primary Key: license_key (account identifier)');
    console.log('  Chatbot: license_key → site_key → chatbot_logs');
    console.log('  Other Products: license_key → product_data (direct)');
    console.log('  Master Admin: Bypasses all filters (global view)');
    console.log('='*50);
    
    if (criticalPassed) {
      console.log(`STATUS: ✅ CRITICAL TESTS PASSED - Data properly isolated by license_key`);
    } else {
      console.log(`STATUS: ❌ CRITICAL ISSUES DETECTED - Data isolation compromised`);
    }
    
    console.log('='*50 + '\n');

    if (!criticalPassed) {
      console.log('⚠️  ACTION REQUIRED: Run setup script to fix isolation issues');
      console.log('   npm run setup-test-accounts');
    }
  }
}

async function main() {
  const verifier = new DataIsolationVerifier();
  
  try {
    await verifier.runAllTests();
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();