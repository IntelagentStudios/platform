/**
 * Billing Integration
 * Connects skills system to existing Stripe billing
 */

import Stripe from 'stripe';
import { prisma } from '@intelagent/database';

export class BillingIntegration {
  private static instance: BillingIntegration;
  private stripe: Stripe;
  
  // Skill usage pricing (in cents)
  private skillPricing = new Map<string, number>([
    // Communication skills
    ['email_composer', 10], // $0.10 per email
    ['sms_sender', 15], // $0.15 per SMS
    ['slack_integration', 5], // $0.05 per message
    ['whatsapp_sender', 20], // $0.20 per message
    
    // AI-powered skills (more expensive)
    ['text_classifier', 50], // $0.50 per classification
    ['content_generator', 100], // $1.00 per generation
    ['image_analysis', 150], // $1.50 per analysis
    ['predictive_analytics', 200], // $2.00 per prediction
    
    // Data processing
    ['pdf_generator', 25], // $0.25 per PDF
    ['excel_handler', 30], // $0.30 per file
    ['data_enricher', 40], // $0.40 per enrichment
    
    // Integration skills
    ['salesforce_connector', 100], // $1.00 per sync
    ['hubspot_connector', 100], // $1.00 per sync
    ['stripe_payment', 0], // Free (they pay Stripe fees)
    
    // Default for unlisted skills
    ['default', 5] // $0.05
  ]);

