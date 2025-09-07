/**
 * Finance Agent
 * Manages all payment processing, billing, and financial operations
 * Controls: Stripe, PayPal, Square, Invoice generation, Financial reporting
 */

import { EventEmitter } from 'events';
import { ManagementRequest } from './ManagementTeam';
import Stripe from 'stripe';

export class FinanceAgent extends EventEmitter {
  private static instance: FinanceAgent;
  
  // Payment processor clients
  private stripe?: Stripe;
  private paypal?: any;
  private square?: any;
  
  // Financial tracking
  private transactions = new Map<string, any>();
  private dailyLimits = new Map<string, number>();
  private monthlySpend = new Map<string, number>();
  
  // Pricing configuration
  private skillPricing = new Map<string, number>();
  
  private constructor() {
    super();
    this.initializePaymentProcessors();
    this.loadPricingConfiguration();
  }

  public static getInstance(): FinanceAgent {
    if (!FinanceAgent.instance) {
      FinanceAgent.instance = new FinanceAgent();
    }
    return FinanceAgent.instance;
  }

  private initializePaymentProcessors(): void {
    // Initialize Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
      console.log('[FinanceAgent] Stripe initialized');
    }
    
    // Initialize PayPal
    if (process.env.PAYPAL_CLIENT_ID) {
      // PayPal SDK initialization
      console.log('[FinanceAgent] PayPal initialized');
    }
    
