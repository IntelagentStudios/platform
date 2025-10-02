import Stripe from 'stripe'

// During build time, we might not have the environment variable
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'tier_basic',
    name: 'Basic',
    price: 49,
    priceId: process.env.STRIPE_PRICE_BASIC || '',
    features: [
      'Up to 5 team members',
      '1,000 API calls/month',
      'Basic analytics',
      'Email support',
      'Standard integrations',
    ],
    limits: {
      teamMembers: 5,
      apiCalls: 1000,
      storage: 1073741824, // 1GB
      chatbotMessages: 1000,
    }
  },
  PRO: {
    id: 'tier_pro',
    name: 'Professional',
    price: 149,
    priceId: process.env.STRIPE_PRICE_PRO || '',
    features: [
      'Up to 20 team members',
      '10,000 API calls/month',
      'Advanced analytics',
      'Priority support',
      'All integrations',
      'AI insights',
      'Custom workflows',
    ],
    limits: {
      teamMembers: 20,
      apiCalls: 10000,
      storage: 10737418240, // 10GB
      chatbotMessages: 10000,
    }
  },
  ENTERPRISE: {
    id: 'tier_enterprise',
    name: 'Enterprise',
    price: 499,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    features: [
      'Unlimited team members',
      'Unlimited API calls',
      'Custom analytics',
      'Dedicated support',
      'All integrations',
      'Advanced AI features',
      'Custom workflows',
      'SLA guarantee',
      'Custom training',
    ],
    limits: {
      teamMembers: -1, // unlimited
      apiCalls: -1,
      storage: -1,
      chatbotMessages: -1,
    }
  }
}

export async function createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      platform: 'intelagent',
      ...metadata
    }
  })
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  trialDays?: number
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: trialDays,
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations',
  })
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'latest_invoice']
  })
}

export async function getCustomerPortalUrl(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
}

export async function getInvoices(customerId: string, limit = 10) {
  return await stripe.invoices.list({
    customer: customerId,
    limit,
  })
}

export async function getPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
}