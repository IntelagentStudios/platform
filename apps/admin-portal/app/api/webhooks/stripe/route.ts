import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Update license with subscription info
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (customer.email) {
    // Debug: Log the price object to see available properties
    console.log('Price object:', subscription.items.data[0]?.price)
    
    await prisma.licenses.updateMany({
      where: { email: customer.email },
      data: {
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        next_billing_date: new Date((subscription as any).current_period_end * 1000),
        plan: (subscription.items.data[0]?.price as any)?.nickname || 
              (subscription.items.data[0]?.price as any)?.metadata?.plan || 
              'pro',
      }
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (customer.email) {
    await prisma.licenses.updateMany({
      where: { email: customer.email },
      data: {
        subscription_status: subscription.status,
        next_billing_date: (subscription as any).current_period_end 
          ? new Date((subscription as any).current_period_end * 1000)
          : null,
      }
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (customer.email) {
    await prisma.licenses.updateMany({
      where: { email: customer.email },
      data: {
        subscription_status: 'canceled',
        status: 'inactive',
      }
    })
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (customer.email) {
    await prisma.licenses.updateMany({
      where: { email: customer.email },
      data: {
        last_payment_date: new Date(),
        status: 'active',
      }
    })
    
    // Record the payment for financial tracking
    await prisma.$executeRaw`
      INSERT INTO payment_history (
        customer_email, 
        amount, 
        currency, 
        status, 
        invoice_id,
        created_at
      ) VALUES (
        ${customer.email},
        ${(invoice as any).amount_paid / 100},
        ${invoice.currency},
        'succeeded',
        ${invoice.id},
        NOW()
      ) ON CONFLICT DO NOTHING
    `
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  
  if (customer.email) {
    await prisma.licenses.updateMany({
      where: { email: customer.email },
      data: {
        status: 'payment_failed',
      }
    })
    
    // Send payment failed email
    console.log('Payment failed for:', customer.email)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}