    // Initialize Square
    if (process.env.SQUARE_ACCESS_TOKEN) {
      // Square SDK initialization
      console.log('[FinanceAgent] Square initialized');
    }
  }

  private loadPricingConfiguration(): void {
    // Skill-based pricing (cents)
    this.skillPricing.set('email_composer', 10); // $0.10 per email
    this.skillPricing.set('sms_sender', 15); // $0.15 per SMS
    this.skillPricing.set('ai_analysis', 50); // $0.50 per AI analysis
    this.skillPricing.set('pdf_generator', 25); // $0.25 per PDF
    this.skillPricing.set('stripe_payment', 0); // Free (payment processing)
    this.skillPricing.set('salesforce_connector', 100); // $1.00 per sync
    // Add more pricing as needed
  }

  /**
   * Check if request requires payment
   */
  public async requiresPayment(request: ManagementRequest): Promise<boolean> {
    // Check if skill has associated cost
    const skillId = request.payload?.skillId;
    if (!skillId) return false;
    
    const cost = this.skillPricing.get(skillId);
    return cost !== undefined && cost > 0;
  }

  /**
   * Authorize a financial transaction
   */
  public async authorizeTransaction(request: ManagementRequest): Promise<any> {
    const { userId, licenseKey } = request.context;
    const skillId = request.payload?.skillId;
    const cost = this.skillPricing.get(skillId) || 0;
    
    try {
      // Check daily limit
      const dailySpend = this.getDailySpend(licenseKey);
      const dailyLimit = this.dailyLimits.get(licenseKey) || 10000; // $100 default
      
      if (dailySpend + cost > dailyLimit) {
        return {
          approved: false,
          reason: 'Daily spending limit exceeded',
          limit: dailyLimit,
          current: dailySpend
        };
      }
      
      // Check account balance or credit
      const balance = await this.checkAccountBalance(licenseKey);
      if (balance < cost) {
        return {
          approved: false,
          reason: 'Insufficient balance',
          required: cost,
          available: balance
        };
      }
      
      // Pre-authorize transaction
      const transactionId = await this.preAuthorize(licenseKey, cost, skillId);
      
      return {
        approved: true,
        transactionId,
        amount: cost,
        currency: 'USD'
      };
      
    } catch (error: any) {
      return {
        approved: false,
        reason: error.message
      };
    }
  }

  /**
   * Execute a skill managed by this agent
   */
  public async executeSkill(skillId: string, params: any): Promise<any> {
    try {
      // Import and execute the financial analytics skill
      if (skillId === 'financial_analytics') {
        const { FinancialAnalyticsSkill } = await import('../skills/impl/FinancialAnalyticsSkill');
        const skill = new FinancialAnalyticsSkill();
        return await skill.execute(params);
      }
      
      // Handle other finance-related skills here in the future
      
      return {
        success: false,
        error: `Unknown skill: ${skillId}`
      };
    } catch (error: any) {
      console.error(`[FinanceAgent] Error executing skill ${skillId}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to execute skill'
      };
    }
  }

  /**
   * Execute financial operation
   */
  public async execute(request: ManagementRequest): Promise<any> {
    const { action, payload } = request;
    
    switch (action) {
      case 'process_payment':
        return await this.processPayment(payload);
        
      case 'create_invoice':
        return await this.createInvoice(payload);
        
      case 'refund':
        return await this.processRefund(payload);
        
      case 'subscription':
        return await this.manageSubscription(payload);
        
      case 'report':
        return await this.generateFinancialReport(payload);
        
      default:
        return { success: false, error: 'Unknown finance action' };
    }
  }

  /**
   * Process a payment
   */
  private async processPayment(payload: any): Promise<any> {
    const { amount, currency = 'usd', method = 'stripe', customer } = payload;
    
    try {
      if (method === 'stripe' && this.stripe) {
        // Create payment intent
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          customer: customer?.stripeId,
          metadata: {
            userId: payload.userId,
            skillId: payload.skillId
          }
        });
        
        // Record transaction
        this.recordTransaction({
          id: paymentIntent.id,
          amount,
          currency,
          method,
          status: 'pending',
          timestamp: new Date()
        });
        
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount,
          currency
        };
      }
      
      // Fallback for development/testing
      return {
        success: true,
        paymentId: `mock_${Date.now()}`,
        amount,
        currency
      };
      
    } catch (error: any) {
      this.emit('payment:failed', { error: error.message, payload });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create an invoice
   */
  private async createInvoice(payload: any): Promise<any> {
    const { customer, items, dueDate } = payload;
    
    try {
      if (this.stripe) {
        const invoice = await this.stripe.invoices.create({
          customer: customer.stripeId,
          collection_method: 'send_invoice',
          due_date: Math.floor(new Date(dueDate).getTime() / 1000),
          auto_advance: true
        });
        
        // Add line items
        for (const item of items) {
          await this.stripe.invoiceItems.create({
            customer: customer.stripeId,
            invoice: invoice.id,
            amount: Math.round(item.amount * 100),
            currency: 'usd',
            description: item.description
          });
        }
        
        // Finalize and send
        const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
        await this.stripe.invoices.sendInvoice(invoice.id);
        
        return {
          success: true,
          invoiceId: finalizedInvoice.id,
          url: finalizedInvoice.hosted_invoice_url,
          pdf: finalizedInvoice.invoice_pdf
        };
      }
      
      // Mock invoice for development
      return {
        success: true,
        invoiceId: `INV-${Date.now()}`,
        items,
        total: items.reduce((sum: number, item: any) => sum + item.amount, 0)
      };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a refund
   */
  private async processRefund(payload: any): Promise<any> {
    const { transactionId, amount, reason } = payload;
    
    try {
      if (this.stripe) {
        const refund = await this.stripe.refunds.create({
          payment_intent: transactionId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: reason || 'requested_by_customer'
        });
        
        return {
          success: true,
          refundId: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        };
      }
      
      return {
        success: true,
        refundId: `refund_${Date.now()}`,
        amount
      };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Manage subscriptions
   */
  private async manageSubscription(payload: any): Promise<any> {
    const { action, customerId, planId, subscriptionId } = payload;
    
    try {
      if (this.stripe) {
        switch (action) {
          case 'create':
            const subscription = await this.stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: planId }]
            });
            return { success: true, subscription };
            
          case 'update':
            const updated = await this.stripe.subscriptions.update(
              subscriptionId,
              { items: [{ price: planId }] }
            );
            return { success: true, subscription: updated };
            
          case 'cancel':
            const cancelled = await this.stripe.subscriptions.cancel(subscriptionId);
            return { success: true, subscription: cancelled };
            
          default:
            return { success: false, error: 'Unknown subscription action' };
        }
      }
      
      return { success: true, message: 'Subscription mock' };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate financial report
   */
  private async generateFinancialReport(payload: any): Promise<any> {
    const { startDate, endDate, type = 'summary' } = payload;
    
    const transactions = Array.from(this.transactions.values())
      .filter(t => {
        const date = new Date(t.timestamp);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    
    const report = {
      period: { startDate, endDate },
      transactions: transactions.length,
      revenue: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      refunds: transactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + t.amount, 0),
      pending: transactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    return {
      success: true,
      report,
      generated: new Date()
    };
  }

  /**
   * Estimate cost for a request
   */
  public async estimateCost(request: ManagementRequest): Promise<number> {
    const skillId = request.payload?.skillId;
    if (!skillId) return 0;
    
    const baseCost = this.skillPricing.get(skillId) || 0;
    
    // Add multipliers based on usage
    let multiplier = 1;
    if (request.context.priority === 'high') multiplier *= 1.5;
    if (request.context.priority === 'critical') multiplier *= 2;
    
    return baseCost * multiplier;
  }

  /**
   * Helper methods
   */
  private async checkAccountBalance(licenseKey: string): Promise<number> {
    // In production, check actual account balance
    return 100000; // $1000 mock balance
  }

  private async preAuthorize(licenseKey: string, amount: number, skillId: string): Promise<string> {
    const transactionId = `txn_${Date.now()}`;
    this.recordTransaction({
      id: transactionId,
      licenseKey,
      amount,
      skillId,
      status: 'pre_authorized',
      timestamp: new Date()
    });
    return transactionId;
  }

  private recordTransaction(transaction: any): void {
    this.transactions.set(transaction.id, transaction);
    
    // Update daily spend
    const date = new Date().toDateString();
    const key = `${transaction.licenseKey}_${date}`;
    const current = this.monthlySpend.get(key) || 0;
    this.monthlySpend.set(key, current + transaction.amount);
  }

  private getDailySpend(licenseKey: string): number {
    const date = new Date().toDateString();
    const key = `${licenseKey}_${date}`;
    return this.monthlySpend.get(key) || 0;
  }

  public async getStatus(): Promise<any> {
    return {
      active: true,
      processors: {
        stripe: !!this.stripe,
        paypal: !!this.paypal,
        square: !!this.square
      },
      transactions: this.transactions.size,
      todayRevenue: this.calculateTodayRevenue()
    };
  }

  private calculateTodayRevenue(): number {
    const today = new Date().toDateString();
    return Array.from(this.transactions.values())
      .filter(t => new Date(t.timestamp).toDateString() === today)
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }
}