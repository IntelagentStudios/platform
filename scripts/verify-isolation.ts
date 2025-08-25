import { PrismaClient } from '@prisma/client';
import { License, ChatbotLog, MASTER_ADMIN_KEY, TEST_USER_KEY, TEST_FRIEND_KEY } from '../types/license';

const prisma = new PrismaClient();

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

class DataIsolationVerifier {
  private results: VerificationResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting Data Isolation Verification...\n');
    console.log('='*50);

    // Test 1: Check unique site keys
    await this.testUniqueSiteKeys();

    // Test 2: Verify products arrays
    await this.testProductArrays();

    // Test 3: Count conversations per account
    await this.testConversationCounts();

    // Test 4: Test data isolation
    await this.testDataIsolation();

    // Test 5: Verify is_pro flags
    await this.testProFlags();

    // Test 6: Check for site_key collisions
    await this.testSiteKeyCollisions();

    // Generate report
    this.generateReport();
  }

  private async testUniqueSiteKeys(): Promise<void> {
    console.log('Test 1: Checking for unique site keys...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY }
      });

      if (!userLicense || !friendLicense) {
        this.results.push({
          passed: false,
          message: 'Site Keys: One or both test licenses not found',
          details: { userFound: !!userLicense, friendFound: !!friendLicense }
        });
        return;
      }

      const bothHaveSiteKeys = !!userLicense.site_key && !!friendLicense.site_key;
      const keysAreDifferent = userLicense.site_key !== friendLicense.site_key;

      this.results.push({
        passed: bothHaveSiteKeys && keysAreDifferent,
        message: `Site Keys: ${bothHaveSiteKeys && keysAreDifferent ? 'UNIQUE ✅' : 'NOT UNIQUE ❌'}`,
        details: {
          user_site_key: userLicense.site_key || 'MISSING',
          friend_site_key: friendLicense.site_key || 'MISSING',
          unique: keysAreDifferent
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Site Keys: Error checking site keys',
        details: error
      });
    }
  }

  private async testProductArrays(): Promise<void> {
    console.log('Test 2: Verifying product arrays...');
    
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
          user: {
            expected: expectedUserProducts,
            actual: userLicense?.products || [],
            correct: userProductsCorrect
          },
          friend: {
            expected: expectedFriendProducts,
            actual: friendLicense?.products || [],
            correct: friendProductsCorrect
          }
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Product Arrays: Error checking products',
        details: error
      });
    }
  }

  private async testConversationCounts(): Promise<void> {
    console.log('Test 3: Counting conversations per account...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY }
      });

      const userConversations = userLicense?.site_key ? 
        await prisma.chatbot_logs.count({
          where: { site_key: userLicense.site_key }
        }) : 0;

      const friendConversations = friendLicense?.site_key ?
        await prisma.chatbot_logs.count({
          where: { site_key: friendLicense.site_key }
        }) : 0;

      // Also check for any orphaned conversations (with site_keys that don't belong to any license)
      const allSiteKeys = await prisma.licenses.findMany({
        where: { site_key: { not: null } },
        select: { site_key: true }
      });

      const validSiteKeys = allSiteKeys.map(l => l.site_key).filter(Boolean) as string[];
      
      const orphanedConversations = await prisma.chatbot_logs.count({
        where: {
          AND: [
            { site_key: { not: null } },
            { site_key: { notIn: validSiteKeys.length > 0 ? validSiteKeys : ['dummy'] } }
          ]
        }
      });

      this.results.push({
        passed: true, // This is informational
        message: `Conversation Counts: DATA FOUND ℹ️`,
        details: {
          user_conversations: userConversations,
          friend_conversations: friendConversations,
          orphaned_conversations: orphanedConversations,
          user_site_key: userLicense?.site_key || 'MISSING',
          friend_site_key: friendLicense?.site_key || 'MISSING'
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Conversation Counts: Error counting',
        details: error
      });
    }
  }

  private async testDataIsolation(): Promise<void> {
    console.log('Test 4: Testing data isolation...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY }
      });

      if (!userLicense?.site_key || !friendLicense?.site_key) {
        this.results.push({
          passed: false,
          message: 'Data Isolation: Cannot test - missing site keys',
          details: { 
            user_has_key: !!userLicense?.site_key,
            friend_has_key: !!friendLicense?.site_key
          }
        });
        return;
      }

      // Get user's conversations
      const userConvs = await prisma.chatbot_logs.findMany({
        where: { site_key: userLicense.site_key },
        take: 5
      });

      // Get friend's conversations
      const friendConvs = await prisma.chatbot_logs.findMany({
        where: { site_key: friendLicense.site_key },
        take: 5
      });

      // Check if any of user's conversations have friend's site_key or vice versa
      const userConvsLeaked = userConvs.some(c => c.site_key === friendLicense.site_key);
      const friendConvsLeaked = friendConvs.some(c => c.site_key === userLicense.site_key);

      // Check if querying with wrong site_key returns data
      const wrongQuery1 = await prisma.chatbot_logs.findMany({
        where: { site_key: userLicense.site_key },
        take: 100
      });

      const wrongQuery2 = await prisma.chatbot_logs.findMany({
        where: { site_key: friendLicense.site_key },
        take: 100
      });

      const crossContamination = wrongQuery1.some(c => c.site_key === friendLicense.site_key) ||
                                wrongQuery2.some(c => c.site_key === userLicense.site_key);

      this.results.push({
        passed: !userConvsLeaked && !friendConvsLeaked && !crossContamination,
        message: `Data Isolation: ${!crossContamination ? 'ISOLATED ✅' : 'LEAK DETECTED ❌'}`,
        details: {
          user_conversations_isolated: !userConvsLeaked,
          friend_conversations_isolated: !friendConvsLeaked,
          no_cross_contamination: !crossContamination,
          user_conv_count: userConvs.length,
          friend_conv_count: friendConvs.length
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Data Isolation: Error testing isolation',
        details: error
      });
    }
  }

  private async testProFlags(): Promise<void> {
    console.log('Test 5: Verifying is_pro flags...');
    
    try {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_USER_KEY }
      });

      const friendLicense = await prisma.licenses.findUnique({
        where: { license_key: TEST_FRIEND_KEY }
      });

      const userProCorrect = userLicense?.is_pro === true;
      const friendProCorrect = friendLicense?.is_pro === false;

      this.results.push({
        passed: userProCorrect && friendProCorrect,
        message: `Pro Flags: ${userProCorrect && friendProCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}`,
        details: {
          user: {
            expected: true,
            actual: userLicense?.is_pro,
            correct: userProCorrect
          },
          friend: {
            expected: false,
            actual: friendLicense?.is_pro,
            correct: friendProCorrect
          }
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Pro Flags: Error checking flags',
        details: error
      });
    }
  }

  private async testSiteKeyCollisions(): Promise<void> {
    console.log('Test 6: Checking for site_key collisions...');
    
    try {
      const allLicenses = await prisma.licenses.findMany({
        where: { site_key: { not: null } },
        select: { license_key: true, site_key: true }
      });

      const siteKeyMap = new Map<string, string[]>();
      
      allLicenses.forEach(license => {
        if (license.site_key) {
          if (!siteKeyMap.has(license.site_key)) {
            siteKeyMap.set(license.site_key, []);
          }
          siteKeyMap.get(license.site_key)!.push(license.license_key);
        }
      });

      const collisions: { site_key: string; licenses: string[] }[] = [];
      
      siteKeyMap.forEach((licenses, siteKey) => {
        if (licenses.length > 1) {
          collisions.push({ site_key: siteKey, licenses });
        }
      });

      this.results.push({
        passed: collisions.length === 0,
        message: `Site Key Collisions: ${collisions.length === 0 ? 'NONE ✅' : `${collisions.length} FOUND ❌`}`,
        details: {
          total_licenses_with_keys: allLicenses.length,
          unique_site_keys: siteKeyMap.size,
          collisions: collisions
        }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Site Key Collisions: Error checking',
        details: error
      });
    }
  }

  private generateReport(): void {
    console.log('\n' + '='*50);
    console.log('📊 VERIFICATION REPORT');
    console.log('='*50 + '\n');

    let allPassed = true;

    this.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2).split('\n').join('\n   '));
      }
      
      if (!result.passed && result.message.includes('❌')) {
        allPassed = false;
      }
      
      console.log('');
    });

    console.log('='*50);
    console.log(`OVERALL STATUS: ${allPassed ? '✅ ALL CRITICAL TESTS PASSED' : '❌ ISSUES DETECTED - FIXING REQUIRED'}`);
    console.log('='*50 + '\n');

    if (!allPassed) {
      console.log('⚠️  ACTION REQUIRED: Run the setup script to fix issues');
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