  private constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });
  }

  public static getInstance(): BillingIntegration {
    if (!BillingIntegration.instance) {
      BillingIntegration.instance = new BillingIntegration();
    }
    return BillingIntegration.instance;
  }

  /**
   * Check if user can afford skill execution
   */
  public async canAffordExecution(
    licenseKey: string,
    skillId: string
  ): Promise<{ canAfford: boolean; reason?: string; cost: number }> {
    try {
      // Get license and user
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        include: {
          users: true,
          license_types: true
        }
      });

      if (!license) {
        return { canAfford: false, reason: 'Invalid license', cost: 0 };
      }

      // Check if skill is included in tier
      const tier = license.license_types?.name || 'free';
      
      // Enterprise gets unlimited
      if (tier === 'enterprise') {
        return { canAfford: true, cost: 0 };
      }

      // Professional gets discounts
      const discount = tier === 'professional' ? 0.5 : 1.0;
      
      // Calculate skill cost
      const baseCost = this.skillPricing.get(skillId) || this.skillPricing.get('default')!;
      const cost = Math.floor(baseCost * discount);

      // Check subscription credits
      const credits = await this.getAvailableCredits(license.users?.stripe_customer_id);
      
      if (credits >= cost) {
        return { canAfford: true, cost };
      }

      // Check if they have payment method
      const hasPaymentMethod = await this.hasPaymentMethod(license.users?.stripe_customer_id);
      
      if (!hasPaymentMethod) {
        return { 
          canAfford: false, 
          reason: 'No payment method on file', 
          cost 
        };
      }

      // Check spending limits
      const dailySpend = await this.getDailySpend(licenseKey);
      const dailyLimit = this.getDailyLimit(tier);
      
      if (dailySpend + cost > dailyLimit) {
        return { 
          canAfford: false, 
          reason: `Daily limit of $${dailyLimit/100} exceeded`, 
          cost 
        };
      }

      return { canAfford: true, cost };

    } catch (error: any) {
      console.error('Billing check error:', error);
      return { 
        canAfford: false, 
        reason: 'Billing system error', 
        cost: 0 
      };
    }
  }

  /**
   * Charge for skill execution
   */
  public async chargeForExecution(
    licenseKey: string,
    skillId: string,
    executionId: string
  ): Promise<{ success: boolean; chargeId?: string; error?: string }> {
    try {
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        include: { users: true, license_types: true }
      });

      if (!license || !license.users) {
        return { success: false, error: 'Invalid license' };
      }

      const tier = license.license_types?.name || 'free';
      
      // Enterprise is free
      if (tier === 'enterprise') {
        await this.recordUsage(licenseKey, skillId, 0, executionId);
        return { success: true, chargeId: 'enterprise_free' };
      }

      // Calculate cost
      const discount = tier === 'professional' ? 0.5 : 1.0;
      const baseCost = this.skillPricing.get(skillId) || this.skillPricing.get('default')!;
      const cost = Math.floor(baseCost * discount);

      // Try to use credits first
      const credits = await this.getAvailableCredits(license.users.stripe_customer_id);
      
      if (credits >= cost) {
        await this.deductCredits(license.users.stripe_customer_id!, cost);
        await this.recordUsage(licenseKey, skillId, cost, executionId);
        return { success: true, chargeId: 'credits_used' };
      }

      // Create usage record for metered billing
      if (license.users.stripe_subscription_id) {
        const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
          license.users.stripe_subscription_item_id!,
          {
            quantity: cost,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'increment'
          }
        );

        await this.recordUsage(licenseKey, skillId, cost, executionId);
        
        return { 
          success: true, 
          chargeId: usageRecord.id 
        };
      }

      // One-time charge if no subscription
      const charge = await this.stripe.charges.create({
        amount: cost,
        currency: 'usd',
        customer: license.users.stripe_customer_id!,
        description: `Skill execution: ${skillId}`,
        metadata: {
          skill_id: skillId,
          execution_id: executionId,
          license_key: licenseKey
        }
      });

      await this.recordUsage(licenseKey, skillId, cost, executionId);

      return { 
        success: true, 
        chargeId: charge.id 
      };

    } catch (error: any) {
      console.error('Billing charge error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Record skill usage in database
   */
  private async recordUsage(
    licenseKey: string,
    skillId: string,
    cost: number,
    executionId: string
  ): Promise<void> {
    await prisma.skill_usage.create({
      data: {
        license_key: licenseKey,
        skill_id: skillId,
        execution_id: executionId,
        cost,
        currency: 'usd',
        timestamp: new Date()
      }
    });
  }

  /**
   * Get available credits for customer
   */
  private async getAvailableCredits(customerId?: string | null): Promise<number> {
    if (!customerId) return 0;
    
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if ('deleted' in customer) return 0;
      
      // Check if customer has credit balance
      const balance = customer.balance || 0;
      return Math.abs(balance); // Stripe stores credit as negative
    } catch {
      return 0;
    }
  }

  /**
   * Deduct credits from customer
   */
  private async deductCredits(customerId: string, amount: number): Promise<void> {
    await this.stripe.customers.update(customerId, {
      balance: amount // Add positive amount (reduces credit)
    });
  }

  /**
   * Check if customer has payment method
   */
  private async hasPaymentMethod(customerId?: string | null): Promise<boolean> {
    if (!customerId) return false;
    
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return paymentMethods.data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get daily spending for license
   */
  private async getDailySpend(licenseKey: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usage = await prisma.skill_usage.aggregate({
      where: {
        license_key: licenseKey,
        timestamp: { gte: today }
      },
      _sum: { cost: true }
    });
    
    return usage._sum.cost || 0;
  }

  /**
   * Get daily spending limit by tier
   */
  private getDailyLimit(tier: string): number {
    const limits: Record<string, number> = {
      'free': 100, // $1.00
      'starter': 1000, // $10.00
      'professional': 5000, // $50.00
      'enterprise': 1000000 // $10,000.00 (essentially unlimited)
    };
    
    return limits[tier] || 100;
  }

  /**
   * Create invoice for skill usage
   */
  public async createMonthlyInvoice(licenseKey: string): Promise<any> {
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      include: { users: true }
    });

    if (!license || !license.users?.stripe_customer_id) {
      throw new Error('Invalid license or no Stripe customer');
    }

    // Get usage for the month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.skill_usage.findMany({
      where: {
        license_key: licenseKey,
        timestamp: { gte: startOfMonth }
      }
    });

    // Create invoice
    const invoice = await this.stripe.invoices.create({
      customer: license.users.stripe_customer_id,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: 'Skills usage for ' + startOfMonth.toLocaleDateString()
    });

    // Add line items for each skill
    const skillTotals = new Map<string, number>();
    usage.forEach(u => {
      const current = skillTotals.get(u.skill_id) || 0;
      skillTotals.set(u.skill_id, current + u.cost);
    });

    for (const [skillId, total] of skillTotals) {
      await this.stripe.invoiceItems.create({
        customer: license.users.stripe_customer_id,
        invoice: invoice.id,
        amount: total,
        currency: 'usd',
        description: `Skill usage: ${skillId}`
      });
    }

    // Finalize and pay
    const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
    await this.stripe.invoices.pay(invoice.id);

    return finalizedInvoice;
  }
}