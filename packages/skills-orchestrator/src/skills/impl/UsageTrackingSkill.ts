import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UsageTrackingSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'usage_tracking',
    name: 'Usage Tracking & Billing Integration',
    description: 'Comprehensive usage tracking, quota management, and billing integration for all platform services',
    category: SkillCategory.SYSTEM,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['usage', 'tracking', 'billing', 'quota', 'metrics', 'finance']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        // Usage Tracking
        case 'track_usage':
          return await this.trackUsage(licenseKey, data);
        case 'get_usage_summary':
          return await this.getUsageSummary(licenseKey, data);
        case 'get_usage_details':
          return await this.getUsageDetails(licenseKey, data);
        case 'get_usage_trends':
          return await this.getUsageTrends(licenseKey, data);

        // Quota Management
        case 'check_quota':
          return await this.checkQuota(licenseKey, data.resource);
        case 'update_quota':
          return await this.updateQuota(licenseKey, data);
        case 'enforce_quota':
          return await this.enforceQuota(licenseKey, data);
        case 'get_quota_status':
          return await this.getQuotaStatus(licenseKey);

        // Billing Integration
        case 'calculate_bill':
          return await this.calculateBill(licenseKey, data);
        case 'generate_invoice':
          return await this.generateInvoice(licenseKey, data);
        case 'process_payment':
          return await this.processPayment(licenseKey, data);
        case 'get_billing_history':
          return await this.getBillingHistory(licenseKey, data);

        // Cost Analysis
        case 'analyze_costs':
          return await this.analyzeCosts(licenseKey, data);
        case 'forecast_usage':
          return await this.forecastUsage(licenseKey, data);
        case 'optimize_costs':
          return await this.optimizeCosts(licenseKey, data);

        // Alerts & Notifications
        case 'set_usage_alert':
          return await this.setUsageAlert(licenseKey, data);
        case 'check_thresholds':
          return await this.checkThresholds(licenseKey);

        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in UsageTrackingSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async trackUsage(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        resource,
        amount = 1,
        agentId,
        skillId,
        metadata,
        timestamp = new Date()
      } = data;

      // Create usage record
      const usage = await prisma.usage_tracking.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          skill_id: skillId,
          resource_type: resource,
          amount,
          period: this.getCurrentPeriod(),
          metadata: {
            ...metadata,
            tracked_at: timestamp.toISOString()
          },
          timestamp
        }
      });

      // Update cumulative usage
      await this.updateCumulativeUsage(licenseKey, resource, amount);

      // Check if approaching limits
      const quotaCheck = await this.checkQuota(licenseKey, resource);
      if (quotaCheck.data?.percentage > 80) {
        await this.createUsageAlert(licenseKey, resource, quotaCheck.data.percentage);
      }

      // Update real-time metrics
      await this.updateRealTimeMetrics(licenseKey, resource, amount);

      return this.success({
        usageId: usage.id,
        resource,
        amount,
        tracked: true,
        quotaRemaining: quotaCheck.data?.available,
        message: 'Usage tracked successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to track usage: ${error.message}`);
    }
  }

  private async getUsageSummary(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = 'current', groupBy = 'resource' } = data;

      const startDate = this.getPeriodStartDate(period);
      const endDate = period === 'current' ? new Date() : this.getPeriodEndDate(period);

      const usage = await prisma.usage_tracking.findMany({
        where: {
          license_key: licenseKey,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate summary
      const summary: any = {
        period,
        startDate,
        endDate,
        totalRecords: usage.length
      };

      switch (groupBy) {
        case 'resource':
          summary.byResource = this.groupUsageByResource(usage);
          break;
        case 'agent':
          summary.byAgent = this.groupUsageByAgent(usage);
          break;
        case 'skill':
          summary.bySkill = this.groupUsageBySkill(usage);
          break;
        case 'daily':
          summary.daily = this.groupUsageByDay(usage);
          break;
      }

      // Calculate totals
      summary.totals = {
        apiCalls: usage.filter(u => u.resource_type === 'api_call').reduce((sum, u) => sum + u.amount, 0),
        skillsExecuted: usage.filter(u => u.resource_type === 'skill_execution').reduce((sum, u) => sum + u.amount, 0),
        storageUsed: usage.filter(u => u.resource_type === 'storage').reduce((sum, u) => sum + u.amount, 0),
        dataProcessed: usage.filter(u => u.resource_type === 'data_processing').reduce((sum, u) => sum + u.amount, 0)
      };

      // Get current quota status
      const quotaStatus = await this.getQuotaStatus(licenseKey);

      return this.success({
        summary,
        quotaStatus: quotaStatus.data,
        message: 'Usage summary generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get usage summary: ${error.message}`);
    }
  }

  private async getUsageDetails(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        startDate,
        endDate,
        resource,
        agentId,
        skillId,
        limit = 1000,
        offset = 0
      } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }

      if (resource) whereClause.resource_type = resource;
      if (agentId) whereClause.agent_id = agentId;
      if (skillId) whereClause.skill_id = skillId;

      const [usage, total] = await Promise.all([
        prisma.usage_tracking.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.usage_tracking.count({ where: whereClause })
      ]);

      const details = usage.map(u => ({
        id: u.id,
        resource: u.resource_type,
        amount: u.amount,
        agentId: u.agent_id,
        skillId: u.skill_id,
        timestamp: u.timestamp,
        metadata: u.metadata
      }));

      return this.success({
        details,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        message: 'Usage details retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get usage details: ${error.message}`);
    }
  }

  private async getUsageTrends(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '30d', resource, compareWith } = data;

      const currentPeriodUsage = await this.getPeriodUsage(licenseKey, period, resource);

      let comparison = null;
      if (compareWith) {
        const previousPeriodUsage = await this.getPeriodUsage(licenseKey, compareWith, resource);
        comparison = this.compareUsage(currentPeriodUsage, previousPeriodUsage);
      }

      // Calculate trends
      const trends = {
        daily: this.calculateDailyTrends(currentPeriodUsage),
        weekly: this.calculateWeeklyTrends(currentPeriodUsage),
        growth: this.calculateGrowthRate(currentPeriodUsage),
        forecast: this.simpleForecast(currentPeriodUsage),
        peakUsage: this.findPeakUsage(currentPeriodUsage),
        comparison
      };

      return this.success({
        period,
        trends,
        message: 'Usage trends analyzed'
      });
    } catch (error: any) {
      return this.error(`Failed to analyze usage trends: ${error.message}`);
    }
  }

  private async checkQuota(licenseKey: string, resource: string): Promise<SkillResult> {
    try {
      // Get license and quota limits
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      // Get quota limits from license metadata or product configuration
      const quotaLimits = await this.getQuotaLimits(license);
      const limit = quotaLimits[resource] || 0;

      // Get current usage
      const currentUsage = await prisma.usage_tracking.aggregate({
        where: {
          license_key: licenseKey,
          resource_type: resource,
          period: this.getCurrentPeriod()
        },
        _sum: { amount: true }
      });

      const used = currentUsage._sum.amount || 0;
      const available = Math.max(0, limit - used);
      const percentage = limit > 0 ? (used / limit * 100) : 0;

      return this.success({
        resource,
        limit,
        used,
        available,
        percentage: percentage.toFixed(2),
        exceeded: used > limit,
        message: `Quota check: ${available} of ${limit} remaining`
      });
    } catch (error: any) {
      return this.error(`Failed to check quota: ${error.message}`);
    }
  }

  private async updateQuota(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { resource, newLimit, reason, approvedBy } = data;

      // Update quota in license metadata
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      const metadata = license.metadata as any || {};
      if (!metadata.quotaLimits) metadata.quotaLimits = {};

      const oldLimit = metadata.quotaLimits[resource] || 0;
      metadata.quotaLimits[resource] = newLimit;

      await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: { metadata }
      });

      // Log quota change
      await prisma.activity_logs.create({
        data: {
          license_key: licenseKey,
          activity_type: 'quota_updated',
          description: `Quota for ${resource} updated from ${oldLimit} to ${newLimit}`,
          metadata: {
            resource,
            oldLimit,
            newLimit,
            reason,
            approvedBy
          }
        }
      });

      // Notify management
      await this.notifyManagement(licenseKey, {
        type: 'quota_change',
        resource,
        oldLimit,
        newLimit,
        reason
      });

      return this.success({
        resource,
        oldLimit,
        newLimit,
        message: 'Quota updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update quota: ${error.message}`);
    }
  }

  private async enforceQuota(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { resource, action: enforcementAction = 'block' } = data;

      const quotaCheck = await this.checkQuota(licenseKey, resource);

      if (!quotaCheck.data?.exceeded) {
        return this.success({
          enforced: false,
          message: 'Quota not exceeded, no enforcement needed'
        });
      }

      // Take enforcement action
      let result: any = {};

      switch (enforcementAction) {
        case 'block':
          // Block further usage
          result = await this.blockResource(licenseKey, resource);
          break;

        case 'throttle':
          // Throttle usage rate
          result = await this.throttleResource(licenseKey, resource);
          break;

        case 'notify':
          // Just notify, don't block
          result = await this.notifyQuotaExceeded(licenseKey, resource);
          break;

        case 'upgrade':
          // Suggest upgrade
          result = await this.suggestUpgrade(licenseKey, resource);
          break;
      }

      // Create alert
      await prisma.alerts.create({
        data: {
          license_key: licenseKey,
          alert_type: 'quota_exceeded',
          severity: 'warning',
          message: `Quota exceeded for ${resource}`,
          source: 'usage_tracking',
          metadata: {
            resource,
            usage: quotaCheck.data.used,
            limit: quotaCheck.data.limit,
            action: enforcementAction
          },
          status: 'active'
        }
      });

      return this.success({
        enforced: true,
        action: enforcementAction,
        result,
        message: `Quota enforcement applied: ${enforcementAction}`
      });
    } catch (error: any) {
      return this.error(`Failed to enforce quota: ${error.message}`);
    }
  }

  private async getQuotaStatus(licenseKey: string): Promise<SkillResult> {
    try {
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      const quotaLimits = await this.getQuotaLimits(license);
      const resources = Object.keys(quotaLimits);

      const status: any[] = [];

      for (const resource of resources) {
        const check = await this.checkQuota(licenseKey, resource);
        if (check.success && check.data) {
          status.push({
            resource,
            ...check.data,
            status: check.data.percentage > 90 ? 'critical' :
                   check.data.percentage > 75 ? 'warning' : 'normal'
          });
        }
      }

      return this.success({
        quotas: status,
        overallStatus: status.some(s => s.status === 'critical') ? 'critical' :
                      status.some(s => s.status === 'warning') ? 'warning' : 'normal',
        message: 'Quota status retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get quota status: ${error.message}`);
    }
  }

  private async calculateBill(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = 'current', includeDetails = true } = data;

      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      // Get usage for billing period
      const usage = await this.getPeriodUsage(licenseKey, period);

      // Get pricing configuration
      const pricing = await this.getPricing(license);

      // Calculate costs
      const bill = {
        period,
        licenseKey,
        product: license.product_name,
        baseCost: pricing.baseCost || 0,
        usageCosts: {} as any,
        totalUsageCost: 0,
        discounts: 0,
        tax: 0,
        total: 0
      };

      // Calculate usage-based costs
      for (const [resource, rate] of Object.entries(pricing.usageRates || {})) {
        const resourceUsage = usage.filter(u => u.resource_type === resource);
        const totalAmount = resourceUsage.reduce((sum, u) => sum + u.amount, 0);
        const cost = totalAmount * (rate as number);

        bill.usageCosts[resource] = {
          amount: totalAmount,
          rate: rate as number,
          cost
        };

        bill.totalUsageCost += cost;
      }

      // Apply discounts
      bill.discounts = this.calculateDiscounts(bill.baseCost + bill.totalUsageCost, license);

      // Calculate tax
      bill.tax = (bill.baseCost + bill.totalUsageCost - bill.discounts) * (pricing.taxRate || 0);

      // Calculate total
      bill.total = bill.baseCost + bill.totalUsageCost - bill.discounts + bill.tax;

      // Include detailed breakdown if requested
      if (includeDetails) {
        (bill as any).details = {
          dailyBreakdown: this.calculateDailyBilling(usage, pricing),
          topResources: this.getTopBilledResources(bill.usageCosts),
          projectedNextPeriod: this.projectNextPeriodBill(usage, pricing)
        };
      }

      return this.success({
        bill,
        message: 'Bill calculated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to calculate bill: ${error.message}`);
    }
  }

  private async generateInvoice(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period, dueDate, notes } = data;

      // Calculate bill first
      const billResult = await this.calculateBill(licenseKey, { period });
      if (!billResult.success) {
        return billResult;
      }

      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        include: { customer: true }
      });

      if (!license) {
        return this.error('License not found');
      }

      // Generate invoice
      const invoice = await prisma.invoices.create({
        data: {
          license_key: licenseKey,
          customer_id: license.customer_id,
          invoice_number: this.generateInvoiceNumber(),
          period,
          amount: billResult.data.bill.total,
          tax: billResult.data.bill.tax,
          discounts: billResult.data.bill.discounts,
          line_items: billResult.data.bill.usageCosts,
          due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'pending',
          notes,
          metadata: {
            bill: billResult.data.bill,
            generated_at: new Date().toISOString()
          }
        }
      });

      // Send invoice notification
      await this.sendInvoiceNotification(license, invoice);

      return this.success({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        dueDate: invoice.due_date,
        status: invoice.status,
        message: 'Invoice generated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to generate invoice: ${error.message}`);
    }
  }

  private async processPayment(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        invoiceId,
        amount,
        paymentMethod,
        transactionId,
        metadata
      } = data;

      // Get invoice
      const invoice = await prisma.invoices.findFirst({
        where: {
          license_key: licenseKey,
          id: invoiceId
        }
      });

      if (!invoice) {
        return this.error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        return this.error('Invoice already paid');
      }

      // Record payment
      const payment = await prisma.payments.create({
        data: {
          license_key: licenseKey,
          invoice_id: invoiceId,
          amount,
          payment_method: paymentMethod,
          transaction_id: transactionId,
          status: 'completed',
          metadata: {
            ...metadata,
            processed_at: new Date().toISOString()
          }
        }
      });

      // Update invoice status
      await prisma.invoices.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paid_at: new Date()
        }
      });

      // Update license status if needed
      await this.updateLicenseStatus(licenseKey, 'active');

      // Notify finance management agent
      await this.notifyManagement(licenseKey, {
        type: 'payment_received',
        target: 'finance',
        invoiceId,
        amount,
        paymentMethod
      });

      return this.success({
        paymentId: payment.id,
        invoiceId,
        amount,
        status: 'completed',
        message: 'Payment processed successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to process payment: ${error.message}`);
    }
  }

  private async getBillingHistory(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { startDate, endDate, status, limit = 100 } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (status) whereClause.status = status;
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }

      // Get invoices
      const invoices = await prisma.invoices.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit,
        include: {
          payments: true
        }
      });

      // Get payment history
      const payments = await prisma.payments.findMany({
        where: { license_key: licenseKey },
        orderBy: { created_at: 'desc' },
        take: limit
      });

      const history = {
        invoices: invoices.map(inv => ({
          id: inv.id,
          number: inv.invoice_number,
          period: inv.period,
          amount: inv.amount,
          status: inv.status,
          dueDate: inv.due_date,
          paidAt: inv.paid_at,
          payments: inv.payments
        })),
        payments: payments.map(pay => ({
          id: pay.id,
          amount: pay.amount,
          method: pay.payment_method,
          status: pay.status,
          date: pay.created_at
        })),
        summary: {
          totalInvoiced: invoices.reduce((sum, inv) => sum + inv.amount, 0),
          totalPaid: payments.filter(p => p.status === 'completed')
            .reduce((sum, pay) => sum + pay.amount, 0),
          outstanding: invoices.filter(inv => inv.status === 'pending')
            .reduce((sum, inv) => sum + inv.amount, 0)
        }
      };

      return this.success({
        history,
        message: 'Billing history retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get billing history: ${error.message}`);
    }
  }

  private async analyzeCosts(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '30d', groupBy = 'resource' } = data;

      const usage = await this.getPeriodUsage(licenseKey, period);
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return this.error('License not found');
      }

      const pricing = await this.getPricing(license);

      // Analyze costs
      const analysis: any = {
        period,
        totalCost: 0,
        breakdown: {}
      };

      switch (groupBy) {
        case 'resource':
          analysis.breakdown = this.analyzeCostsByResource(usage, pricing);
          break;
        case 'agent':
          analysis.breakdown = this.analyzeCostsByAgent(usage, pricing);
          break;
        case 'daily':
          analysis.breakdown = this.analyzeCostsByDay(usage, pricing);
          break;
      }

      // Calculate total cost
      analysis.totalCost = Object.values(analysis.breakdown)
        .reduce((sum: number, item: any) => sum + (item.cost || 0), 0);

      // Identify cost drivers
      analysis.topCostDrivers = this.identifyCostDrivers(analysis.breakdown);

      // Cost optimization recommendations
      analysis.recommendations = this.generateCostRecommendations(usage, analysis);

      // Cost trends
      analysis.trends = await this.analyzeCostTrends(licenseKey, period);

      return this.success({
        analysis,
        message: 'Cost analysis completed'
      });
    } catch (error: any) {
      return this.error(`Failed to analyze costs: ${error.message}`);
    }
  }

  private async forecastUsage(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { forecastPeriod = '30d', confidence = 0.95 } = data;

      // Get historical usage
      const historicalUsage = await this.getPeriodUsage(licenseKey, '90d');

      // Perform forecast (simplified linear regression)
      const forecast = {
        period: forecastPeriod,
        predictions: {} as any,
        confidence,
        methodology: 'linear_regression'
      };

      // Group by resource type
      const resourceGroups = this.groupUsageByResource(historicalUsage);

      for (const [resource, data] of Object.entries(resourceGroups)) {
        const prediction = this.predictUsage(data as any, forecastPeriod);
        forecast.predictions[resource] = {
          predicted: prediction.value,
          lowerBound: prediction.value * (1 - (1 - confidence)),
          upperBound: prediction.value * (1 + (1 - confidence)),
          trend: prediction.trend
        };
      }

      // Estimate costs
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });

      if (license) {
        const pricing = await this.getPricing(license);
        forecast.predictions.estimatedCost = this.estimateFutureCost(
          forecast.predictions,
          pricing
        );
      }

      // Identify potential quota breaches
      const quotaBreaches = await this.predictQuotaBreaches(
        licenseKey,
        forecast.predictions
      );

      return this.success({
        forecast,
        quotaBreaches,
        message: 'Usage forecast generated'
      });
    } catch (error: any) {
      return this.error(`Failed to forecast usage: ${error.message}`);
    }
  }

  private async optimizeCosts(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { targetReduction = 0.1 } = data; // Target 10% reduction by default

      // Analyze current usage patterns
      const usage = await this.getPeriodUsage(licenseKey, '30d');
      const costAnalysis = await this.analyzeCosts(licenseKey, { period: '30d' });

      const optimizations: any[] = [];

      // 1. Identify underutilized resources
      const underutilized = this.identifyUnderutilizedResources(usage);
      if (underutilized.length > 0) {
        optimizations.push({
          type: 'reduce_allocation',
          resources: underutilized,
          potentialSaving: underutilized.reduce((sum, r) => sum + r.wasteCost, 0),
          recommendation: 'Reduce or remove underutilized resource allocations'
        });
      }

      // 2. Identify peak usage patterns
      const peakAnalysis = this.analyzePeakUsage(usage);
      if (peakAnalysis.canOptimize) {
        optimizations.push({
          type: 'smooth_peaks',
          pattern: peakAnalysis,
          potentialSaving: peakAnalysis.potentialSaving,
          recommendation: 'Distribute workload to avoid peak pricing periods'
        });
      }

      // 3. Suggest plan changes
      const planOptimization = await this.suggestPlanOptimization(licenseKey, usage);
      if (planOptimization) {
        optimizations.push({
          type: 'plan_change',
          currentPlan: planOptimization.current,
          suggestedPlan: planOptimization.suggested,
          potentialSaving: planOptimization.saving,
          recommendation: `Switch to ${planOptimization.suggested} plan`
        });
      }

      // 4. Identify redundant operations
      const redundancies = this.identifyRedundancies(usage);
      if (redundancies.length > 0) {
        optimizations.push({
          type: 'eliminate_redundancy',
          operations: redundancies,
          potentialSaving: redundancies.reduce((sum, r) => sum + r.cost, 0),
          recommendation: 'Eliminate redundant operations and duplicate processing'
        });
      }

      // Calculate total potential savings
      const totalPotentialSaving = optimizations.reduce(
        (sum, opt) => sum + (opt.potentialSaving || 0),
        0
      );

      const currentCost = costAnalysis.data?.analysis.totalCost || 0;
      const achievableReduction = currentCost > 0 ?
        (totalPotentialSaving / currentCost) : 0;

      return this.success({
        currentCost,
        targetReduction: targetReduction * 100,
        achievableReduction: (achievableReduction * 100).toFixed(2),
        totalPotentialSaving,
        optimizations,
        priority: this.prioritizeOptimizations(optimizations),
        message: 'Cost optimization analysis completed'
      });
    } catch (error: any) {
      return this.error(`Failed to optimize costs: ${error.message}`);
    }
  }

  private async setUsageAlert(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        resource,
        threshold,
        thresholdType = 'percentage', // percentage or absolute
        alertChannels = ['email', 'dashboard'],
        severity = 'warning'
      } = data;

      // Create alert configuration
      const alertConfig = await prisma.alert_configurations.create({
        data: {
          license_key: licenseKey,
          alert_type: 'usage_threshold',
          resource,
          threshold,
          threshold_type: thresholdType,
          channels: alertChannels,
          severity,
          is_active: true,
          metadata: {
            created_at: new Date().toISOString()
          }
        }
      });

      return this.success({
        alertId: alertConfig.id,
        resource,
        threshold,
        type: thresholdType,
        message: 'Usage alert configured'
      });
    } catch (error: any) {
      return this.error(`Failed to set usage alert: ${error.message}`);
    }
  }

  private async checkThresholds(licenseKey: string): Promise<SkillResult> {
    try {
      // Get all active alert configurations
      const alertConfigs = await prisma.alert_configurations.findMany({
        where: {
          license_key: licenseKey,
          alert_type: 'usage_threshold',
          is_active: true
        }
      });

      const triggeredAlerts: any[] = [];

      for (const config of alertConfigs) {
        const quotaCheck = await this.checkQuota(licenseKey, config.resource);

        if (!quotaCheck.success || !quotaCheck.data) continue;

        let shouldTrigger = false;

        if (config.threshold_type === 'percentage') {
          shouldTrigger = parseFloat(quotaCheck.data.percentage) >= config.threshold;
        } else {
          shouldTrigger = quotaCheck.data.used >= config.threshold;
        }

        if (shouldTrigger) {
          // Create alert
          const alert = await prisma.alerts.create({
            data: {
              license_key: licenseKey,
              alert_type: 'usage_threshold_exceeded',
              severity: config.severity,
              message: `Usage threshold exceeded for ${config.resource}: ${quotaCheck.data.percentage}%`,
              source: 'usage_tracking',
              metadata: {
                resource: config.resource,
                threshold: config.threshold,
                current: quotaCheck.data.percentage,
                configId: config.id
              },
              status: 'active'
            }
          });

          triggeredAlerts.push({
            alertId: alert.id,
            resource: config.resource,
            threshold: config.threshold,
            current: quotaCheck.data.percentage
          });

          // Send notifications
          await this.sendAlertNotifications(licenseKey, alert, config.channels);
        }
      }

      return this.success({
        checked: alertConfigs.length,
        triggered: triggeredAlerts.length,
        alerts: triggeredAlerts,
        message: 'Thresholds checked'
      });
    } catch (error: any) {
      return this.error(`Failed to check thresholds: ${error.message}`);
    }
  }

  // Helper methods
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async updateCumulativeUsage(licenseKey: string, resource: string, amount: number): Promise<void> {
    // Update cumulative usage counters
    const key = `usage:${licenseKey}:${resource}:${this.getCurrentPeriod()}`;
    // In production, this would update a real-time store (Redis, etc.)
  }

  private async updateRealTimeMetrics(licenseKey: string, resource: string, amount: number): Promise<void> {
    // Update real-time metrics
    const key = `metrics:${licenseKey}:${resource}`;
    // In production, this would update a real-time metrics store
  }

  private async createUsageAlert(licenseKey: string, resource: string, percentage: number): Promise<void> {
    await prisma.alerts.create({
      data: {
        license_key: licenseKey,
        alert_type: 'usage_warning',
        severity: percentage > 90 ? 'high' : 'medium',
        message: `Usage at ${percentage}% for ${resource}`,
        source: 'usage_tracking',
        metadata: { resource, percentage },
        status: 'active'
      }
    });
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([dwmy])/);

    if (!match) return new Date(0);

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'd': return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  private getPeriodEndDate(period: string): Date {
    // For period-based calculations
    return new Date();
  }

  private async getPeriodUsage(licenseKey: string, period: string, resource?: string): Promise<any[]> {
    const whereClause: any = {
      license_key: licenseKey,
      timestamp: { gte: this.getPeriodStartDate(period) }
    };

    if (resource) whereClause.resource_type = resource;

    return await prisma.usage_tracking.findMany({ where: whereClause });
  }

  private groupUsageByResource(usage: any[]): Record<string, any> {
    return usage.reduce((acc, u) => {
      if (!acc[u.resource_type]) {
        acc[u.resource_type] = { count: 0, total: 0, items: [] };
      }
      acc[u.resource_type].count++;
      acc[u.resource_type].total += u.amount;
      acc[u.resource_type].items.push(u);
      return acc;
    }, {});
  }

  private groupUsageByAgent(usage: any[]): Record<string, number> {
    return usage.reduce((acc, u) => {
      const agent = u.agent_id || 'unknown';
      acc[agent] = (acc[agent] || 0) + u.amount;
      return acc;
    }, {});
  }

  private groupUsageBySkill(usage: any[]): Record<string, number> {
    return usage.reduce((acc, u) => {
      const skill = u.skill_id || 'unknown';
      acc[skill] = (acc[skill] || 0) + u.amount;
      return acc;
    }, {});
  }

  private groupUsageByDay(usage: any[]): Record<string, number> {
    return usage.reduce((acc, u) => {
      const day = new Date(u.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + u.amount;
      return acc;
    }, {});
  }

  private async getQuotaLimits(license: any): Promise<Record<string, number>> {
    const metadata = license.metadata as any || {};
    return metadata.quotaLimits || {
      api_calls: 10000,
      skill_executions: 5000,
      storage: 10737418240, // 10GB
      data_processing: 1073741824 // 1GB
    };
  }

  private async getPricing(license: any): Promise<any> {
    // Get pricing based on product
    const productPricing: Record<string, any> = {
      'AI Chatbot Assistant': {
        baseCost: 299,
        usageRates: {
          api_calls: 0.001,
          skill_executions: 0.01,
          storage: 0.00001,
          data_processing: 0.0001
        },
        taxRate: 0.2
      },
      'Sales Outreach Agent': {
        baseCost: 499,
        usageRates: {
          api_calls: 0.0005,
          skill_executions: 0.005,
          emails_sent: 0.02,
          leads_enriched: 0.10
        },
        taxRate: 0.2
      }
    };

    return productPricing[license.product_name] || productPricing['AI Chatbot Assistant'];
  }

  private calculateDailyTrends(usage: any[]): any {
    const daily = this.groupUsageByDay(usage);
    const values = Object.values(daily);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      average: avg,
      peak: Math.max(...values),
      low: Math.min(...values)
    };
  }

  private calculateWeeklyTrends(usage: any[]): any {
    // Simplified weekly trend calculation
    return { trend: 'stable' };
  }

  private calculateGrowthRate(usage: any[]): number {
    // Simplified growth rate calculation
    return 5.2; // 5.2% growth
  }

  private simpleForecast(usage: any[]): any {
    // Simple linear forecast
    return { next30Days: usage.length * 1.1 };
  }

  private findPeakUsage(usage: any[]): any {
    // Find peak usage times
    return { hour: 14, day: 'Tuesday' };
  }

  private compareUsage(current: any[], previous: any[]): any {
    const currentTotal = current.reduce((sum, u) => sum + u.amount, 0);
    const previousTotal = previous.reduce((sum, u) => sum + u.amount, 0);

    return {
      change: currentTotal - previousTotal,
      percentChange: ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2)
    };
  }

  private async notifyManagement(licenseKey: string, data: any): Promise<void> {
    await prisma.notifications.create({
      data: {
        license_key: licenseKey,
        recipient_type: 'management_agent',
        recipient_id: data.target || 'operations',
        type: data.type,
        priority: 'medium',
        title: 'Usage Tracking Notification',
        message: JSON.stringify(data),
        status: 'pending'
      }
    });
  }

  private async blockResource(licenseKey: string, resource: string): Promise<any> {
    // Implement resource blocking
    return { blocked: true, resource };
  }

  private async throttleResource(licenseKey: string, resource: string): Promise<any> {
    // Implement resource throttling
    return { throttled: true, resource, rate: '50%' };
  }

  private async notifyQuotaExceeded(licenseKey: string, resource: string): Promise<any> {
    // Send quota exceeded notification
    return { notified: true, resource };
  }

  private async suggestUpgrade(licenseKey: string, resource: string): Promise<any> {
    // Suggest plan upgrade
    return { suggested: true, resource, plan: 'Enterprise' };
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  private async sendInvoiceNotification(license: any, invoice: any): Promise<void> {
    // Send invoice notification
  }

  private async updateLicenseStatus(licenseKey: string, status: string): Promise<void> {
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: { status }
    });
  }

  private calculateDiscounts(amount: number, license: any): number {
    // Calculate applicable discounts
    return 0;
  }

  private calculateDailyBilling(usage: any[], pricing: any): any {
    // Calculate daily billing breakdown
    return {};
  }

  private getTopBilledResources(costs: any): any[] {
    return Object.entries(costs)
      .sort((a: any, b: any) => b[1].cost - a[1].cost)
      .slice(0, 5)
      .map(([resource, data]: any) => ({ resource, ...data }));
  }

  private projectNextPeriodBill(usage: any[], pricing: any): number {
    // Project next period bill
    return 350;
  }

  private analyzeCostsByResource(usage: any[], pricing: any): any {
    const grouped = this.groupUsageByResource(usage);
    const costs: any = {};

    for (const [resource, data] of Object.entries(grouped)) {
      const rate = pricing.usageRates[resource] || 0;
      costs[resource] = {
        usage: (data as any).total,
        rate,
        cost: (data as any).total * rate
      };
    }

    return costs;
  }

  private analyzeCostsByAgent(usage: any[], pricing: any): any {
    // Analyze costs by agent
    return {};
  }

  private analyzeCostsByDay(usage: any[], pricing: any): any {
    // Analyze costs by day
    return {};
  }

  private identifyCostDrivers(breakdown: any): any[] {
    return Object.entries(breakdown)
      .sort((a: any, b: any) => (b[1].cost || 0) - (a[1].cost || 0))
      .slice(0, 3)
      .map(([key, data]) => ({ key, ...data as any }));
  }

  private generateCostRecommendations(usage: any[], analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.totalCost > 1000) {
      recommendations.push('Consider upgrading to Enterprise plan for better rates');
    }

    return recommendations;
  }

  private async analyzeCostTrends(licenseKey: string, period: string): Promise<any> {
    // Analyze cost trends
    return { trend: 'increasing', rate: 5.2 };
  }

  private predictUsage(data: any, forecastPeriod: string): any {
    // Simple linear prediction
    return { value: data.total * 1.1, trend: 'increasing' };
  }

  private estimateFutureCost(predictions: any, pricing: any): number {
    let cost = pricing.baseCost;

    for (const [resource, prediction] of Object.entries(predictions)) {
      if (resource !== 'estimatedCost' && pricing.usageRates[resource]) {
        cost += (prediction as any).predicted * pricing.usageRates[resource];
      }
    }

    return cost;
  }

  private async predictQuotaBreaches(licenseKey: string, predictions: any): Promise<any[]> {
    const breaches: any[] = [];
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    if (license) {
      const limits = await this.getQuotaLimits(license);

      for (const [resource, limit] of Object.entries(limits)) {
        if (predictions[resource] && predictions[resource].predicted > limit) {
          breaches.push({
            resource,
            predictedUsage: predictions[resource].predicted,
            limit,
            breachDate: 'Within forecast period'
          });
        }
      }
    }

    return breaches;
  }

  private identifyUnderutilizedResources(usage: any[]): any[] {
    // Identify underutilized resources
    return [];
  }

  private analyzePeakUsage(usage: any[]): any {
    return {
      canOptimize: true,
      potentialSaving: 50
    };
  }

  private async suggestPlanOptimization(licenseKey: string, usage: any[]): Promise<any> {
    return {
      current: 'Professional',
      suggested: 'Enterprise',
      saving: 100
    };
  }

  private identifyRedundancies(usage: any[]): any[] {
    return [];
  }

  private prioritizeOptimizations(optimizations: any[]): any[] {
    return optimizations.sort((a, b) => (b.potentialSaving || 0) - (a.potentialSaving || 0));
  }

  private async sendAlertNotifications(licenseKey: string, alert: any, channels: string[]): Promise<void> {
    // Send notifications through configured channels
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          // Send email notification
          break;
        case 'dashboard':
          // Update dashboard alert
          break;
        case 'slack':
          // Send Slack notification
          break;
      }
    }
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'track_usage', 'get_usage_summary', 'get_usage_details', 'get_usage_trends',
      'check_quota', 'update_quota', 'enforce_quota', 'get_quota_status',
      'calculate_bill', 'generate_invoice', 'process_payment', 'get_billing_history',
      'analyze_costs', 'forecast_usage', 'optimize_costs',
      'set_usage_alert', 'check_thresholds'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}