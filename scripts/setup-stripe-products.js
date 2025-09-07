/**
 * Script to create Stripe products and prices
 * Run this once to set up your Stripe catalog
 * 
 * Usage: node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupProducts() {
  try {
    console.log('🚀 Setting up Stripe products...\n');

    // Create Products
    console.log('Creating products...');
    
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Perfect for small businesses getting started with AI',
      metadata: {
        tier: 'starter'
      }
    });
    console.log('✅ Created Starter product:', starterProduct.id);

    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'For growing businesses ready to scale with AI',
      metadata: {
        tier: 'professional'
      }
    });
    console.log('✅ Created Professional product:', professionalProduct.id);

    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Tailored solutions for large organizations',
      metadata: {
        tier: 'enterprise'
      }
    });
    console.log('✅ Created Enterprise product:', enterpriseProduct.id);

    // Create Add-on Products
    const chatbotAddon = await stripe.products.create({
      name: 'Additional Chatbot',
      description: 'Add another AI chatbot to your account',
      metadata: {
        type: 'addon',
        addon_id: 'extra-chatbot'
      }
    });
    console.log('✅ Created Chatbot addon:', chatbotAddon.id);

    const salesAgentAddon = await stripe.products.create({
      name: 'Sales Agent',
      description: 'Automated lead generation and outreach',
      metadata: {
        type: 'addon',
        addon_id: 'sales-agent-addon'
      }
    });
    console.log('✅ Created Sales Agent addon:', salesAgentAddon.id);

    const enrichmentAddon = await stripe.products.create({
      name: 'Data Enrichment Credits',
      description: '10,000 data enrichment credits',
      metadata: {
        type: 'addon',
        addon_id: 'enrichment-credits'
      }
    });
    console.log('✅ Created Enrichment addon:', enrichmentAddon.id);

    // Create Prices
    console.log('\nCreating prices...');

    // Starter Prices
    const starterMonthly = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 29900, // £299 in pence
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        tier: 'starter',
        billing: 'monthly'
      }
    });
    console.log('✅ Starter Monthly:', starterMonthly.id);

    const starterAnnual = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 299000, // £2990 (2 months free)
      currency: 'gbp',
      recurring: {
        interval: 'year'
      },
      metadata: {
        tier: 'starter',
        billing: 'annual'
      }
    });
    console.log('✅ Starter Annual:', starterAnnual.id);

    // Professional Prices
    const professionalMonthly = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 79900, // £799
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        tier: 'professional',
        billing: 'monthly'
      }
    });
    console.log('✅ Professional Monthly:', professionalMonthly.id);

    const professionalAnnual = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 799000, // £7990 (2 months free)
      currency: 'gbp',
      recurring: {
        interval: 'year'
      },
      metadata: {
        tier: 'professional',
        billing: 'annual'
      }
    });
    console.log('✅ Professional Annual:', professionalAnnual.id);

    // Enterprise Prices
    const enterpriseMonthly = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 249900, // £2499
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        tier: 'enterprise',
        billing: 'monthly'
      }
    });
    console.log('✅ Enterprise Monthly:', enterpriseMonthly.id);

    const enterpriseAnnual = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 2499000, // £24990 (2 months free)
      currency: 'gbp',
      recurring: {
        interval: 'year'
      },
      metadata: {
        tier: 'enterprise',
        billing: 'annual'
      }
    });
    console.log('✅ Enterprise Annual:', enterpriseAnnual.id);

    // Add-on Prices
    const chatbotPrice = await stripe.prices.create({
      product: chatbotAddon.id,
      unit_amount: 19900, // £199
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'addon',
        addon_id: 'extra-chatbot'
      }
    });
    console.log('✅ Chatbot Addon:', chatbotPrice.id);

    const salesAgentPrice = await stripe.prices.create({
      product: salesAgentAddon.id,
      unit_amount: 39900, // £399
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'addon',
        addon_id: 'sales-agent-addon'
      }
    });
    console.log('✅ Sales Agent Addon:', salesAgentPrice.id);

    const enrichmentPrice = await stripe.prices.create({
      product: enrichmentAddon.id,
      unit_amount: 9900, // £99
      currency: 'gbp',
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'addon',
        addon_id: 'enrichment-credits'
      }
    });
    console.log('✅ Enrichment Credits:', enrichmentPrice.id);

    // Output environment variables to set
    console.log('\n🎉 Setup complete! Add these to your .env file:\n');
    console.log(`# Main Products`);
    console.log(`STRIPE_PRICE_STARTER_MONTHLY=${starterMonthly.id}`);
    console.log(`STRIPE_PRICE_STARTER_ANNUAL=${starterAnnual.id}`);
    console.log(`STRIPE_PRICE_PRO_MONTHLY=${professionalMonthly.id}`);
    console.log(`STRIPE_PRICE_PRO_ANNUAL=${professionalAnnual.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_MONTHLY=${enterpriseMonthly.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE_ANNUAL=${enterpriseAnnual.id}`);
    console.log(`\n# Add-ons`);
    console.log(`STRIPE_PRICE_EXTRA_CHATBOT=${chatbotPrice.id}`);
    console.log(`STRIPE_PRICE_SALES_AGENT=${salesAgentPrice.id}`);
    console.log(`STRIPE_PRICE_ENRICHMENT_CREDITS=${enrichmentPrice.id}`);

    // Create Customer Portal configuration
    console.log('\n📋 Setting up Customer Portal...');
    
    const portalConfig = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your Intelagent Platform subscription',
      },
      features: {
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        subscription_pause: {
          enabled: false,
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: starterProduct.id,
              prices: [starterMonthly.id, starterAnnual.id]
            },
            {
              product: professionalProduct.id,
              prices: [professionalMonthly.id, professionalAnnual.id]
            },
            {
              product: enterpriseProduct.id,
              prices: [enterpriseMonthly.id, enterpriseAnnual.id]
            }
          ]
        }
      }
    });

    console.log('✅ Customer Portal configured:', portalConfig.id);

    // Set as default
    await stripe.billingPortal.configurations.update(portalConfig.id, {
      default_return_url: process.env.NEXT_PUBLIC_APP_URL + '/dashboard/billing'
    });

    console.log('\n✨ All done! Your Stripe products are ready to use.');

  } catch (error) {
    console.error('❌ Error setting up products:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupProducts();