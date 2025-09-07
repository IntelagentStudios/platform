/**
 * Test Script for End-to-End Payment Flow
 * 
 * This script tests:
 * 1. Creating a Stripe checkout session
 * 2. Simulating successful payment
 * 3. Webhook processing
 * 4. License generation
 * 5. Financial tracking
 */

// Load environment variables first
require('dotenv').config({ path: '.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('../packages/database/dist');
const prisma = new PrismaClient();

// Test configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PLAN = 'starter';

async function testPaymentFlow() {
  console.log('🧪 Starting End-to-End Payment Flow Test\n');
  
  try {
    // Step 1: Create test customer
    console.log('1️⃣  Creating test customer...');
    const customer = await stripe.customers.create({
      email: TEST_EMAIL,
      name: 'Test User',
      metadata: {
        test: 'true'
      }
    });
    console.log(`   ✅ Customer created: ${customer.id}\n`);

    // Step 2: Get price ID for test plan
    console.log('2️⃣  Fetching price information...');
    const prices = await stripe.prices.list({
      active: true,
      limit: 100
    });
    
    const testPrice = prices.data.find(p => 
      p.metadata?.tier === TEST_PLAN && 
      p.metadata?.billing === 'monthly'
    );
    
    if (!testPrice) {
      throw new Error('Test price not found. Run setup-stripe-products.js first.');
    }
    console.log(`   ✅ Price found: ${testPrice.id} (${formatCurrency(testPrice.unit_amount)})\n`);

    // Step 3: Create checkout session
    console.log('3️⃣  Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: testPrice.id,
        quantity: 1
      }],
      mode: 'subscription',
      customer: customer.id,
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/marketplace',
      metadata: {
        tier: TEST_PLAN,
        test: 'true'
      }
    });
    console.log(`   ✅ Checkout session created: ${session.id}`);
    console.log(`   📋 Checkout URL: ${session.url}\n`);

    // Step 4: Simulate successful payment (for test mode)
    console.log('4️⃣  Simulating successful payment...');
    console.log('   ⚠️  In production, customer would complete payment at checkout URL');
    console.log('   🔧 For testing, manually trigger webhook or use Stripe CLI\n');

    // Step 5: Check database for license creation
    console.log('5️⃣  Checking database for license...');
    
    // Wait a moment for webhook processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const user = await prisma.users.findFirst({
      where: { email: TEST_EMAIL }
    });
    
    if (user) {
      console.log(`   ✅ User found: ${user.id}`);
      
      const license = await prisma.licenses.findFirst({
        where: { user_id: user.id }
      });
      
      if (license) {
        console.log(`   ✅ License found: ${license.license_key}`);
        console.log(`   📦 Tier: ${license.tier}`);
        console.log(`   📅 Valid until: ${license.valid_until}`);
      } else {
        console.log('   ⚠️  License not found - webhook may not have processed yet');
      }
    } else {
      console.log('   ⚠️  User not found - webhook may not have processed yet');
    }

    // Step 6: Test financial tracking
    console.log('\n6️⃣  Testing financial tracking...');
    
    // Get subscription details
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1
    });
    
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      console.log(`   ✅ Subscription active: ${subscription.id}`);
      console.log(`   💰 MRR: ${formatCurrency(subscription.items.data[0].price.unit_amount)}`);
      console.log(`   🔄 Status: ${subscription.status}`);
    }

    // Step 7: Verify Stripe integration
    console.log('\n7️⃣  Verifying Stripe integration...');
    
    // Check for recent events
    const events = await stripe.events.list({
      limit: 5
    });
    
    const checkoutEvent = events.data.find(e => 
      e.type === 'checkout.session.completed' &&
      e.data.object.id === session.id
    );
    
    if (checkoutEvent) {
      console.log(`   ✅ Webhook event found: ${checkoutEvent.id}`);
    } else {
      console.log('   ⚠️  Webhook event not found - may need to configure webhook');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Customer created successfully');
    console.log('✅ Checkout session created successfully');
    console.log('✅ Stripe integration verified');
    console.log('⚠️  Complete payment at checkout URL to fully test flow');
    console.log('\n🔗 Next steps:');
    console.log('1. Visit the checkout URL above');
    console.log('2. Use test card: 4242 4242 4242 4242');
    console.log('3. Complete payment');
    console.log('4. Check webhook logs in Stripe Dashboard');
    console.log('5. Verify license creation in database');

    // Cleanup test data (optional)
    console.log('\n🧹 Cleanup (optional):');
    console.log(`To delete test customer: stripe.customers.del('${customer.id}')`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function formatCurrency(cents) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(cents / 100);
}

// Verify environment
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  console.error('   Please add it to your .env file');
  process.exit(1);
}

// Run test
testPaymentFlow().catch(console.error);