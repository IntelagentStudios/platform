import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendWelcomeEmail, generatePasswordResetToken, generateTemporaryPassword } from '@/lib/email/send-welcome-email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const prisma = new PrismaClient();

// Helper to generate license key
function generateLicenseKey(prefix: string = 'LIC'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
}

// Helper to generate product keys based on tier
async function generateProductKeys(tier: string, licenseKey: string) {
  const productKeys: any[] = [];
  
  const baseProducts = {
    starter: ['chatbot'],
    professional: ['chatbot', 'chatbot', 'chatbot', 'sales-agent', 'enrichment'],
    enterprise: ['chatbot', 'sales-agent', 'enrichment', 'setup-agent']
  };

  const products = baseProducts[tier as keyof typeof baseProducts] || ['chatbot'];
  
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
      event = stripe.webhooks.constructEvent(
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
        
        // Get metadata
        const { userId, tier, billing, isGuest } = session.metadata || {};
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        console.log('Checkout completed:', { userId, tier, billing, customerEmail, isGuest });

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
              stripe_customer_id: session.customer as string,
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
              tier: tier || 'starter',
              stripe_subscription_id: session.subscription as string,
              stripe_price_id: '',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              user_id: actualUserId,
              metadata: {
                billing: billing || 'monthly',
                createdFrom: 'stripe_checkout'
              }
            }
          });

          // Generate product keys based on tier
          const productKeys = await generateProductKeys(tier || 'starter', license.license_key);
          
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
              tier: tier || license.tier,
              stripe_subscription_id: session.subscription as string,
              status: 'active',
              metadata: {
                ...(license.metadata as any || {}),
                billing: billing || 'monthly',
                updatedFrom: 'stripe_checkout'
              }
            }
          });
          console.log('Updated license:', license.license_key);
        }

        // Send welcome email if new user was created
        if (newUserCreated && newUserDetails) {
          await sendWelcomeEmail({
            ...newUserDetails,
            tier: tier || 'starter'
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
          where: { stripe_subscription_id: subscription.id }
        });

        if (license) {
          await prisma.licenses.update({
            where: { license_key: license.license_key },
            data: {
              status: subscription.status === 'active' ? 'active' : 'suspended',
              current_period_end: new Date(subscription.current_period_end * 1000),
              stripe_price_id: subscription.items.data[0]?.price.id || ''
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Suspend license
        const license = await prisma.licenses.findFirst({
          where: { stripe_subscription_id: subscription.id }
        });

        if (license) {
          await prisma.licenses.update({
            where: { license_key: license.license_key },
            data: {
              status: 'suspended',
              metadata: {
                ...(license.metadata as any || {}),
                suspendedAt: new Date().toISOString(),
                suspendReason: 'subscription_cancelled'
              }
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
            where: { stripe_subscription_id: invoice.subscription as string }
          });

          if (license && license.status === 'suspended') {
            // Reactivate license
            await prisma.licenses.update({
              where: { license_key: license.license_key },
              data: {
                status: 'active',
                metadata: {
                  ...(license.metadata as any || {}),
                  reactivatedAt: new Date().toISOString()
                }
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
            where: { stripe_subscription_id: invoice.subscription as string }
          });

          if (license) {
            await prisma.licenses.update({
              where: { license_key: license.license_key },
              data: {
                status: 'suspended',
                metadata: {
                  ...(license.metadata as any || {}),
                  paymentFailedAt: new Date().toISOString(),
                  failureReason: 'payment_failed'
                }
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