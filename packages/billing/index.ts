/**
 * Stripe Billing Integration for GBP
 * Handles subscriptions, payments, and invoicing in British Pounds
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

export interface CreateCustomerParams {
  email: string;
  name?: string;
  licenseKey: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceIds: string[];
  licenseKey: string;
  trialDays?: number;
  promoCode?: string;
}

export interface PriceConfig {
  productId: string;
  amount: number; // in pence
  interval: 'month' | 'year';
  currency: 'gbp';
}

class StripeService {
  private stripe: Stripe;
  
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Create a Stripe customer for a license
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          license_key: params.licenseKey,
          ...params.metadata
        },
        preferred_locales: ['en-GB']
      });
      
      return customer;
    } catch (error) {
      console.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create or get a product in Stripe
   */
  async ensureProduct(name: string, description?: string): Promise<string> {
    try {
      // Search for existing product
      const products = await this.stripe.products.search({
        query: `name:'${name}'`
      });
      
      if (products.data.length > 0) {
        return products.data[0].id;
      }
      
      // Create new product
      const product = await this.stripe.products.create({
        name,
        description,
        metadata: {
          platform: 'intelagent',
          currency: 'GBP'
        }
      });
      
      return product.id;
    } catch (error) {
      console.error('Failed to ensure product:', error);
      throw error;
    }
  }

  /**
   * Create a price for a product in GBP
   */
  async createPrice(config: PriceConfig): Promise<string> {
    try {
      const price = await this.stripe.prices.create({
        product: config.productId,
        unit_amount: config.amount, // Amount in pence
        currency: 'gbp',
        recurring: {
          interval: config.interval
        },
        metadata: {
          platform: 'intelagent'
        }
      });
      
      return price.id;
    } catch (error) {
      console.error('Failed to create price:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: params.priceIds.map(price => ({ price })),
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          license_key: params.licenseKey
        },
        currency: 'gbp'
      };

      // Add trial period if specified
      if (params.trialDays) {
        subscriptionData.trial_period_days = params.trialDays;
      }

      // Apply promo code if provided
      if (params.promoCode) {
        const promotionCodes = await this.stripe.promotionCodes.list({
          code: params.promoCode,
          active: true,
          limit: 1
        });

        if (promotionCodes.data.length > 0) {
          subscriptionData.promotion_code = promotionCodes.data[0].id;
        }
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      
      return subscription;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription (add/remove products)
   */
  async updateSubscription(
    subscriptionId: string, 
    priceIds: string[]
  ): Promise<Stripe.Subscription> {
    try {
      // Get current subscription
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      // Cancel all current items
      const updatePromises = subscription.items.data.map(item =>
        this.stripe.subscriptionItems.del(item.id)
      );
      await Promise.all(updatePromises);
      
      // Add new items
      const addPromises = priceIds.map(price =>
        this.stripe.subscriptionItems.create({
          subscription: subscriptionId,
          price
        })
      );
      await Promise.all(addPromises);
      
      // Retrieve updated subscription
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately = false
  ): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Retrieve a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Failed to retrieve subscription:', error);
      throw error;
    }
  }

  /**
   * Resume a cancelled subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time payment
   */
  async createPaymentIntent(
    amount: number, // in pence
    customerId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'gbp',
        customer: customerId,
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          platform: 'intelagent',
          ...metadata
        }
      });
      
      return paymentIntent;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session for new subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceIds: string[],
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: priceIds.map(price => ({
          price,
          quantity: 1
        })),
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        currency: 'gbp',
        metadata: {
          platform: 'intelagent',
          ...metadata
        },
        subscription_data: {
          metadata
        }
      });
      
      return session;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });
      
      return session;
    } catch (error) {
      console.error('Failed to create portal session:', error);
      throw error;
    }
  }

  /**
   * Get upcoming invoice for a subscription
   * Note: Method temporarily disabled due to Stripe API changes
   */
  async getUpcomingInvoice(subscriptionId: string): Promise<Stripe.Invoice | null> {
    try {
      // TODO: Update to match new Stripe API
      // The retrieveUpcoming method has been changed in newer API versions
      console.warn('getUpcomingInvoice is temporarily disabled');
      return null;
    } catch (error) {
      console.error('Failed to get upcoming invoice:', error);
      return null;
    }
  }

  /**
   * List invoices for a customer
   */
  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });
      
      return invoices.data;
    } catch (error) {
      console.error('Failed to list invoices:', error);
      return [];
    }
  }

  /**
   * Create a usage record for metered billing
   */
  async recordUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<Stripe.UsageRecord> {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000)
        }
      );
      
      return usageRecord;
    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }

  /**
   * Apply a coupon to a customer or subscription
   */
  async applyCoupon(
    customerId: string,
    couponId: string
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        coupon: couponId
      });
      
      return customer;
    } catch (error) {
      console.error('Failed to apply coupon:', error);
      throw error;
    }
  }

  /**
   * Webhook signature verification
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
}

// Singleton instance
const stripeService = new StripeService();

export default stripeService;
export { StripeService };