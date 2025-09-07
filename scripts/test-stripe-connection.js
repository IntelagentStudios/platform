/**
 * Simple Stripe Connection Test
 * Tests that Stripe API keys are working correctly
 */

// Load environment variables
require('dotenv').config({ path: '.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  console.log('🧪 Testing Stripe Connection\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Verify API key
    console.log('1️⃣  Verifying API Key...');
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    console.log(`   Mode: ${isLiveMode ? '🔴 LIVE' : '🔵 TEST'}`);
    console.log(`   ✅ API Key configured\n`);

    // Test 2: Test connection
    console.log('2️⃣  Testing Stripe Connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`   ✅ Connected to: ${account.settings.dashboard.display_name || account.email}`);
    console.log(`   Account ID: ${account.id}\n`);

    // Test 3: List products
    console.log('3️⃣  Checking Products...');
    const products = await stripe.products.list({ limit: 10 });
    console.log(`   ✅ Found ${products.data.length} products:`);
    products.data.forEach(product => {
      console.log(`      - ${product.name} (${product.id})`);
    });
    console.log();

    // Test 4: List prices
    console.log('4️⃣  Checking Prices...');
    const prices = await stripe.prices.list({ limit: 20, active: true });
    console.log(`   ✅ Found ${prices.data.length} active prices\n`);

    // Test 5: Check webhook endpoints
    console.log('5️⃣  Checking Webhook Endpoints...');
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
    if (webhooks.data.length > 0) {
      console.log(`   ✅ Found ${webhooks.data.length} webhook endpoints:`);
      webhooks.data.forEach(webhook => {
        console.log(`      - ${webhook.url}`);
        console.log(`        Status: ${webhook.status}`);
        console.log(`        Events: ${webhook.enabled_events.slice(0, 3).join(', ')}${webhook.enabled_events.length > 3 ? '...' : ''}`);
      });
    } else {
      console.log('   ⚠️  No webhook endpoints configured');
      console.log('   📝 Add webhook at: https://dashboard.stripe.com/webhooks');
      console.log('   URL: https://dashboard.intelagentstudios.com/api/stripe/webhook');
    }
    console.log();

    // Test 6: Create test checkout session
    console.log('6️⃣  Creating Test Checkout Session...');
    
    // Find starter monthly price
    const starterPrice = prices.data.find(p => 
      p.metadata?.tier === 'starter' && 
      p.metadata?.billing === 'monthly'
    );
    
    if (starterPrice) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: starterPrice.id,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: 'https://dashboard.intelagentstudios.com/success',
        cancel_url: 'https://dashboard.intelagentstudios.com/marketplace',
        metadata: {
          test: 'true'
        }
      });
      
      console.log(`   ✅ Checkout session created: ${session.id}`);
      console.log(`   🔗 Test URL: ${session.url}\n`);
    } else {
      console.log('   ⚠️  Starter price not found\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('✅ STRIPE INTEGRATION TEST PASSED');
    console.log('='.repeat(60));
    console.log('\n📋 Configuration Summary:');
    console.log(`   - Mode: ${isLiveMode ? 'LIVE' : 'TEST'}`);
    console.log(`   - Products: ${products.data.length}`);
    console.log(`   - Prices: ${prices.data.length}`);
    console.log(`   - Webhooks: ${webhooks.data.length}`);
    
    if (webhooks.data.length === 0) {
      console.log('\n⚠️  IMPORTANT: Configure webhook endpoint in Stripe Dashboard');
      console.log('   1. Go to: https://dashboard.stripe.com/webhooks');
      console.log('   2. Add endpoint: https://dashboard.intelagentstudios.com/api/stripe/webhook');
      console.log('   3. Select events: checkout.session.completed, customer.subscription.*');
      console.log('   4. Copy signing secret to STRIPE_WEBHOOK_SECRET in Railway');
    }

    // Check environment variables
    console.log('\n🔐 Environment Variables:');
    console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}`);
    
    const priceEnvVars = [
      'STRIPE_PRICE_STARTER_MONTHLY',
      'STRIPE_PRICE_STARTER_ANNUAL',
      'STRIPE_PRICE_PRO_MONTHLY',
      'STRIPE_PRICE_PRO_ANNUAL',
      'STRIPE_PRICE_ENTERPRISE_MONTHLY',
      'STRIPE_PRICE_ENTERPRISE_ANNUAL'
    ];
    
    const missingPrices = priceEnvVars.filter(key => !process.env[key]);
    if (missingPrices.length === 0) {
      console.log(`   Price IDs: ✅ All ${priceEnvVars.length} configured`);
    } else {
      console.log(`   Price IDs: ⚠️  ${missingPrices.length} missing`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n📝 Fix: Add STRIPE_SECRET_KEY to .env file');
    } else if (error.message.includes('No such')) {
      console.error('\n📝 Fix: Check that you\'re using the correct API key (live vs test)');
    } else {
      console.error('\n📝 Check your Stripe Dashboard for more details');
    }
  }
}

// Verify environment
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  console.error('   Please add it to your .env file');
  process.exit(1);
}

// Run test
testStripeConnection().catch(console.error);