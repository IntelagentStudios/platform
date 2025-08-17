import { prisma } from './db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
})

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  
  // Get the last invoice number for this month
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let sequence = 1
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`
}

export function calculateTax(amount: number, organization: any): number {
  // Simple tax calculation - would be more complex in production
  const taxRate = 0.1 // 10% default tax rate
  
  // Check if organization is tax exempt
  if (organization.metadata?.taxExempt) {
    return 0
  }

  return amount * taxRate
}

export async function processPayment(
  invoiceId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: true
      }
    })

    if (!invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice already paid' }
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = invoice.organization.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: invoice.organization.billingEmail || undefined,
        name: invoice.organization.name,
        metadata: {
          organizationId: invoice.organizationId
        }
      })
      
      stripeCustomerId = customer.id
      
      await prisma.organization.update({
        where: { id: invoice.organizationId },
        data: { stripeCustomerId }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(invoice.total) * 100), // Convert to cents
      currency: invoice.currency.toLowerCase(),
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      }
    })

    if (paymentIntent.status === 'succeeded') {
      // Update invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntent: paymentIntent.id
        }
      })

      // Create transaction record
      await prisma.transaction.create({
        data: {
          invoiceId,
          type: 'payment',
          amount: invoice.total,
          currency: invoice.currency,
          status: 'success',
          paymentMethod: 'card',
          referenceId: paymentIntent.id,
          processedAt: new Date()
        }
      })

      // Update organization MRR if this is a subscription payment
      if (invoice.metadata?.subscription) {
        await updateMRR(invoice.organizationId)
      }

      return { success: true }
    } else {
      return { success: false, error: 'Payment failed' }
    }
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateMRR(organizationId: string) {
  // Calculate MRR based on active subscriptions
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      licenses: {
        where: { status: 'active' }
      }
    }
  })

  if (!organization) return

  // Base MRR from subscription tier
  const tierMRR: Record<string, number> = {
    free: 0,
    basic: 49,
    pro: 199,
    enterprise: 999,
    custom: 2999
  }

  let totalMRR = tierMRR[organization.subscriptionTier] || 0

  // Add product-specific MRR
  const productMRR: Record<string, number> = {
    chatbot: 29,
    sales_agent: 99,
    setup_agent: 49,
    enrichment: 39
  }

  for (const license of organization.licenses) {
    for (const product of license.products) {
      totalMRR += productMRR[product] || 0
    }
  }

  // Update organization MRR
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      mrr: totalMRR,
      ltv: totalMRR * 24 // Assuming 24-month average lifetime
    }
  })
}

export async function createSubscription(
  organizationId: string,
  tier: string,
  paymentMethodId: string
) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Get or create Stripe customer
    let stripeCustomerId = organization.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: organization.billingEmail || undefined,
        name: organization.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })
      
      stripeCustomerId = customer.id
      
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId }
      })
    }

    // Get price ID for tier
    const priceIds: Record<string, string> = {
      basic: process.env.STRIPE_PRICE_BASIC || '',
      pro: process.env.STRIPE_PRICE_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || ''
    }

    const priceId = priceIds[tier]
    if (!priceId) {
      throw new Error('Invalid subscription tier')
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      metadata: {
        organizationId
      }
    })

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionId: subscription.id,
        subscriptionTier: tier,
        subscriptionStatus: subscription.status
      }
    })

    await updateMRR(organizationId)

    return subscription
  } catch (error) {
    console.error('Subscription creation error:', error)
    throw error
  }
}

export async function cancelSubscription(organizationId: string) {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    })

    if (!organization || !organization.subscriptionId) {
      throw new Error('No active subscription found')
    }

    // Cancel at period end
    const subscription = await stripe.subscriptions.update(
      organization.subscriptionId,
      {
        cancel_at_period_end: true
      }
    )

    // Update organization
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'canceled'
      }
    })

    return subscription
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    throw error
  }
}

export async function handleStripeWebhook(
  signature: string,
  rawBody: string
) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    )

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as any)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as any)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any)
        break
    }

    return { success: true }
  } catch (error) {
    console.error('Webhook processing error:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(stripeInvoice: any) {
  const organizationId = stripeInvoice.metadata?.organizationId
  if (!organizationId) return

  // Create or update invoice in our database
  const invoice = await prisma.invoice.upsert({
    where: {
      stripeInvoiceId: stripeInvoice.id
    },
    update: {
      status: 'paid',
      paidAt: new Date(stripeInvoice.status_transitions.paid_at * 1000)
    },
    create: {
      organizationId,
      invoiceNumber: await generateInvoiceNumber(),
      stripeInvoiceId: stripeInvoice.id,
      amount: stripeInvoice.subtotal / 100,
      tax: stripeInvoice.tax / 100,
      total: stripeInvoice.total / 100,
      currency: stripeInvoice.currency.toUpperCase(),
      status: 'paid',
      paidAt: new Date(stripeInvoice.status_transitions.paid_at * 1000),
      dueDate: new Date(stripeInvoice.due_date * 1000),
      lineItems: stripeInvoice.lines.data.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_amount / 100,
        amount: line.amount / 100
      }))
    }
  })

  await updateMRR(organizationId)
}

async function handleInvoicePaymentFailed(stripeInvoice: any) {
  const organizationId = stripeInvoice.metadata?.organizationId
  if (!organizationId) return

  // Update invoice status
  await prisma.invoice.update({
    where: {
      stripeInvoiceId: stripeInvoice.id
    },
    data: {
      status: 'overdue'
    }
  })

  // Send notification
  console.log('Payment failed for organization:', organizationId)
}

async function handleSubscriptionUpdated(subscription: any) {
  const organizationId = subscription.metadata?.organizationId
  if (!organizationId) return

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: subscription.status
    }
  })
}

async function handleSubscriptionDeleted(subscription: any) {
  const organizationId = subscription.metadata?.organizationId
  if (!organizationId) return

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionId: null
    }
  })
}