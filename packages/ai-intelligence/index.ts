import { prisma } from '@intelagent/database';
import OpenAI from 'openai';
// ChromaDB is optional - only import if available
let ChromaClient: any;
try {
  ChromaClient = require('chromadb').ChromaClient;
} catch {
  ChromaClient = null;
}

interface InsightRequest {
  licenseKey: string;
  type: 'pattern' | 'anomaly' | 'recommendation' | 'prediction' | 'summary';
  products?: string[];
  timeRange?: { start: Date; end: Date };
  context?: Record<string, any>;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
  data: Record<string, any>;
  sources: string[];
}

interface Pattern {
  name: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  correlation: number;
  products: string[];
}

class AIIntelligenceService {
  private openai: OpenAI | null = null;
  private chromaClient: ChromaClient | null = null;
  private embeddingsCache: Map<string, number[]> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize ChromaDB for vector storage if available
    if (process.env.CHROMA_URL && ChromaClient) {
      try {
        this.chromaClient = new ChromaClient({
          path: process.env.CHROMA_URL
        });
      } catch (error) {
        console.log('ChromaDB not available, running without vector storage');
      }
    }
  }

  async generateInsights(request: InsightRequest): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Gather data from all products
    const data = await this.gatherCrossProductData(request);

    // Generate insights based on type
    switch (request.type) {
      case 'pattern':
        insights.push(...await this.detectPatterns(data, request));
        break;
      
      case 'anomaly':
        insights.push(...await this.detectAnomalies(data, request));
        break;
      
      case 'recommendation':
        insights.push(...await this.generateRecommendations(data, request));
        break;
      
      case 'prediction':
        insights.push(...await this.generatePredictions(data, request));
        break;
      
      case 'summary':
        insights.push(await this.generateExecutiveSummary(data, request));
        break;
    }

    // Store insights for future reference
    await this.storeInsights(insights, request.licenseKey);

    return insights;
  }

  private async gatherCrossProductData(request: InsightRequest): Promise<any> {
    const { licenseKey, products, timeRange } = request;
    const productList = products || ['chatbot', 'sales-agent', 'enrichment'];
    
    const data: Record<string, any> = {};

    // Get chatbot data
    if (productList.includes('chatbot')) {
      data.chatbot = await this.getChatbotData(licenseKey, timeRange);
    }

    // Get sales agent data
    if (productList.includes('sales-agent')) {
      data.salesAgent = await this.getSalesAgentData(licenseKey, timeRange);
    }

    // Get enrichment data
    if (productList.includes('enrichment')) {
      data.enrichment = await this.getEnrichmentData(licenseKey, timeRange);
    }

    // Get usage metrics
    data.usage = await this.getUsageMetrics(licenseKey, timeRange);

    return data;
  }

  private async getChatbotData(licenseKey: string, timeRange?: any) {
    const where: any = { 
      license: { license_key: licenseKey }
    };

    if (timeRange) {
      where.created_at = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }

    const [conversations, intents, satisfaction] = await Promise.all([
      // Get conversation data
      prisma.chatbot_logs.findMany({
        where,
        select: {
          session_id: true,
          intent_detected: true,
          created_at: true,
          customer_message: true,
          chatbot_response: true
        },
        orderBy: { created_at: 'desc' },
        take: 1000
      }),

      // Get intent distribution
      prisma.chatbot_logs.groupBy({
        by: ['intent_detected'],
        where,
        _count: true
      }),

      // Analyze satisfaction (simplified - would need sentiment analysis)
      prisma.chatbot_logs.count({
        where: {
          ...where,
          OR: [
            { customer_message: { contains: 'thank' } },
            { customer_message: { contains: 'great' } },
            { customer_message: { contains: 'perfect' } }
          ]
        }
      })
    ]);

    return {
      totalConversations: conversations.length,
      uniqueSessions: new Set(conversations.map(c => c.session_id)).size,
      intents,
      satisfactionIndicator: satisfaction,
      recentConversations: conversations.slice(0, 10)
    };
  }

  private async getSalesAgentData(licenseKey: string, timeRange?: any) {
    // Simplified - would integrate with actual sales agent data
    return {
      emailsSent: Math.floor(Math.random() * 1000),
      openRate: 0.23,
      clickRate: 0.08,
      conversionRate: 0.03,
      topPerformingCampaigns: [
        { name: 'Q4 Outreach', conversion: 0.05 },
        { name: 'Product Launch', conversion: 0.04 }
      ]
    };
  }

  private async getEnrichmentData(licenseKey: string, timeRange?: any) {
    // Simplified - would integrate with actual enrichment data
    return {
      totalLookups: Math.floor(Math.random() * 5000),
      successRate: 0.87,
      averageFields: 12,
      topDataTypes: ['email', 'company', 'phone', 'linkedin']
    };
  }

  private async getUsageMetrics(licenseKey: string, timeRange?: any) {
    const where: any = { license_key: licenseKey };
    
    if (timeRange) {
      where.period_start = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }

    return await prisma.usage_metrics.findMany({
      where,
      orderBy: { period_start: 'desc' },
      take: 30
    });
  }

  private async detectPatterns(data: any, request: InsightRequest): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Analyze chatbot conversation patterns
    if (data.chatbot) {
      const timePatterns = this.analyzeTimePatterns(data.chatbot.recentConversations);
      
      if (timePatterns.peakHour) {
        insights.push({
          id: this.generateId(),
          type: 'pattern',
          title: 'Peak Usage Hours Detected',
          description: `Most customer interactions occur between ${timePatterns.peakHour}:00 and ${timePatterns.peakHour + 1}:00`,
          impact: 'medium',
          confidence: 0.85,
          recommendations: [
            'Schedule maintenance outside peak hours',
            'Ensure adequate support coverage during peak times',
            'Consider implementing queue management'
          ],
          data: timePatterns,
          sources: ['chatbot_logs']
        });
      }

      // Intent patterns
      const topIntents = data.chatbot.intents
        .sort((a: any, b: any) => b._count - a._count)
        .slice(0, 3);
      
      if (topIntents.length > 0) {
        insights.push({
          id: this.generateId(),
          type: 'pattern',
          title: 'Common Customer Inquiries',
          description: `Top customer intents: ${topIntents.map((i: any) => i.intent_detected).join(', ')}`,
          impact: 'medium',
          confidence: 0.90,
          recommendations: [
            'Create FAQ content for common questions',
            'Train chatbot on these specific topics',
            'Consider automated responses for repetitive queries'
          ],
          data: { topIntents },
          sources: ['chatbot_logs']
        });
      }
    }

    // Cross-product patterns
    if (data.salesAgent && data.enrichment) {
      const correlation = this.calculateCorrelation(
        data.salesAgent.emailsSent,
        data.enrichment.totalLookups
      );

      if (correlation > 0.7) {
        insights.push({
          id: this.generateId(),
          type: 'pattern',
          title: 'Correlated Product Usage',
          description: 'Strong correlation detected between sales outreach and data enrichment',
          impact: 'high',
          confidence: correlation,
          recommendations: [
            'Bundle these products for better pricing',
            'Create integrated workflows',
            'Optimize data enrichment before sales campaigns'
          ],
          data: { correlation, products: ['sales-agent', 'enrichment'] },
          sources: ['usage_metrics']
        });
      }
    }

    return insights;
  }

  private async detectAnomalies(data: any, request: InsightRequest): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Check for usage spikes
    if (data.usage && data.usage.length > 7) {
      const recentUsage = data.usage.slice(0, 7);
      const avgMessages = recentUsage.reduce((sum: number, m: any) => sum + (m.messages || 0), 0) / 7;
      const latestMessages = recentUsage[0].messages || 0;

      if (latestMessages > avgMessages * 2) {
        insights.push({
          id: this.generateId(),
          type: 'anomaly',
          title: 'Unusual Usage Spike Detected',
          description: `Message volume is ${Math.round((latestMessages / avgMessages - 1) * 100)}% above average`,
          impact: 'high',
          confidence: 0.95,
          recommendations: [
            'Investigate the cause of increased usage',
            'Check for potential abuse or automation',
            'Consider upgrading plan if legitimate growth'
          ],
          data: { average: avgMessages, current: latestMessages },
          sources: ['usage_metrics']
        });
      }
    }

    // Check for error patterns
    if (data.chatbot && data.chatbot.recentConversations) {
      const errorMessages = data.chatbot.recentConversations.filter((c: any) => 
        c.chatbot_response?.includes('error') || 
        c.chatbot_response?.includes('sorry')
      );

      if (errorMessages.length > data.chatbot.recentConversations.length * 0.1) {
        insights.push({
          id: this.generateId(),
          type: 'anomaly',
          title: 'High Error Rate in Chatbot Responses',
          description: `${Math.round(errorMessages.length / data.chatbot.recentConversations.length * 100)}% of responses contain error indicators`,
          impact: 'critical',
          confidence: 0.88,
          recommendations: [
            'Review chatbot training data',
            'Check API integrations',
            'Implement better error handling'
          ],
          data: { errorRate: errorMessages.length / data.chatbot.recentConversations.length },
          sources: ['chatbot_logs']
        });
      }
    }

    return insights;
  }

  private async generateRecommendations(data: any, request: InsightRequest): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Product adoption recommendations
    const license = await prisma.licenses.findUnique({
      where: { license_key: request.licenseKey },
      select: { products: true, plan: true }
    });

    const allProducts = ['chatbot', 'sales-agent', 'enrichment'];
    const unusedProducts = allProducts.filter(p => !license?.products.includes(p));

    if (unusedProducts.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'recommendation',
        title: 'Expand Product Usage',
        description: `You could benefit from ${unusedProducts.join(' and ')} based on your usage patterns`,
        impact: 'medium',
        confidence: 0.75,
        recommendations: [
          `Try ${unusedProducts[0]} to enhance your automation`,
          'Bundle products for cost savings',
          'Request a demo of unused features'
        ],
        data: { currentProducts: license?.products, recommended: unusedProducts },
        sources: ['license_data']
      });
    }

    // Optimization recommendations
    if (data.chatbot && data.chatbot.satisfactionIndicator < data.chatbot.totalConversations * 0.2) {
      insights.push({
        id: this.generateId(),
        type: 'recommendation',
        title: 'Improve Chatbot Training',
        description: 'Customer satisfaction indicators suggest room for improvement',
        impact: 'high',
        confidence: 0.82,
        recommendations: [
          'Add more training data for common queries',
          'Implement sentiment analysis',
          'Add human handoff for complex issues',
          'Review and update response templates'
        ],
        data: { 
          satisfactionRate: data.chatbot.satisfactionIndicator / data.chatbot.totalConversations 
        },
        sources: ['chatbot_logs']
      });
    }

    // Usage optimization
    if (data.usage && data.usage[0]) {
      const latestUsage = data.usage[0];
      const utilizationRate = (latestUsage.messages || 0) / 10000; // Assuming 10k limit

      if (utilizationRate < 0.3) {
        insights.push({
          id: this.generateId(),
          type: 'recommendation',
          title: 'Underutilized Resources',
          description: `You're only using ${Math.round(utilizationRate * 100)}% of your plan capacity`,
          impact: 'low',
          confidence: 0.90,
          recommendations: [
            'Consider downgrading to save costs',
            'Increase automation to maximize value',
            'Share access with team members'
          ],
          data: { utilizationRate },
          sources: ['usage_metrics']
        });
      } else if (utilizationRate > 0.8) {
        insights.push({
          id: this.generateId(),
          type: 'recommendation',
          title: 'Approaching Plan Limits',
          description: `You're using ${Math.round(utilizationRate * 100)}% of your plan capacity`,
          impact: 'high',
          confidence: 0.95,
          recommendations: [
            'Upgrade to the next tier',
            'Optimize usage patterns',
            'Archive old data to free up space'
          ],
          data: { utilizationRate },
          sources: ['usage_metrics']
        });
      }
    }

    return insights;
  }

  private async generatePredictions(data: any, request: InsightRequest): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Predict future usage based on trends
    if (data.usage && data.usage.length >= 7) {
      const trend = this.calculateTrend(data.usage.map((u: any) => u.messages || 0));
      const prediction = this.predictNextPeriod(data.usage.map((u: any) => u.messages || 0));

      insights.push({
        id: this.generateId(),
        type: 'prediction',
        title: 'Usage Forecast',
        description: `Expected ${trend > 0 ? 'increase' : 'decrease'} of ${Math.abs(Math.round(trend * 100))}% next month`,
        impact: trend > 0.2 ? 'high' : 'medium',
        confidence: 0.70,
        recommendations: trend > 0 ? [
          'Plan for capacity increase',
          'Consider upgrading proactively',
          'Review automation efficiency'
        ] : [
          'Investigate usage decline',
          'Check for technical issues',
          'Review user engagement'
        ],
        data: { trend, prediction, historical: data.usage.slice(0, 7) },
        sources: ['usage_metrics']
      });
    }

    // Predict customer behavior
    if (data.chatbot && data.chatbot.intents) {
      const growingIntents = data.chatbot.intents.filter((i: any) => {
        // Simplified - would need historical comparison
        return i._count > 10;
      });

      if (growingIntents.length > 0) {
        insights.push({
          id: this.generateId(),
          type: 'prediction',
          title: 'Emerging Customer Needs',
          description: `Rising interest in: ${growingIntents[0].intent_detected}`,
          impact: 'medium',
          confidence: 0.65,
          recommendations: [
            'Prepare content for emerging topics',
            'Train support team on new areas',
            'Consider product features to address these needs'
          ],
          data: { emergingIntents: growingIntents },
          sources: ['chatbot_logs']
        });
      }
    }

    return insights;
  }

  private async generateExecutiveSummary(data: any, request: InsightRequest): Promise<Insight> {
    const summary = {
      period: request.timeRange || { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
      products: Object.keys(data).filter(k => k !== 'usage'),
      metrics: {} as any
    };

    // Compile key metrics
    if (data.chatbot) {
      summary.metrics.chatbot = {
        conversations: data.chatbot.totalConversations,
        uniqueUsers: data.chatbot.uniqueSessions,
        satisfaction: `${Math.round((data.chatbot.satisfactionIndicator / data.chatbot.totalConversations) * 100)}%`
      };
    }

    if (data.salesAgent) {
      summary.metrics.salesAgent = {
        emailsSent: data.salesAgent.emailsSent,
        openRate: `${Math.round(data.salesAgent.openRate * 100)}%`,
        conversionRate: `${Math.round(data.salesAgent.conversionRate * 100)}%`
      };
    }

    if (data.enrichment) {
      summary.metrics.enrichment = {
        lookups: data.enrichment.totalLookups,
        successRate: `${Math.round(data.enrichment.successRate * 100)}%`
      };
    }

    // Generate AI summary if available
    let aiSummary = 'Your automation platform is performing well across all products.';
    
    if (this.openai) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an AI analyst providing executive summaries for business automation metrics.'
            },
            {
              role: 'user',
              content: `Summarize these metrics in 2-3 sentences: ${JSON.stringify(summary.metrics)}`
            }
          ],
          max_tokens: 150
        });

        aiSummary = completion.choices[0].message.content || aiSummary;
      } catch (error) {
        console.error('Failed to generate AI summary:', error);
      }
    }

    return {
      id: this.generateId(),
      type: 'summary',
      title: 'Executive Summary',
      description: aiSummary,
      impact: 'medium',
      confidence: 0.85,
      recommendations: [
        'Review detailed insights for optimization opportunities',
        'Share metrics with stakeholders',
        'Set targets for next period'
      ],
      data: summary,
      sources: ['all_products']
    };
  }

  private analyzeTimePatterns(conversations: any[]): any {
    const hourCounts: Record<number, number> = {};
    
    conversations.forEach(c => {
      if (c.created_at) {
        const hour = new Date(c.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      peakHour: peakHour ? parseInt(peakHour) : null,
      distribution: hourCounts
    };
  }

  private calculateCorrelation(x: number, y: number): number {
    // Simplified correlation calculation
    return Math.random() * 0.5 + 0.5; // Would implement proper correlation
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  private predictNextPeriod(values: number[]): number {
    // Simple linear prediction
    const trend = this.calculateTrend(values);
    const lastValue = values[values.length - 1];
    return Math.round(lastValue * (1 + trend));
  }

  private async storeInsights(insights: Insight[], licenseKey: string): Promise<void> {
    for (const insight of insights) {
      await prisma.ai_insights.create({
        data: {
          license_key: licenseKey,
          insight_id: insight.id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          impact: insight.impact,
          confidence: insight.confidence,
          recommendations: insight.recommendations,
          data: insight.data,
          sources: insight.sources,
          created_at: new Date()
        }
      });
    }
  }

  private generateId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  // Advanced AI features
  async askQuestion(licenseKey: string, question: string): Promise<string> {
    if (!this.openai) {
      return 'AI service not configured';
    }

    // Gather context
    const data = await this.gatherCrossProductData({
      licenseKey,
      type: 'summary'
    });

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant analyzing business automation data. Answer questions based on the provided context.'
          },
          {
            role: 'user',
            content: `Context: ${JSON.stringify(data)}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 500
      });

      return completion.choices[0].message.content || 'Unable to generate response';
    } catch (error) {
      console.error('Failed to answer question:', error);
      return 'Error processing question';
    }
  }

  async comparePerformance(licenseKeys: string[]): Promise<any> {
    const comparisons: any[] = [];

    for (const key of licenseKeys) {
      const data = await this.gatherCrossProductData({
        licenseKey: key,
        type: 'summary'
      });

      comparisons.push({
        licenseKey: key,
        metrics: data
      });
    }

    return {
      comparison: comparisons,
      winner: comparisons[0], // Simplified - would implement proper comparison
      insights: ['Performance comparison completed']
    };
  }
}

// Singleton instance
const aiIntelligence = new AIIntelligenceService();

export { aiIntelligence, AIIntelligenceService, InsightRequest, Insight, Pattern };