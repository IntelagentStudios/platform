/**
 * Internal Payment Processing Service
 * Our own payment system without third-party payment processors
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface PaymentOptions {
  amount: number;
  currency: string;
  customerId: string;
  customerEmail?: string;
  description?: string;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, any>;
  licenseKey?: string;
  taskId?: string;
}

export interface PaymentMethod {
  type: 'card' | 'bank' | 'crypto' | 'wallet';
  details: Record<string, any>;
}

export interface PaymentResult {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  customerId: string;
  timestamp: Date;
  provider: 'internal';
  fee?: number;
  netAmount?: number;
}

export interface Subscription {
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  currentPeriodEnd: Date;
  amount: number;
  interval: 'monthly' | 'yearly' | 'weekly';
}

export class InternalPaymentService extends EventEmitter {
  private static instance: InternalPaymentService;
  private transactions: Map<string, PaymentResult> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private customers: Map<string, CustomerAccount> = new Map();
  private pendingTransactions: PaymentOptions[] = [];
  private processing: boolean = false;
  
  // Payment processor configuration
  private config = {
    merchantId: process.env.MERCHANT_ID || 'INTL_MERCHANT_001',
    processingFeePercent: 2.9,
    processingFeeFixed: 0.30,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    maxTransactionAmount: 1000000,
    encryptionKey: process.env.PAYMENT_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
  };
  
  private constructor() {
    super();
    this.initializePaymentSystem();
  }
  
  public static getInstance(): InternalPaymentService {
    if (!InternalPaymentService.instance) {
      InternalPaymentService.instance = new InternalPaymentService();
    }
    return InternalPaymentService.instance;
  }
  
  private initializePaymentSystem() {
    // Initialize payment ledger
    this.startTransactionProcessor();
    this.startFraudDetection();
    console.log('[InternalPaymentService] Payment system initialized');
  }
  
  /**
   * Process a payment
   */
  public async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    try {
      // Validate payment
      this.validatePayment(options);
      
      // Check customer account
      let customer = this.customers.get(options.customerId);
      if (!customer) {
        customer = await this.createCustomerAccount(options.customerId, options.customerEmail);
      }
      
      // Calculate fees
      const fee = this.calculateProcessingFee(options.amount);
      const netAmount = options.amount - fee;
      
      // Create transaction record
      const transaction: PaymentResult = {
        transactionId,
        amount: options.amount,
        currency: options.currency,
        status: 'processing',
        customerId: options.customerId,
        timestamp: new Date(),
        provider: 'internal',
        fee,
        netAmount
      };
      
      // Store transaction
      this.transactions.set(transactionId, transaction);
      
      // Process payment based on method
      const processed = await this.processPaymentMethod(options, transaction);
      
      if (processed) {
        // Update transaction status
        transaction.status = 'completed';
        
        // Update customer balance
        customer.balance += options.amount;
        customer.transactionCount++;
        
        // Emit success event
        this.emit('payment:completed', {
          transactionId,
          amount: options.amount,
          customerId: options.customerId,
          licenseKey: options.licenseKey,
          taskId: options.taskId
        });
        
        // Log to ledger
        await this.logToLedger(transaction, options);
        
      } else {
        transaction.status = 'failed';
        this.pendingTransactions.push(options);
      }
      
      return transaction;
      
    } catch (error: any) {
      console.error('[InternalPaymentService] Payment error:', error);
      
      // Create failed transaction record
      const failedTransaction: PaymentResult = {
        transactionId,
        amount: options.amount,
        currency: options.currency,
        status: 'failed',
        customerId: options.customerId,
        timestamp: new Date(),
        provider: 'internal'
      };
      
      this.transactions.set(transactionId, failedTransaction);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }
  
  /**
   * Process payment based on method
   */
  private async processPaymentMethod(
    options: PaymentOptions,
    transaction: PaymentResult
  ): Promise<boolean> {
    const method = options.paymentMethod || { type: 'card', details: {} };
    
    switch (method.type) {
      case 'card':
        return await this.processCardPayment(method.details, transaction);
      
      case 'bank':
        return await this.processBankTransfer(method.details, transaction);
      
      case 'crypto':
        return await this.processCryptoPayment(method.details, transaction);
      
      case 'wallet':
        return await this.processWalletPayment(method.details, transaction);
      
      default:
        // Default mock processing
        await this.delay(Math.random() * 1000 + 500);
        return Math.random() > 0.05; // 95% success rate
    }
  }
  
  /**
   * Process card payment
   */
  private async processCardPayment(details: any, transaction: PaymentResult): Promise<boolean> {
    // Simulate card processing
    await this.delay(1500);
    
    // Validate card number (Luhn algorithm)
    if (details.cardNumber) {
      const isValid = this.validateCardNumber(details.cardNumber);
      if (!isValid) {
        console.log('[InternalPaymentService] Invalid card number');
        return false;
      }
    }
    
    // Simulate authorization
    const authorized = Math.random() > 0.02; // 98% success rate
    
    if (authorized) {
      console.log(`[InternalPaymentService] Card payment authorized: ${transaction.transactionId}`);
    }
    
    return authorized;
  }
  
  /**
   * Process bank transfer
   */
  private async processBankTransfer(details: any, transaction: PaymentResult): Promise<boolean> {
    // Simulate ACH/Wire transfer
    await this.delay(2000);
    
    // Validate routing and account numbers
    if (details.routingNumber && details.accountNumber) {
      // Basic validation
      const validRouting = /^\d{9}$/.test(details.routingNumber);
      const validAccount = /^\d{8,17}$/.test(details.accountNumber);
      
      if (!validRouting || !validAccount) {
        console.log('[InternalPaymentService] Invalid bank details');
        return false;
      }
    }
    
    console.log(`[InternalPaymentService] Bank transfer initiated: ${transaction.transactionId}`);
    return true;
  }
  
  /**
   * Process crypto payment
   */
  private async processCryptoPayment(details: any, transaction: PaymentResult): Promise<boolean> {
    // Simulate blockchain transaction
    await this.delay(3000);
    
    // Generate wallet address
    const walletAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
    
    console.log(`[InternalPaymentService] Crypto payment to ${walletAddress}: ${transaction.transactionId}`);
    
    // Simulate blockchain confirmation
    return Math.random() > 0.01; // 99% success rate
  }
  
  /**
   * Process wallet payment
   */
  private async processWalletPayment(details: any, transaction: PaymentResult): Promise<boolean> {
    // Process internal wallet payment
    await this.delay(500);
    
    const customer = this.customers.get(transaction.customerId);
    if (customer && customer.walletBalance >= transaction.amount) {
      customer.walletBalance -= transaction.amount;
      console.log(`[InternalPaymentService] Wallet payment processed: ${transaction.transactionId}`);
      return true;
    }
    
    console.log('[InternalPaymentService] Insufficient wallet balance');
    return false;
  }
  
  /**
   * Create subscription
   */
  public async createSubscription(
    customerId: string,
    planId: string,
    amount: number,
    interval: 'monthly' | 'yearly' | 'weekly' = 'monthly'
  ): Promise<Subscription> {
    const subscriptionId = `sub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // Calculate next billing date
    const currentPeriodEnd = new Date();
    switch (interval) {
      case 'weekly':
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
        break;
      case 'monthly':
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        break;
      case 'yearly':
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        break;
    }
    
    const subscription: Subscription = {
      subscriptionId,
      customerId,
      planId,
      status: 'active',
      currentPeriodEnd,
      amount,
      interval
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    // Schedule recurring payment
    this.scheduleRecurringPayment(subscription);
    
    this.emit('subscription:created', subscription);
    
    return subscription;
  }
  
  /**
   * Process refund
   */
  public async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    const originalTransaction = this.transactions.get(transactionId);
    
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }
    
    if (originalTransaction.status !== 'completed') {
      throw new Error('Can only refund completed transactions');
    }
    
    const refundAmount = amount || originalTransaction.amount;
    const refundId = `ref_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // Create refund transaction
    const refundTransaction: PaymentResult = {
      transactionId: refundId,
      amount: -refundAmount,
      currency: originalTransaction.currency,
      status: 'refunded',
      customerId: originalTransaction.customerId,
      timestamp: new Date(),
      provider: 'internal'
    };
    
    this.transactions.set(refundId, refundTransaction);
    
    // Update customer balance
    const customer = this.customers.get(originalTransaction.customerId);
    if (customer) {
      customer.balance -= refundAmount;
    }
    
    this.emit('payment:refunded', {
      originalTransactionId: transactionId,
      refundId,
      amount: refundAmount,
      reason
    });
    
    return refundTransaction;
  }
  
  /**
   * Validate payment
   */
  private validatePayment(options: PaymentOptions) {
    if (!options.amount || options.amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    if (options.amount > this.config.maxTransactionAmount) {
      throw new Error('Amount exceeds maximum limit');
    }
    
    if (!this.config.supportedCurrencies.includes(options.currency)) {
      throw new Error(`Unsupported currency: ${options.currency}`);
    }
    
    if (!options.customerId) {
      throw new Error('Customer ID required');
    }
  }
  
  /**
   * Calculate processing fee
   */
  private calculateProcessingFee(amount: number): number {
    const percentFee = amount * (this.config.processingFeePercent / 100);
    const totalFee = percentFee + this.config.processingFeeFixed;
    return Math.round(totalFee * 100) / 100;
  }
  
  /**
   * Validate card number using Luhn algorithm
   */
  private validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
  
  /**
   * Create customer account
   */
  private async createCustomerAccount(customerId: string, email?: string): Promise<CustomerAccount> {
    const account: CustomerAccount = {
      customerId,
      email,
      balance: 0,
      walletBalance: 0,
      transactionCount: 0,
      createdAt: new Date(),
      riskScore: 0
    };
    
    this.customers.set(customerId, account);
    return account;
  }
  
  /**
   * Log transaction to ledger
   */
  private async logToLedger(transaction: PaymentResult, options: PaymentOptions) {
    // In production, this would write to a persistent ledger/database
    console.log('[InternalPaymentService] Ledger entry:', {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      customerId: transaction.customerId,
      licenseKey: options.licenseKey,
      taskId: options.taskId,
      timestamp: transaction.timestamp
    });
  }
  
  /**
   * Schedule recurring payment for subscription
   */
  private scheduleRecurringPayment(subscription: Subscription) {
    const timeUntilNext = subscription.currentPeriodEnd.getTime() - Date.now();
    
    setTimeout(async () => {
      if (subscription.status === 'active') {
        try {
          await this.processPayment({
            amount: subscription.amount,
            currency: 'USD',
            customerId: subscription.customerId,
            description: `Subscription payment for ${subscription.planId}`
          });
          
          // Update next billing date
          switch (subscription.interval) {
            case 'weekly':
              subscription.currentPeriodEnd.setDate(subscription.currentPeriodEnd.getDate() + 7);
              break;
            case 'monthly':
              subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 1);
              break;
            case 'yearly':
              subscription.currentPeriodEnd.setFullYear(subscription.currentPeriodEnd.getFullYear() + 1);
              break;
          }
          
          // Schedule next payment
          this.scheduleRecurringPayment(subscription);
          
        } catch (error) {
          console.error('[InternalPaymentService] Subscription payment failed:', error);
          subscription.status = 'paused';
        }
      }
    }, timeUntilNext);
  }
  
  /**
   * Start transaction processor
   */
  private startTransactionProcessor() {
    setInterval(async () => {
      if (this.processing || this.pendingTransactions.length === 0) return;
      
      this.processing = true;
      const payment = this.pendingTransactions.shift();
      
      if (payment) {
        try {
          await this.processPayment(payment);
          console.log('[InternalPaymentService] Retry successful');
        } catch (error) {
          console.error('[InternalPaymentService] Retry failed:', error);
          // Add back with exponential backoff
          setTimeout(() => this.pendingTransactions.push(payment), 60000);
        }
      }
      
      this.processing = false;
    }, 5000);
  }
  
  /**
   * Start fraud detection system
   */
  private startFraudDetection() {
    this.on('payment:completed', (data) => {
      const customer = this.customers.get(data.customerId);
      if (customer) {
        // Simple fraud scoring
        if (data.amount > 10000) customer.riskScore += 10;
        if (customer.transactionCount === 1 && data.amount > 5000) customer.riskScore += 20;
        
        if (customer.riskScore > 50) {
          console.warn('[InternalPaymentService] High risk transaction detected:', data);
        }
      }
    });
  }
  
  /**
   * Get service status
   */
  public getStatus(): {
    operational: boolean;
    transactionCount: number;
    subscriptionCount: number;
    customerCount: number;
  } {
    return {
      operational: true,
      transactionCount: this.transactions.size,
      subscriptionCount: this.subscriptions.size,
      customerCount: this.customers.size
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface CustomerAccount {
  customerId: string;
  email?: string;
  balance: number;
  walletBalance: number;
  transactionCount: number;
  createdAt: Date;
  riskScore: number;
}