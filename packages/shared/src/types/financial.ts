// Financial Management Types

export interface Invoice {
  id: string
  organizationId: string
  invoiceNumber: string
  
  // Billing Details
  amount: number
  tax: number
  total: number
  currency: Currency
  
  // Status
  status: InvoiceStatus
  paidAt?: Date | null
  dueDate: Date
  
  // Payment
  paymentMethod?: PaymentMethod | null
  stripeInvoiceId?: string | null
  stripePaymentIntent?: string | null
  
  // Details
  description?: string | null
  lineItems: LineItem[]
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Relations
  organization?: Organization
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  invoiceId?: string | null
  
  // Transaction Details
  type: TransactionType
  amount: number
  currency: Currency
  status: TransactionStatus
  
  // Payment Details
  paymentMethod?: PaymentMethod | null
  referenceId?: string | null
  
  // Metadata
  description?: string | null
  metadata?: Record<string, any> | null
  
  // Timestamps
  processedAt?: Date | null
  createdAt: Date
  
  // Relations
  invoice?: Invoice | null
}

export interface CostTracking {
  id: string
  date: Date
  
  // Infrastructure Costs
  computeCost: number
  storageCost: number
  bandwidthCost: number
  databaseCost: number
  
  // Service Costs
  emailCost: number
  smsCost: number
  aiApiCost: number
  thirdPartyCost: number
  
  // Total
  totalCost: number
  
  // Metadata
  breakdown?: CostBreakdown | null
  notes?: string | null
  
  // Timestamps
  createdAt: Date
}

export interface LineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  tax?: number
  metadata?: Record<string, any>
}

export interface CostBreakdown {
  byService: Record<string, number>
  byProduct: Record<string, number>
  byCustomer?: Record<string, number>
  byRegion?: Record<string, number>
}

// Financial Metrics

export interface FinancialMetrics {
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  ltv: number // Lifetime Value
  cac: number // Customer Acquisition Cost
  arpu: number // Average Revenue Per User
  churnRate: number
  growthRate: number
  runway: number // in months
  burnRate: number
  grossMargin: number
}

export interface RevenueBreakdown {
  byProduct: Record<string, number>
  byTier: Record<string, number>
  byRegion: Record<string, number>
  byChannel: Record<string, number>
}

export interface CustomerMetrics {
  totalCustomers: number
  activeCustomers: number
  churnedCustomers: number
  newCustomers: number
  upgrades: number
  downgrades: number
  reactivations: number
}

export interface PaymentMetrics {
  successRate: number
  failureRate: number
  averageTransactionValue: number
  totalProcessed: number
  totalFailed: number
  pendingAmount: number
  refundedAmount: number
}

// Billing and Subscription

export interface BillingProfile {
  organizationId: string
  
  // Billing Information
  billingEmail: string
  billingName?: string
  billingAddress?: Address
  taxId?: string
  
  // Payment Methods
  defaultPaymentMethod?: PaymentMethodDetails
  paymentMethods: PaymentMethodDetails[]
  
  // Preferences
  invoicePrefix?: string
  autoCharge: boolean
  emailInvoices: boolean
  
  // Credit
  creditBalance: number
  creditLimit: number
}

export interface PaymentMethodDetails {
  id: string
  type: PaymentMethod
  isDefault: boolean
  
  // Card Details (if applicable)
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  
  // Bank Details (if applicable)
  bank?: {
    name: string
    last4: string
    accountType: string
  }
  
  // Other Details
  email?: string // for PayPal
  metadata?: Record<string, any>
  
  createdAt: Date
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface Subscription {
  id: string
  organizationId: string
  
  // Subscription Details
  tier: SubscriptionTier
  status: SubscriptionStatus
  
  // Billing
  billingCycle: BillingCycle
  currentPeriodStart: Date
  currentPeriodEnd: Date
  nextBillingDate: Date
  
  // Pricing
  basePrice: number
  addons: SubscriptionAddon[]
  discount?: SubscriptionDiscount
  totalPrice: number
  
  // Trial
  trialStart?: Date | null
  trialEnd?: Date | null
  
  // Cancellation
  cancelAt?: Date | null
  canceledAt?: Date | null
  cancellationReason?: string | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionAddon {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  total: number
}

export interface SubscriptionDiscount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  expiresAt?: Date | null
}

// Pricing Plans

export interface PricingPlan {
  id: string
  tier: SubscriptionTier
  name: string
  description: string
  
  // Pricing
  monthlyPrice: number
  annualPrice: number
  setupFee?: number
  
  // Limits
  limits: PlanLimits
  
  // Features
  features: string[]
  
  // Visibility
  isPublic: boolean
  isPopular?: boolean
  
  // Metadata
  metadata?: Record<string, any>
}

export interface PlanLimits {
  users: number
  projects: number
  storage: number // in GB
  bandwidth: number // in GB
  apiCalls: number
  emailsPerMonth: number
  customDomains: number
  supportLevel: SupportLevel
}

// Enums

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CREDIT = 'credit',
  DEBIT = 'debit',
  ADJUSTMENT = 'adjustment',
  CHARGEBACK = 'chargeback'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CRYPTO = 'crypto',
  CHECK = 'check',
  WIRE = 'wire',
  CREDIT = 'credit'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  BIENNIAL = 'biennial'
}

export enum SupportLevel {
  COMMUNITY = 'community',
  EMAIL = 'email',
  PRIORITY = 'priority',
  DEDICATED = 'dedicated',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete'
}

// Import from organization types
import type { Organization } from './organization'