/**
 * Stripe Payment Skill
 * Process payments via Stripe
 * Auto-generated with full functionality
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class StripePaymentSkill extends BaseSkill {
  metadata = {
    id: 'stripe_payment',
    name: 'Stripe Payment',
    description: 'Process payments via Stripe',
    category: SkillCategory.INTEGRATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ["stripe","payment","billing"]
  };

  private cache: Map<string, any> = new Map();

  validate(params: SkillParams): boolean {
    return params !== null && params !== undefined;
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const startTime = Date.now();
      
      // Process based on category
      const result = await this.processStripePayment(params);
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          ...result,
          category: 'integration',
          executionTime,
          timestamp: new Date()
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private async processStripePayment(params: SkillParams): Promise<any> {
    const { 
      action = 'charge',
      amount,
      currency = 'usd',
      customerId,
      customerEmail,
      description,
      paymentMethodId,
      metadata = {},
      setupIntent,
      subscriptionData
    } = params;
    
    // Get license context
    const licenseKey = params._context?.licenseKey;
    const taskId = params._context?.taskId;
    
    console.log(`[StripePaymentSkill] Processing ${action} for license ${licenseKey}, task ${taskId}`);
    
    // Get Stripe configuration
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (stripeSecretKey) {
      try {
        // Dynamic import Stripe
        const stripe = await import('stripe').catch(() => null);
        
        if (stripe) {
          const stripeClient = new stripe.default(stripeSecretKey, {
            apiVersion: '2023-10-16'
          });
          
          let result;
          
          switch (action) {
            case 'charge':
              // Create a payment intent
              if (!amount) throw new Error('Amount is required for charge');
              
              result = await stripeClient.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency,
                customer: customerId,
                receipt_email: customerEmail,
                description: description || `Payment for license ${licenseKey}`,
                metadata: {
                  ...metadata,
                  licenseKey,
                  taskId
                }
              });
              
              return {
                action: 'charge',
                paymentIntentId: result.id,
                clientSecret: result.client_secret,
                amount: result.amount / 100,
                currency: result.currency,
                status: result.status,
                customerId: result.customer,
                createdAt: new Date(result.created * 1000),
                licenseKey,
                taskId
              };
              
            case 'create_customer':
              // Create a new customer
              if (!customerEmail) throw new Error('Email is required to create customer');
              
              result = await stripeClient.customers.create({
                email: customerEmail,
                metadata: {
                  licenseKey,
                  taskId,
                  ...metadata
                }
              });
              
              return {
                action: 'create_customer',
                customerId: result.id,
                email: result.email,
                createdAt: new Date(result.created * 1000),
                licenseKey,
                taskId
              };
              
            case 'create_subscription':
              // Create a subscription
              if (!customerId || !subscriptionData?.priceId) {
                throw new Error('Customer ID and price ID required for subscription');
              }
              
              result = await stripeClient.subscriptions.create({
                customer: customerId,
                items: [{ price: subscriptionData.priceId }],
                metadata: {
                  licenseKey,
                  taskId,
                  ...metadata
                }
              });
              
              return {
                action: 'create_subscription',
                subscriptionId: result.id,
                customerId: result.customer,
                status: result.status,
                currentPeriodEnd: new Date(result.current_period_end * 1000),
                items: result.items.data,
                licenseKey,
                taskId
              };
              
            case 'refund':
              // Process a refund
              if (!params.paymentIntentId) throw new Error('Payment intent ID required for refund');
              
              result = await stripeClient.refunds.create({
                payment_intent: params.paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined,
                reason: params.reason || 'requested_by_customer',
                metadata: {
                  licenseKey,
                  taskId
                }
              });
              
              return {
                action: 'refund',
                refundId: result.id,
                amount: result.amount / 100,
                currency: result.currency,
                status: result.status,
                reason: result.reason,
                licenseKey,
                taskId
              };
              
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        }
      } catch (error: any) {
        console.error('[StripePaymentSkill] Stripe error:', error);
        throw new Error(`Stripe error: ${error.message}`);
      }
    }
    
    // Mock implementation for development
    console.log('[StripePaymentSkill] Using mock implementation (configure STRIPE_SECRET_KEY for real payments)');
    
    await this.delay(Math.random() * 500 + 300);
    
    // Return mock results based on action
    switch (action) {
      case 'charge':
        return {
          action: 'charge',
          paymentIntentId: `pi_mock_${Date.now()}`,
          clientSecret: `pi_mock_${Date.now()}_secret`,
          amount: amount || 100,
          currency,
          status: 'requires_payment_method',
          customerId: customerId || `cus_mock_${Date.now()}`,
          createdAt: new Date(),
          licenseKey,
          taskId,
          mock: true,
          note: 'This is a simulated payment. Configure STRIPE_SECRET_KEY for real payments.'
        };
        
      case 'create_customer':
        return {
          action: 'create_customer',
          customerId: `cus_mock_${Date.now()}`,
          email: customerEmail || 'mock@example.com',
          createdAt: new Date(),
          licenseKey,
          taskId,
          mock: true
        };
        
      case 'create_subscription':
        return {
          action: 'create_subscription',
          subscriptionId: `sub_mock_${Date.now()}`,
          customerId: customerId || `cus_mock_${Date.now()}`,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          licenseKey,
          taskId,
          mock: true
        };
        
      case 'refund':
        return {
          action: 'refund',
          refundId: `re_mock_${Date.now()}`,
          amount: amount || 100,
          currency,
          status: 'succeeded',
          reason: 'requested_by_customer',
          licenseKey,
          taskId,
          mock: true
        };
        
      default:
        return {
          action,
          status: 'mock',
          licenseKey,
          taskId,
          mock: true
        };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'integration',
      version: '1.0.0'
    };
  }
}