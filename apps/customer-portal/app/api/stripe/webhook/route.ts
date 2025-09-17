import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendWelcomeEmail, generatePasswordResetToken, generateTemporaryPassword } from '@/lib/email/send-welcome-email';

// Initialize Stripe lazily to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
};

const prisma = new PrismaClient();

// Helper to generate license key
function generateLicenseKey(prefix: string = 'LIC'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
}

// Helper to generate product keys based on tier or product type
async function generateProductKeys(tierOrProduct: string, licenseKey: string) {
  const productKeys: any[] = [];

  // Check if it's a specific product purchase
  const specificProducts: Record<string, string> = {
    'chatbot': 'chatbot',
    'sales-outreach-agent': 'sales-agent',
    'data-enrichment': 'enrichment',
    'setup-agent': 'setup-agent'
  };

  // Check if it's a tier-based purchase or specific product
  let products: string[];

  if (specificProducts[tierOrProduct]) {
    // Specific product purchase
    products = [specificProducts[tierOrProduct]];
  } else {
    // Tier-based purchase (legacy support)
    const baseProducts = {
      starter: ['chatbot'],
      professional: ['chatbot', 'chatbot', 'chatbot', 'sales-agent', 'enrichment'],
      enterprise: ['chatbot', 'sales-agent', 'enrichment', 'setup-agent']
    };
    products = baseProducts[tierOrProduct as keyof typeof baseProducts] || ['chatbot'];
  }

  for (const productType of products) {
    const prefix = productType === 'chatbot' ? 'CHAT' :
                   productType === 'sales-agent' ? 'SALES' :
                   productType === 'enrichment' ? 'ENRICH' : 'SETUP';

    const productKey = generateLicenseKey(prefix);

    productKeys.push({
      key: productKey,
      license_key: licenseKey,
      product_type: productType,
      status: 'active',
      configuration: {},
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  return productKeys;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get metadata (removed tier and metadata references that don't exist in schema)
        const { userId, billing, isGuest, product } = session.metadata || {};
        const customerEmail = session.customer_email || session.customer_details?.email;

        // Determine product from metadata or default
        const productType = product || 'chatbot'; // Can be 'chatbot', 'sales-outreach-agent', etc.
        console.log('Checkout completed:', { userId, productType, billing, customerEmail, isGuest });

        // Handle guest checkout - create new user
        let actualUserId = userId;
        let newUserCreated = false;
        let newUserDetails: any = null;
        
        if (isGuest === 'true' || userId === 'pending') {
          // Generate a license key for the new user
          const newLicenseKey = generateLicenseKey('LIC');
          
          // Generate temporary password and reset token
          const temporaryPassword = generateTemporaryPassword();
          const resetToken = generatePasswordResetToken();
          const passwordHash = crypto.createHash('sha256').update(temporaryPassword).digest('hex');
          
          // Create new user account
          const newUser = await prisma.users.create({
            data: {
              email: customerEmail!,
              name: session.customer_details?.name || customerEmail!.split('@')[0],
              password_hash: passwordHash,
              role: 'customer',
              // Removed stripe_customer_id as it doesn't exist in schema
              license_key: newLicenseKey
            }
          });
          actualUserId = newUser.id;
          newUserCreated = true;
          newUserDetails = {
            email: newUser.email,
            name: newUser.name,
            licenseKey: newLicenseKey,
            temporaryPassword,
            resetToken
          };

          console.log('Created new user:', newUser.id);
        }

        // Get user's license key
        const user = await prisma.users.findUnique({
          where: { id: actualUserId }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Create or update license
        let license = await prisma.licenses.findFirst({
          where: { license_key: user.license_key }
        });

        if (!license) {
          // Create new license
          license = await prisma.licenses.create({
            data: {
              license_key: user.license_key,
              email: user.email,
              status: 'active',
              // Removed tier field as it doesn't exist in schema
              subscription_id: session.subscription as string,
              // Removed stripe_price_id as it doesn't exist in schema
              // Removed current_period_end as it doesn't exist in schema
              user_id: actualUserId,
              // Removed metadata field as it doesn't exist in schema
            }
          });

          // Generate product keys based on purchased product
          const productKeys = await generateProductKeys(productType, license.license_key);
          
          // Create product keys
          for (const productKey of productKeys) {
            await prisma.product_keys.create({
              data: productKey
            });
          }

          console.log('Created license and product keys:', license.license_key);
        } else {
          // Update existing license
          await prisma.licenses.update({
            where: { license_key: license.license_key },
            data: {
              // Removed tier field as it doesn't exist in schema
              subscription_id: session.subscription as string,
              status: 'active'
              // Removed metadata field as it doesn't exist in schema
            }
          });
          console.log('Updated license:', license.license_key);
        }

        // Get the created product key for the email
        const createdProductKey = await prisma.product_keys.findFirst({
          where: {
            license_key: license.license_key,
            product: productType === 'sales-outreach-agent' ? 'sales-outreach' : productType
          }
        });

        // Send welcome email if new user was created
        if (newUserCreated && newUserDetails) {
          await sendWelcomeEmail({
            ...newUserDetails,
            tier: productType || 'chatbot',
            productKey: createdProductKey?.key
          });
          console.log('Welcome email sent to:', newUserDetails.email);
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update license with subscription details
        const license = await prisma.licenses.findFirst({
          where: { subscription_id: subscription.id }
        });

        if (license) {
          await prisma.licenses.update({
            where: { license_key: license.license_key },
            data: {
              status: subscription.status === 'active' ? 'active' : 'suspended',
              // Removed current_period_end as it doesn't exist in schema
              // Removed stripe_price_id as it doesn't exist in schema
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Suspend license
        const license = await prisma.licenses.findFirst({
          where: { subscription_id: subscription.id }
        });

        if (license) {
          await prisma.licenses.update({
            where: { license_key: license.license_key },
            data: {
              status: 'suspended'
              // Removed metadata field as it doesn't exist in schema
            }
          });

          // Deactivate all product keys
          await prisma.product_keys.updateMany({
            where: { license_key: license.license_key },
            data: { status: 'inactive' }
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Log successful payment
        console.log('Payment succeeded for invoice:', invoice.id);
        
        // Update license payment status if needed
        if (invoice.subscription) {
          const license = await prisma.licenses.findFirst({
            where: { subscription_id: invoice.subscription as string }
          });

          if (license && license.status === 'suspended') {
            // Reactivate license
            await prisma.licenses.update({
              where: { license_key: license.license_key },
              data: {
                status: 'active'
                // Removed metadata field as it doesn't exist in schema
              }
            });

            // Reactivate product keys
            await prisma.product_keys.updateMany({
              where: { license_key: license.license_key },
              data: { status: 'active' }
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Payment failed for invoice:', invoice.id);
        
        // Suspend license after payment failure
        if (invoice.subscription) {
          const license = await prisma.licenses.findFirst({
            where: { subscription_id: invoice.subscription as string }
          });

          if (license) {
            await prisma.licenses.update({
              where: { license_key: license.license_key },
              data: {
                status: 'suspended'
                // Removed metadata field as it doesn't exist in schema
              }
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}