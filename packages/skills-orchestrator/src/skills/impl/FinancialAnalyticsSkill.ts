/**
 * Financial Analytics Skill
 * Comprehensive financial tracking and reporting from Stripe
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { PrismaClient } from '@intelagent/database';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export class FinancialAnalyticsSkill extends BaseSkill {
  metadata = {
    id: 'financial_analytics',
    name: 'Financial Analytics',
    description: 'Track revenue, MRR, churn, and financial metrics from Stripe',
    category: SkillCategory.FINANCE,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['finance', 'revenue', 'mrr', 'analytics', 'stripe']
  };

  private stripe: Stripe | null = null;

  constructor() {
    super();
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any
      });
    }
  }

  validate(params: SkillParams): boolean {
    return params !== null && params !== undefined;
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const startTime = Date.now();
      const { action = 'get_metrics', period = '30d' } = params;

      let result: any;

      switch (action) {
        case 'get_metrics':
          result = await this.getFinancialMetrics(period);
          break;
        case 'get_mrr':
          result = await this.calculateMRR();
          break;
        case 'get_revenue':
          result = await this.getRevenueAnalytics(period);
          break;
        case 'get_churn':
          result = await this.getChurnMetrics(period);
          break;
        case 'get_customer_ltv':
          result = await this.getCustomerLTV();
          break;
        case 'get_transactions':
          result = await this.getRecentTransactions(params);
          break;
        case 'get_forecasts':
          result = await this.getFinancialForecasts();
          break;
        default:
          result = await this.getFinancialMetrics(period);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          ...result,
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

  private async getFinancialMetrics(period: string) {
    const metrics: any = {
      revenue: {},
      subscriptions: {},
      customers: {},
      transactions: {}
    };

    // Get date range
    const { startDate, endDate } = this.getDateRange(period);

    if (this.stripe) {
      // Get revenue from Stripe
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const revenue = charges.data.reduce((sum, charge) => {
        if (charge.status === 'succeeded') {
          return sum + (charge.amount / 100);
        }
        return sum;
      }, 0);

      metrics.revenue = {
        total: revenue,
        currency: 'GBP',
        period,
        transactions: charges.data.length
      };

      // Get subscription metrics
      const subscriptions = await this.stripe.subscriptions.list({
        status: 'active',
        limit: 100
      });

      const mrr = subscriptions.data.reduce((sum, sub) => {
        const amount = sub.items.data[0]?.price.unit_amount || 0;
        const interval = sub.items.data[0]?.price.recurring?.interval;
        
        if (interval === 'month') {
          return sum + (amount / 100);
        } else if (interval === 'year') {
          return sum + (amount / 100 / 12);
        }
        return sum;
      }, 0);

      metrics.subscriptions = {
        active: subscriptions.data.length,
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100
      };

      // Get customer metrics
      const customers = await this.stripe.customers.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000)
        },
        limit: 100
      });

      metrics.customers = {
        total: customers.data.length,
        new: customers.data.filter(c => 
          c.created >= Math.floor(startDate.getTime() / 1000)
        ).length
      };
    } else {
      // Fallback to database metrics
      const licenses = await prisma.licenses.findMany({
        where: {
          status: 'active',
          created_at: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRevenue = licenses.reduce((sum, license) => {
        const total = (license.total_pence || 0) / 100;
        return sum + total;
      }, 0);

      metrics.revenue = {
        total: totalRevenue,
        currency: 'GBP',
        period,
        transactions: licenses.length
      };

      // Calculate MRR from licenses
      const activeLicenses = await prisma.licenses.findMany({
        where: { status: 'active' }
      });

      const mrr = activeLicenses.reduce((sum, license) => {
        const tier = license.tier || 'starter';
        const monthly = {
          starter: 299,
          professional: 799,
          enterprise: 2499
        };
        return sum + (monthly[tier as keyof typeof monthly] || 299);
      }, 0);

      metrics.subscriptions = {
        active: activeLicenses.length,
        mrr,
        arr: mrr * 12
      };

      metrics.customers = {
        total: await prisma.users.count(),
        new: await prisma.users.count({
          where: {
            created_at: { gte: startDate }
          }
        })
      };
    }

    // Add growth metrics
    metrics.growth = await this.calculateGrowthMetrics(startDate, endDate);

    return metrics;
  }

  private async calculateMRR() {
    const mrr: any = {
      total: 0,
      new: 0,
      expansion: 0,
      contraction: 0,
      churn: 0,
      net: 0,
      byTier: {},
      trend: []
    };

    if (this.stripe) {
      // Get all active subscriptions
      const subscriptions = await this.stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        expand: ['data.customer']
      });

      // Calculate total MRR
      subscriptions.data.forEach(sub => {
        const amount = sub.items.data[0]?.price.unit_amount || 0;
        const interval = sub.items.data[0]?.price.recurring?.interval;
        let monthlyAmount = 0;
        
        if (interval === 'month') {
          monthlyAmount = amount / 100;
        } else if (interval === 'year') {
          monthlyAmount = amount / 100 / 12;
        }
        
        mrr.total += monthlyAmount;
        
        // Track by tier (from metadata)
        const tier = (sub.metadata?.tier || 'unknown') as string;
        mrr.byTier[tier] = (mrr.byTier[tier] || 0) + monthlyAmount;
      });

      // Calculate MRR movements (last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      
      // New MRR
      const newSubs = subscriptions.data.filter(sub => 
        sub.created >= thirtyDaysAgo
      );
      mrr.new = newSubs.reduce((sum, sub) => {
        const amount = sub.items.data[0]?.price.unit_amount || 0;
        const interval = sub.items.data[0]?.price.recurring?.interval;
        if (interval === 'month') {
          return sum + (amount / 100);
        } else if (interval === 'year') {
          return sum + (amount / 100 / 12);
        }
        return sum;
      }, 0);

      // Get cancelled subscriptions for churn
      const cancelledSubs = await this.stripe.subscriptions.list({
        status: 'canceled',
        created: { gte: thirtyDaysAgo },
        limit: 100
      });

      mrr.churn = cancelledSubs.data.reduce((sum, sub) => {
        const amount = sub.items.data[0]?.price.unit_amount || 0;
        const interval = sub.items.data[0]?.price.recurring?.interval;
        if (interval === 'month') {
          return sum + (amount / 100);
        } else if (interval === 'year') {
          return sum + (amount / 100 / 12);
        }
        return sum;
      }, 0);

      mrr.net = mrr.new + mrr.expansion - mrr.contraction - mrr.churn;

      // Calculate trend (last 6 months)
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);
        const monthEnd = Math.floor(new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime() / 1000);

        const monthSubs = await this.stripe.subscriptions.list({
          status: 'active',
          created: { lte: monthEnd },
          limit: 100
        });

        const monthMrr = monthSubs.data
          .filter(sub => sub.created <= monthEnd && (!sub.canceled_at || sub.canceled_at > monthEnd))
          .reduce((sum, sub) => {
            const amount = sub.items.data[0]?.price.unit_amount || 0;
            const interval = sub.items.data[0]?.price.recurring?.interval;
            if (interval === 'month') {
              return sum + (amount / 100);
            } else if (interval === 'year') {
              return sum + (amount / 100 / 12);
            }
            return sum;
          }, 0);

        mrr.trend.push({
          month: date.toISOString().slice(0, 7),
          value: Math.round(monthMrr * 100) / 100
        });
      }
    } else {
      // Fallback to database calculation
      const activeLicenses = await prisma.licenses.findMany({
        where: { status: 'active' }
      });

      const tierPricing = {
        starter: 299,
        professional: 799,
        enterprise: 2499
      };

      activeLicenses.forEach(license => {
        const tier = license.tier || 'starter';
        const amount = tierPricing[tier as keyof typeof tierPricing] || 299;
        mrr.total += amount;
        mrr.byTier[tier] = (mrr.byTier[tier] || 0) + amount;
      });

      // Calculate new MRR (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newLicenses = await prisma.licenses.findMany({
        where: {
          status: 'active',
          created_at: { gte: thirtyDaysAgo }
        }
      });

      newLicenses.forEach(license => {
        const tier = license.tier || 'starter';
        const amount = tierPricing[tier as keyof typeof tierPricing] || 299;
        mrr.new += amount;
      });

      mrr.net = mrr.new - mrr.churn;
    }

    // Round all values
    Object.keys(mrr).forEach(key => {
      if (typeof mrr[key] === 'number') {
        mrr[key] = Math.round(mrr[key] * 100) / 100;
      }
    });

    return mrr;
  }

  private async getRevenueAnalytics(period: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const analytics: any = {
      total: 0,
      byProduct: {},
      byTier: {},
      byPeriod: [],
      topCustomers: []
    };

    if (this.stripe) {
      // Get all charges in period
      const charges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100,
        expand: ['data.customer']
      });

      // Calculate totals
      charges.data.forEach(charge => {
        if (charge.status === 'succeeded') {
          const amount = charge.amount / 100;
          analytics.total += amount;

          // Track by product (from metadata)
          const product = charge.metadata?.product || 'subscription';
          analytics.byProduct[product] = (analytics.byProduct[product] || 0) + amount;

          // Track by tier
          const tier = charge.metadata?.tier || 'unknown';
          analytics.byTier[tier] = (analytics.byTier[tier] || 0) + amount;
        }
      });

      // Get top customers by spend
      const customerSpend = new Map<string, number>();
      charges.data.forEach(charge => {
        if (charge.status === 'succeeded' && charge.customer) {
          const customerId = charge.customer as string;
          customerSpend.set(customerId, (customerSpend.get(customerId) || 0) + (charge.amount / 100));
        }
      });

      analytics.topCustomers = Array.from(customerSpend.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([customerId, spend]) => ({
          customerId,
          spend: Math.round(spend * 100) / 100
        }));

      // Calculate daily revenue for period
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayCharges = charges.data.filter(charge => {
          const chargeDate = charge.created * 1000;
          return chargeDate >= dayStart.getTime() && chargeDate < dayEnd.getTime() && charge.status === 'succeeded';
        });

        const dayRevenue = dayCharges.reduce((sum, charge) => sum + (charge.amount / 100), 0);

        analytics.byPeriod.push({
          date: dayStart.toISOString().slice(0, 10),
          revenue: Math.round(dayRevenue * 100) / 100
        });
      }
    }

    analytics.total = Math.round(analytics.total * 100) / 100;
    return analytics;
  }

  private async getChurnMetrics(period: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const churn: any = {
      rate: 0,
      count: 0,
      revenue: 0,
      reasons: {},
      byTier: {}
    };

    if (this.stripe) {
      // Get cancelled subscriptions
      const cancelledSubs = await this.stripe.subscriptions.list({
        status: 'canceled',
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      churn.count = cancelledSubs.data.length;

      // Calculate churned revenue
      cancelledSubs.data.forEach(sub => {
        const amount = sub.items.data[0]?.price.unit_amount || 0;
        const interval = sub.items.data[0]?.price.recurring?.interval;
        let monthlyAmount = 0;
        
        if (interval === 'month') {
          monthlyAmount = amount / 100;
        } else if (interval === 'year') {
          monthlyAmount = amount / 100 / 12;
        }
        
        churn.revenue += monthlyAmount;

        // Track by tier
        const tier = sub.metadata?.tier || 'unknown';
        churn.byTier[tier] = (churn.byTier[tier] || 0) + 1;

        // Track cancellation reasons (if available)
        const reason = sub.cancellation_details?.reason || 'unknown';
        churn.reasons[reason] = (churn.reasons[reason] || 0) + 1;
      });

      // Calculate churn rate
      const totalActive = await this.stripe.subscriptions.list({
        status: 'active',
        limit: 1
      });

      if (totalActive.data.length > 0) {
        churn.rate = (churn.count / totalActive.data.length) * 100;
      }
    } else {
      // Database fallback
      const cancelledLicenses = await prisma.licenses.findMany({
        where: {
          status: 'cancelled',
          cancelled_at: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      churn.count = cancelledLicenses.length;

      const tierPricing = {
        starter: 299,
        professional: 799,
        enterprise: 2499
      };

      cancelledLicenses.forEach(license => {
        const tier = license.tier || 'starter';
        const amount = tierPricing[tier as keyof typeof tierPricing] || 299;
        churn.revenue += amount;
        churn.byTier[tier] = (churn.byTier[tier] || 0) + 1;
      });

      const totalActive = await prisma.licenses.count({
        where: { status: 'active' }
      });

      if (totalActive > 0) {
        churn.rate = (churn.count / totalActive) * 100;
      }
    }

    churn.revenue = Math.round(churn.revenue * 100) / 100;
    churn.rate = Math.round(churn.rate * 100) / 100;

    return churn;
  }

  private async getCustomerLTV() {
    const ltv: any = {
      average: 0,
      byTier: {},
      distribution: []
    };

    if (this.stripe) {
      // Get all customers with their lifetime spend
      const customers = await this.stripe.customers.list({
        limit: 100,
        expand: ['data.subscriptions']
      });

      const customerValues: number[] = [];

      for (const customer of customers.data) {
        // Get all charges for this customer
        const charges = await this.stripe.charges.list({
          customer: customer.id,
          limit: 100
        });

        const totalSpend = charges.data
          .filter(charge => charge.status === 'succeeded')
          .reduce((sum, charge) => sum + (charge.amount / 100), 0);

        if (totalSpend > 0) {
          customerValues.push(totalSpend);

          // Track by tier (from current subscription)
          const sub = (customer.subscriptions as any)?.data?.[0];
          if (sub) {
            const tier = sub.metadata?.tier || 'unknown';
            if (!ltv.byTier[tier]) {
              ltv.byTier[tier] = { total: 0, count: 0, average: 0 };
            }
            ltv.byTier[tier].total += totalSpend;
            ltv.byTier[tier].count += 1;
          }
        }
      }

      // Calculate average LTV
      if (customerValues.length > 0) {
        ltv.average = customerValues.reduce((sum, val) => sum + val, 0) / customerValues.length;
      }

      // Calculate tier averages
      Object.keys(ltv.byTier).forEach(tier => {
        ltv.byTier[tier].average = ltv.byTier[tier].total / ltv.byTier[tier].count;
        ltv.byTier[tier].average = Math.round(ltv.byTier[tier].average * 100) / 100;
      });

      // Create distribution buckets
      const buckets = [0, 500, 1000, 2500, 5000, 10000, 25000];
      ltv.distribution = buckets.map((min, i) => {
        const max = buckets[i + 1] || Infinity;
        const count = customerValues.filter(val => val >= min && val < max).length;
        return {
          range: max === Infinity ? `£${min}+` : `£${min}-${max}`,
          count
        };
      });
    }

    ltv.average = Math.round(ltv.average * 100) / 100;
    return ltv;
  }

  private async getRecentTransactions(params: SkillParams) {
    const { limit = 20 } = params;
    const transactions: any[] = [];

    if (this.stripe) {
      const charges = await this.stripe.charges.list({
        limit,
        expand: ['data.customer']
      });

      charges.data.forEach(charge => {
        transactions.push({
          id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency.toUpperCase(),
          status: charge.status,
          customer: (charge.customer as any)?.email || 'Unknown',
          description: charge.description,
          created: new Date(charge.created * 1000),
          type: 'charge'
        });
      });
    }

    return { transactions };
  }

  private async getFinancialForecasts() {
    const forecasts: any = {
      nextMonth: {},
      nextQuarter: {},
      nextYear: {}
    };

    // Get current MRR
    const mrrData = await this.calculateMRR();
    const currentMrr = mrrData.total;
    const growthRate = mrrData.net / currentMrr; // Monthly growth rate

    // Simple forecasting based on current growth
    forecasts.nextMonth = {
      mrr: currentMrr * (1 + growthRate),
      revenue: currentMrr * (1 + growthRate),
      growth: growthRate * 100
    };

    forecasts.nextQuarter = {
      mrr: currentMrr * Math.pow(1 + growthRate, 3),
      revenue: currentMrr * 3 * (1 + growthRate * 1.5), // Assuming some compound growth
      growth: (Math.pow(1 + growthRate, 3) - 1) * 100
    };

    forecasts.nextYear = {
      mrr: currentMrr * Math.pow(1 + growthRate, 12),
      arr: currentMrr * 12 * Math.pow(1 + growthRate, 6), // Assuming growth slows
      growth: (Math.pow(1 + growthRate, 12) - 1) * 100
    };

    // Round all values
    Object.keys(forecasts).forEach(period => {
      Object.keys(forecasts[period]).forEach(key => {
        if (typeof forecasts[period][key] === 'number') {
          forecasts[period][key] = Math.round(forecasts[period][key] * 100) / 100;
        }
      });
    });

    return forecasts;
  }

  private async calculateGrowthMetrics(startDate: Date, endDate: Date) {
    const growth: any = {
      revenue: 0,
      customers: 0,
      mrr: 0
    };

    // Calculate period length for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(startDate.getTime());

    if (this.stripe) {
      // Current period revenue
      const currentCharges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const currentRevenue = currentCharges.data
        .filter(c => c.status === 'succeeded')
        .reduce((sum, c) => sum + (c.amount / 100), 0);

      // Previous period revenue
      const previousCharges = await this.stripe.charges.list({
        created: {
          gte: Math.floor(previousStart.getTime() / 1000),
          lte: Math.floor(previousEnd.getTime() / 1000)
        },
        limit: 100
      });

      const previousRevenue = previousCharges.data
        .filter(c => c.status === 'succeeded')
        .reduce((sum, c) => sum + (c.amount / 100), 0);

      if (previousRevenue > 0) {
        growth.revenue = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      }

      // Customer growth
      const currentCustomers = await this.stripe.customers.list({
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const previousCustomers = await this.stripe.customers.list({
        created: {
          gte: Math.floor(previousStart.getTime() / 1000),
          lte: Math.floor(previousEnd.getTime() / 1000)
        },
        limit: 100
      });

      if (previousCustomers.data.length > 0) {
        growth.customers = ((currentCustomers.data.length - previousCustomers.data.length) / previousCustomers.data.length) * 100;
      }
    }

    // Round growth percentages
    Object.keys(growth).forEach(key => {
      growth[key] = Math.round(growth[key] * 100) / 100;
    });

    return growth;
  }

  private getDateRange(period: string) {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'finance',
      version: '1.0.0',
      requiresStripe: true
    };
  }
}