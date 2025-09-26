import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripeService from '@intelagent/billing';
import { prisma } from '@intelagent/database';

// Stripe webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const db = prisma;

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        // Handle agent activation
        if (session.metadata?.agent_id) {
          const agentId = session.metadata.agent_id;
          const licenseKey = session.metadata.license_key;

          // Find agent configuration
          const agent = await db.product_configurations.findFirst({
            where: {
              product_key: licenseKey,
              customization_type: 'agent',
              custom_name: agentId
            }
          });

          if (agent) {
            // Update agent status to active
            const config = JSON.parse(agent.configuration as string || '{}');
            config.status = 'active';
            config.subscriptionId = session.subscription;
            config.customerId = session.customer;
            config.activatedAt = new Date().toISOString();

            await db.product_configurations.update({
              where: { id: agent.id },
              data: {
                configuration: JSON.stringify(config),
                updated_at: new Date()
              }
            });

            // Log activation event
            await db.skill_audit_log.create({
              data: {
                event_type: 'agent_activated',
                skill_id: 'agent_builder',
                user_id: session.metadata?.user_id || 'system',
                license_key: licenseKey,
                event_data: {
                  agent_id: agentId,
                  subscription_id: session.subscription,
                  customer_id: session.customer
                },
                created_at: new Date()
              }
            });
          }
        }

        // Update license with subscription ID (existing flow)
        if (session.subscription && session.metadata?.license_key && !session.metadata?.agent_id) {
          await db.licenses.update({
            where: { license_key: session.metadata.license_key },
            data: {
              subscription_id: session.subscription,
              status: 'active'
              // activated_at field doesn't exist in licenses table
            }
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        
        if (subscription.metadata?.license_key) {
          // Update subscription status
          const status = subscription.status === 'active' ? 'active' : 
                        subscription.status === 'past_due' ? 'suspended' : 
                        subscription.status === 'canceled' ? 'cancelled' : 'pending';
          
          await db.licenses.update({
            where: { license_key: subscription.metadata.license_key },
            data: { 
              status,
              subscription_id: subscription.id
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        // Handle agent cancellation
        if (subscription.metadata?.agent_id) {
          const agentId = subscription.metadata.agent_id;
          const licenseKey = subscription.metadata.license_key;

          // Find agent configuration
          const agent = await db.product_configurations.findFirst({
            where: {
              product_key: licenseKey,
              customization_type: 'agent',
              custom_name: agentId
            }
          });

          if (agent) {
            // Update agent status to cancelled
            const config = JSON.parse(agent.configuration as string || '{}');
            config.status = 'cancelled';
            config.cancelledAt = new Date().toISOString();

            await db.product_configurations.update({
              where: { id: agent.id },
              data: {
                configuration: JSON.stringify(config),
                updated_at: new Date()
              }
            });

            // Log cancellation event
            await db.skill_audit_log.create({
              data: {
                event_type: 'agent_cancelled',
                skill_id: 'agent_builder',
                user_id: subscription.metadata?.user_id || 'system',
                license_key: licenseKey,
                event_data: {
                  agent_id: agentId,
                  subscription_id: subscription.id
                },
                created_at: new Date()
              }
            });
          }
        }

        // Handle license cancellation (existing flow)
        if (subscription.metadata?.license_key && !subscription.metadata?.agent_id) {
          await db.licenses.update({
            where: { license_key: subscription.metadata.license_key },
            data: {
              status: 'cancelled',
              subscription_id: null
            }
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        
        // Record payment in billing history
        if (invoice.subscription && invoice.metadata?.license_key) {
          // TODO: Add billing_history table
          // await db.billing_history.create({
          //   data: {
          //     license_key: invoice.metadata.license_key,
          //     invoice_number: invoice.number || `INV-${Date.now()}`,
          //     amount_pence: invoice.amount_paid,
          //     currency: 'GBP',
          //     status: 'paid',
          //     stripe_invoice_id: invoice.id,
          //     stripe_payment_intent_id: invoice.payment_intent,
          //     billed_at: new Date(invoice.created * 1000),
          //     paid_at: new Date()
          //   }
          // });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        if (invoice.subscription && invoice.metadata?.license_key) {
          // Record failed payment
          // TODO: Add billing_history table
          // await db.billing_history.create({
          //   data: {
          //     license_key: invoice.metadata.license_key,
          //     invoice_number: invoice.number || `INV-${Date.now()}`,
          //     amount_pence: invoice.amount_due,
          //     currency: 'GBP',
          //     status: 'failed',
          //     stripe_invoice_id: invoice.id,
          //     billed_at: new Date(invoice.created * 1000)
          //   }
          // });

          // Suspend license after multiple failures
          // TODO: Implement once billing_history table is added
          // const failedCount = await db.billing_history.count({
          //   where: {
          //     license_key: invoice.metadata.license_key,
          //     status: 'failed',
          //     billed_at: {
          //       gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          //     }
          //   }
          // });

          // if (failedCount >= 3) {
          //   await db.licenses.update({
          //     where: { license_key: invoice.metadata.license_key },
          //     data: {
          //       status: 'suspended',
          //       suspended_at: new Date()
          //     }
          //   });
          // }
        }
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as any;
        
        if (customer.metadata?.license_key) {
          // Update customer email if changed
          if (customer.email) {
            await db.licenses.update({
              where: { license_key: customer.metadata.license_key },
              data: { email: customer.email }
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Route segment config for App Router
// This replaces the deprecated export const config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';