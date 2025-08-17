import { prisma } from './db'

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

// Stripe-dependent functions are temporarily disabled
// To enable payment processing, install stripe package and uncomment the code below

export async function processPayment(
  invoiceId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  // Temporary stub - Stripe integration disabled
  return { 
    success: false, 
    error: 'Payment processing is temporarily disabled. Please contact support.' 
  }
}

export async function createSubscription(
  organizationId: string,
  tier: string,
  paymentMethodId: string
) {
  // Temporary stub - Stripe integration disabled
  throw new Error('Subscription creation is temporarily disabled. Please contact support.')
}

export async function cancelSubscription(organizationId: string) {
  // Temporary stub - Stripe integration disabled
  throw new Error('Subscription cancellation is temporarily disabled. Please contact support.')
}

export async function handleStripeWebhook(
  signature: string,
  rawBody: string
) {
  // Temporary stub - Stripe integration disabled
  return { success: false, error: 'Webhook processing is temporarily disabled' }
}