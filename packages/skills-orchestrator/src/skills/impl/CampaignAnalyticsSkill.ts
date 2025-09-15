import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CampaignAnalyticsSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'campaign_analytics',
    name: 'Campaign Analytics Service',
    description: 'Comprehensive analytics and reporting for sales campaigns',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['analytics', 'reporting', 'campaigns', 'metrics', 'insights', 'sales']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        case 'campaign_performance':
          return await this.getCampaignPerformance(licenseKey, data.campaignId, data.dateRange);
        case 'lead_analytics':
          return await this.getLeadAnalytics(licenseKey, data.campaignId, data.filters);
        case 'email_metrics':
          return await this.getEmailMetrics(licenseKey, data.campaignId, data.dateRange);
        case 'conversion_funnel':
          return await this.getConversionFunnel(licenseKey, data.campaignId);
        case 'engagement_timeline':
          return await this.getEngagementTimeline(licenseKey, data.leadId || data.campaignId);
        case 'top_performers':
          return await this.getTopPerformers(licenseKey, data.metric, data.limit);
        case 'campaign_comparison':
          return await this.compareCampaigns(licenseKey, data.campaignIds);
        case 'roi_analysis':
          return await this.getROIAnalysis(licenseKey, data.campaignId);
        case 'generate_report':
          return await this.generateReport(licenseKey, data.reportType, data.filters);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in CampaignAnalyticsSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async getCampaignPerformance(licenseKey: string, campaignId: string, dateRange?: any): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findFirst({
        where: {
          license_key: licenseKey,
          id: campaignId
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Get all activities for the campaign
      const activities = await prisma.sales_activities.findMany({
        where: {
          license_key: licenseKey,
          campaign_id: campaignId,
          ...(dateRange && {
            performed_at: {
              gte: new Date(dateRange.from),
              lte: new Date(dateRange.to)
            }
          })
        }
      });

      // Calculate metrics
      const metrics = {
        totalLeads: campaign.total_leads,
        emailsSent: campaign.emails_sent,
        emailsOpened: campaign.emails_opened,
        emailsClicked: campaign.emails_clicked,
        repliesReceived: campaign.replies_received,
        meetingsBooked: campaign.meetings_booked,
        dealsCreated: campaign.deals_created,

        // Calculate rates
        openRate: campaign.emails_sent ? (campaign.emails_opened / campaign.emails_sent * 100).toFixed(2) : 0,
        clickRate: campaign.emails_sent ? (campaign.emails_clicked / campaign.emails_sent * 100).toFixed(2) : 0,
        replyRate: campaign.emails_sent ? (campaign.replies_received / campaign.emails_sent * 100).toFixed(2) : 0,
        conversionRate: campaign.total_leads ? (campaign.deals_created / campaign.total_leads * 100).toFixed(2) : 0,

        // Activity breakdown
        activityBreakdown: this.getActivityBreakdown(activities),

        // Timeline
        campaignDuration: this.calculateDuration(campaign.start_date, campaign.end_date || new Date()),
        status: campaign.status
      };

      return this.success({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.campaign_type
        },
        metrics,
        message: 'Campaign performance metrics retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get campaign performance: ${error.message}`);
    }
  }

  private async getLeadAnalytics(licenseKey: string, campaignId?: string, filters?: any): Promise<SkillResult> {
    try {
      const whereClause: any = {
        license_key: licenseKey
      };

      if (campaignId) {
        whereClause.campaign_id = campaignId;
      }

      if (filters) {
        if (filters.status) whereClause.status = filters.status;
        if (filters.scoreMin) whereClause.score = { gte: filters.scoreMin };
        if (filters.industry) whereClause.industry = filters.industry;
        if (filters.companySize) whereClause.company_size = filters.companySize;
      }

      const leads = await prisma.sales_leads.findMany({
        where: whereClause
      });

      // Analyze lead data
      const analytics = {
        totalLeads: leads.length,

        // Status distribution
        statusDistribution: this.groupBy(leads, 'status'),

        // Score distribution
        averageScore: this.calculateAverage(leads.map(l => l.score || 0)),
        scoreDistribution: this.getScoreDistribution(leads),

        // Engagement metrics
        engagementMetrics: {
          totalEngaged: leads.filter(l => l.emails_opened && l.emails_opened > 0).length,
          totalClicked: leads.filter(l => l.emails_clicked && l.emails_clicked > 0).length,
          averageEmailsOpened: this.calculateAverage(leads.map(l => l.emails_opened || 0)),
          averageEmailsClicked: this.calculateAverage(leads.map(l => l.emails_clicked || 0))
        },

        // Company insights
        companyInsights: {
          industries: this.groupBy(leads, 'industry'),
          companySizes: this.groupBy(leads, 'company_size'),
          topCompanies: this.getTopCompanies(leads)
        },

        // Geographic distribution
        geographicDistribution: {
          countries: this.groupBy(leads, 'country'),
          states: this.groupBy(leads, 'state'),
          cities: this.groupBy(leads, 'city')
        }
      };

      return this.success({
        analytics,
        filters: filters || {},
        message: 'Lead analytics generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get lead analytics: ${error.message}`);
    }
  }

  private async getEmailMetrics(licenseKey: string, campaignId?: string, dateRange?: any): Promise<SkillResult> {
    try {
      const whereClause: any = {
        license_key: licenseKey,
        activity_type: { in: ['email_sent', 'email_opened', 'email_clicked', 'reply_received'] }
      };

      if (campaignId) {
        whereClause.campaign_id = campaignId;
      }

      if (dateRange) {
        whereClause.performed_at = {
          gte: new Date(dateRange.from),
          lte: new Date(dateRange.to)
        };
      }

      const activities = await prisma.sales_activities.findMany({
        where: whereClause,
        orderBy: { performed_at: 'asc' }
      });

      // Get email templates performance
      const templates = await prisma.sales_email_templates.findMany({
        where: { license_key: licenseKey },
        orderBy: { times_used: 'desc' }
      });

      const metrics = {
        // Overall metrics
        totalEmailsSent: activities.filter(a => a.activity_type === 'email_sent').length,
        totalOpens: activities.filter(a => a.activity_type === 'email_opened').length,
        totalClicks: activities.filter(a => a.activity_type === 'email_clicked').length,
        totalReplies: activities.filter(a => a.activity_type === 'reply_received').length,

        // Time-based metrics
        emailsByDay: this.groupByDay(activities.filter(a => a.activity_type === 'email_sent')),
        opensByDay: this.groupByDay(activities.filter(a => a.activity_type === 'email_opened')),
        clicksByDay: this.groupByDay(activities.filter(a => a.activity_type === 'email_clicked')),

        // Best performing times
        bestSendTimes: this.analyzeBestTimes(activities),

        // Template performance
        topTemplates: templates.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          timesUsed: t.times_used,
          avgOpenRate: t.avg_open_rate,
          avgClickRate: t.avg_click_rate,
          avgReplyRate: t.avg_reply_rate
        }))
      };

      return this.success({
        metrics,
        dateRange: dateRange || 'all-time',
        message: 'Email metrics retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get email metrics: ${error.message}`);
    }
  }

  private async getConversionFunnel(licenseKey: string, campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findFirst({
        where: {
          license_key: licenseKey,
          id: campaignId
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      const leads = await prisma.sales_leads.findMany({
        where: {
          license_key: licenseKey,
          campaign_id: campaignId
        }
      });

      // Build funnel stages
      const funnel = {
        stages: [
          {
            name: 'Total Leads',
            count: leads.length,
            percentage: 100
          },
          {
            name: 'Contacted',
            count: leads.filter(l => l.emails_sent && l.emails_sent > 0).length,
            percentage: 0
          },
          {
            name: 'Engaged (Opened)',
            count: leads.filter(l => l.emails_opened && l.emails_opened > 0).length,
            percentage: 0
          },
          {
            name: 'Interested (Clicked)',
            count: leads.filter(l => l.emails_clicked && l.emails_clicked > 0).length,
            percentage: 0
          },
          {
            name: 'Qualified',
            count: leads.filter(l => l.status === 'qualified').length,
            percentage: 0
          },
          {
            name: 'Converted',
            count: leads.filter(l => l.status === 'converted').length,
            percentage: 0
          }
        ],

        // Conversion rates between stages
        conversionRates: [],

        // Average time between stages
        averageTimeToConversion: this.calculateAverageConversionTime(leads)
      };

      // Calculate percentages and conversion rates
      funnel.stages.forEach((stage, index) => {
        if (index > 0) {
          stage.percentage = leads.length > 0 ? (stage.count / leads.length * 100) : 0;

          const previousStage = funnel.stages[index - 1];
          if (previousStage.count > 0) {
            funnel.conversionRates.push({
              from: previousStage.name,
              to: stage.name,
              rate: (stage.count / previousStage.count * 100).toFixed(2)
            });
          }
        }
      });

      return this.success({
        funnel,
        campaign: {
          id: campaign.id,
          name: campaign.name
        },
        message: 'Conversion funnel generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get conversion funnel: ${error.message}`);
    }
  }

  private async getEngagementTimeline(licenseKey: string, identifier: string): Promise<SkillResult> {
    try {
      const whereClause: any = {
        license_key: licenseKey
      };

      // Check if identifier is a lead ID or campaign ID
      const lead = await prisma.sales_leads.findFirst({
        where: {
          license_key: licenseKey,
          id: identifier
        }
      });

      if (lead) {
        whereClause.lead_id = identifier;
      } else {
        whereClause.campaign_id = identifier;
      }

      const activities = await prisma.sales_activities.findMany({
        where: whereClause,
        orderBy: { performed_at: 'desc' },
        take: 100
      });

      // Build timeline
      const timeline = activities.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        subject: activity.subject,
        status: activity.status,
        timestamp: activity.performed_at,
        metadata: activity.metadata,
        skill: activity.skill_used
      }));

      // Calculate engagement patterns
      const patterns = {
        mostActiveHour: this.getMostActiveHour(activities),
        mostActiveDay: this.getMostActiveDay(activities),
        averageResponseTime: this.calculateAverageResponseTime(activities),
        engagementScore: this.calculateEngagementScore(activities)
      };

      return this.success({
        timeline,
        patterns,
        totalActivities: activities.length,
        message: 'Engagement timeline generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get engagement timeline: ${error.message}`);
    }
  }

  private async getTopPerformers(licenseKey: string, metric: string, limit: number = 10): Promise<SkillResult> {
    try {
      let topPerformers: any[] = [];

      switch (metric) {
        case 'leads':
          const topLeads = await prisma.sales_leads.findMany({
            where: { license_key: licenseKey },
            orderBy: { score: 'desc' },
            take: limit
          });
          topPerformers = topLeads.map(l => ({
            id: l.id,
            name: l.full_name || l.email,
            company: l.company_name,
            score: l.score,
            status: l.status,
            engagement: {
              emailsOpened: l.emails_opened,
              emailsClicked: l.emails_clicked
            }
          }));
          break;

        case 'campaigns':
          const campaigns = await prisma.sales_campaigns.findMany({
            where: { license_key: licenseKey }
          });

          // Calculate success rate for each campaign
          const campaignPerformance = campaigns.map(c => ({
            id: c.id,
            name: c.name,
            type: c.campaign_type,
            successRate: c.total_leads > 0 ? (c.deals_created / c.total_leads * 100) : 0,
            emailsSent: c.emails_sent,
            openRate: c.emails_sent > 0 ? (c.emails_opened / c.emails_sent * 100) : 0,
            clickRate: c.emails_sent > 0 ? (c.emails_clicked / c.emails_sent * 100) : 0,
            replyRate: c.emails_sent > 0 ? (c.replies_received / c.emails_sent * 100) : 0
          }));

          topPerformers = campaignPerformance
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, limit);
          break;

        case 'templates':
          const templates = await prisma.sales_email_templates.findMany({
            where: { license_key: licenseKey },
            orderBy: { avg_reply_rate: 'desc' },
            take: limit
          });
          topPerformers = templates.map(t => ({
            id: t.id,
            name: t.name,
            type: t.template_type,
            timesUsed: t.times_used,
            avgOpenRate: t.avg_open_rate,
            avgClickRate: t.avg_click_rate,
            avgReplyRate: t.avg_reply_rate
          }));
          break;

        default:
          return this.error(`Invalid metric: ${metric}`);
      }

      return this.success({
        metric,
        topPerformers,
        message: `Top ${limit} ${metric} retrieved`
      });
    } catch (error: any) {
      return this.error(`Failed to get top performers: ${error.message}`);
    }
  }

  private async compareCampaigns(licenseKey: string, campaignIds: string[]): Promise<SkillResult> {
    try {
      const campaigns = await prisma.sales_campaigns.findMany({
        where: {
          license_key: licenseKey,
          id: { in: campaignIds }
        }
      });

      if (campaigns.length === 0) {
        return this.error('No campaigns found');
      }

      const comparison = campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.campaign_type,
        status: c.status,
        metrics: {
          totalLeads: c.total_leads,
          emailsSent: c.emails_sent,
          openRate: c.emails_sent > 0 ? (c.emails_opened / c.emails_sent * 100).toFixed(2) : '0',
          clickRate: c.emails_sent > 0 ? (c.emails_clicked / c.emails_sent * 100).toFixed(2) : '0',
          replyRate: c.emails_sent > 0 ? (c.replies_received / c.emails_sent * 100).toFixed(2) : '0',
          conversionRate: c.total_leads > 0 ? (c.deals_created / c.total_leads * 100).toFixed(2) : '0',
          meetingsBooked: c.meetings_booked,
          dealsCreated: c.deals_created
        },
        duration: this.calculateDuration(c.start_date, c.end_date || new Date())
      }));

      // Calculate winner for each metric
      const winners = {
        bestOpenRate: comparison.reduce((prev, curr) =>
          parseFloat(curr.metrics.openRate) > parseFloat(prev.metrics.openRate) ? curr : prev
        ).name,
        bestClickRate: comparison.reduce((prev, curr) =>
          parseFloat(curr.metrics.clickRate) > parseFloat(prev.metrics.clickRate) ? curr : prev
        ).name,
        bestConversionRate: comparison.reduce((prev, curr) =>
          parseFloat(curr.metrics.conversionRate) > parseFloat(prev.metrics.conversionRate) ? curr : prev
        ).name,
        mostDeals: comparison.reduce((prev, curr) =>
          curr.metrics.dealsCreated > prev.metrics.dealsCreated ? curr : prev
        ).name
      };

      return this.success({
        comparison,
        winners,
        message: 'Campaign comparison completed'
      });
    } catch (error: any) {
      return this.error(`Failed to compare campaigns: ${error.message}`);
    }
  }

  private async getROIAnalysis(licenseKey: string, campaignId: string): Promise<SkillResult> {
    try {
      const campaign = await prisma.sales_campaigns.findFirst({
        where: {
          license_key: licenseKey,
          id: campaignId
        }
      });

      if (!campaign) {
        return this.error('Campaign not found');
      }

      // Simulated ROI calculation (in production, would use actual revenue data)
      const avgDealValue = 5000; // Example average deal value
      const campaignCost = 1000; // Example campaign cost

      const roi = {
        revenue: {
          dealsCreated: campaign.deals_created,
          avgDealValue,
          totalRevenue: campaign.deals_created * avgDealValue,
          projectedRevenue: campaign.meetings_booked * avgDealValue * 0.3 // 30% close rate
        },

        costs: {
          campaignCost,
          costPerLead: campaign.total_leads > 0 ? (campaignCost / campaign.total_leads).toFixed(2) : 0,
          costPerDeal: campaign.deals_created > 0 ? (campaignCost / campaign.deals_created).toFixed(2) : 0
        },

        roi: {
          actualROI: ((campaign.deals_created * avgDealValue - campaignCost) / campaignCost * 100).toFixed(2),
          projectedROI: ((campaign.meetings_booked * avgDealValue * 0.3 - campaignCost) / campaignCost * 100).toFixed(2)
        },

        efficiency: {
          leadToMeetingRate: campaign.total_leads > 0 ?
            (campaign.meetings_booked / campaign.total_leads * 100).toFixed(2) : '0',
          meetingToDealRate: campaign.meetings_booked > 0 ?
            (campaign.deals_created / campaign.meetings_booked * 100).toFixed(2) : '0',
          overallConversionRate: campaign.total_leads > 0 ?
            (campaign.deals_created / campaign.total_leads * 100).toFixed(2) : '0'
        }
      };

      return this.success({
        campaign: {
          id: campaign.id,
          name: campaign.name
        },
        roi,
        message: 'ROI analysis completed'
      });
    } catch (error: any) {
      return this.error(`Failed to analyze ROI: ${error.message}`);
    }
  }

  private async generateReport(licenseKey: string, reportType: string, filters?: any): Promise<SkillResult> {
    try {
      let reportData: any = {};

      switch (reportType) {
        case 'executive_summary':
          // Get all campaigns
          const campaigns = await prisma.sales_campaigns.findMany({
            where: { license_key: licenseKey }
          });

          const leads = await prisma.sales_leads.findMany({
            where: { license_key: licenseKey }
          });

          reportData = {
            overview: {
              totalCampaigns: campaigns.length,
              activeCampaigns: campaigns.filter(c => c.status === 'active').length,
              totalLeads: leads.length,
              qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
              convertedLeads: leads.filter(l => l.status === 'converted').length
            },
            performance: {
              totalEmailsSent: campaigns.reduce((sum, c) => sum + c.emails_sent, 0),
              avgOpenRate: this.calculateAverage(campaigns.map(c =>
                c.emails_sent > 0 ? (c.emails_opened / c.emails_sent * 100) : 0
              )).toFixed(2),
              avgClickRate: this.calculateAverage(campaigns.map(c =>
                c.emails_sent > 0 ? (c.emails_clicked / c.emails_sent * 100) : 0
              )).toFixed(2),
              totalMeetingsBooked: campaigns.reduce((sum, c) => sum + c.meetings_booked, 0),
              totalDealsCreated: campaigns.reduce((sum, c) => sum + c.deals_created, 0)
            }
          };
          break;

        case 'detailed_campaign':
          if (!filters?.campaignId) {
            return this.error('Campaign ID required for detailed report');
          }

          const campaignPerf = await this.getCampaignPerformance(licenseKey, filters.campaignId);
          const funnel = await this.getConversionFunnel(licenseKey, filters.campaignId);
          const roi = await this.getROIAnalysis(licenseKey, filters.campaignId);

          reportData = {
            performance: campaignPerf.data,
            funnel: funnel.data,
            roi: roi.data
          };
          break;

        case 'lead_quality':
          const leadAnalytics = await this.getLeadAnalytics(licenseKey, filters?.campaignId);
          reportData = leadAnalytics.data;
          break;

        default:
          return this.error(`Unknown report type: ${reportType}`);
      }

      return this.success({
        reportType,
        generatedAt: new Date().toISOString(),
        data: reportData,
        filters: filters || {},
        message: 'Report generated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to generate report: ${error.message}`);
    }
  }

  // Helper methods
  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((result, item) => {
      const value = item[key] || 'Unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculateDuration(start: Date | null, end: Date): string {
    if (!start) return 'Not started';
    const diff = end.getTime() - new Date(start).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }

  private getActivityBreakdown(activities: any[]): Record<string, number> {
    return this.groupBy(activities, 'activity_type');
  }

  private getScoreDistribution(leads: any[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    leads.forEach(lead => {
      const score = lead.score || 0;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return distribution;
  }

  private getTopCompanies(leads: any[], limit: number = 5): any[] {
    const companies = this.groupBy(leads, 'company_name');
    return Object.entries(companies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  private groupByDay(activities: any[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    activities.forEach(activity => {
      const date = new Date(activity.performed_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return grouped;
  }

  private analyzeBestTimes(activities: any[]): any {
    const hourlyDistribution: Record<number, number> = {};
    const dayDistribution: Record<string, number> = {};

    activities.forEach(activity => {
      const date = new Date(activity.performed_at);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    const bestHour = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    const bestDay = Object.entries(dayDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      bestHour: bestHour ? `${bestHour[0]}:00` : 'N/A',
      bestDay: bestDay ? bestDay[0] : 'N/A'
    };
  }

  private calculateAverageConversionTime(leads: any[]): string {
    const convertedLeads = leads.filter(l => l.status === 'converted');
    if (convertedLeads.length === 0) return 'N/A';

    const conversionTimes = convertedLeads.map(lead => {
      const created = new Date(lead.created_at).getTime();
      const updated = new Date(lead.updated_at).getTime();
      return updated - created;
    });

    const avgTime = this.calculateAverage(conversionTimes);
    const days = Math.floor(avgTime / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }

  private getMostActiveHour(activities: any[]): number {
    const hours = activities.map(a => new Date(a.performed_at).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return parseInt(Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0');
  }

  private getMostActiveDay(activities: any[]): string {
    const days = activities.map(a =>
      new Date(a.performed_at).toLocaleDateString('en-US', { weekday: 'long' })
    );
    const dayCounts = days.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
  }

  private calculateAverageResponseTime(activities: any[]): string {
    // This would calculate average time between email sent and reply
    // Simplified for this implementation
    return '4 hours';
  }

  private calculateEngagementScore(activities: any[]): number {
    // Calculate engagement score based on activity patterns
    const recentActivities = activities.filter(a => {
      const daysSince = (Date.now() - new Date(a.performed_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    const score = Math.min(100, recentActivities.length * 10);
    return score;
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'campaign_performance', 'lead_analytics', 'email_metrics',
      'conversion_funnel', 'engagement_timeline', 'top_performers',
      'campaign_comparison', 'roi_analysis', 'generate_report'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}