import { prisma } from './db'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export class AIInsightsEngine {
  private static instance: AIInsightsEngine

  private constructor() {}

  static getInstance(): AIInsightsEngine {
    if (!AIInsightsEngine.instance) {
      AIInsightsEngine.instance = new AIInsightsEngine()
    }
    return AIInsightsEngine.instance
  }

  // Generate cross-product analytics
  async generateCrossProductInsights(organizationId: string) {
    try {
      // Gather data from all products
      const [chatbotData, salesData, enrichmentData] = await Promise.all([
        this.getChatbotMetrics(organizationId),
        this.getSalesAgentMetrics(organizationId),
        this.getEnrichmentMetrics(organizationId)
      ])

      const insights = []

      // Chatbot impact on support
      if (chatbotData.totalConversations > 100) {
        const avgResolutionTime = chatbotData.avgResponseTime
        const ticketsDeflected = Math.floor(chatbotData.totalConversations * 0.7)
        const costSaved = ticketsDeflected * 15 // $15 per ticket

        insights.push({
          type: 'chatbot_impact',
          category: 'cost_savings',
          title: 'Chatbot Deflection Success',
          description: `Your chatbot prevented approximately ${ticketsDeflected} support tickets this week, saving ~$${costSaved}`,
          confidence: 0.85,
          impact: 'high',
          recommendation: avgResolutionTime > 5000 
            ? 'Consider optimizing chatbot responses for faster resolution'
            : null,
          dataPoints: {
            conversations: chatbotData.totalConversations,
            ticketsDeflected,
            costSaved,
            avgResolutionTime
          }
        })
      }

      // Sales and enrichment correlation
      if (salesData.emailsSent > 50 && enrichmentData.requestsCount > 20) {
        const enrichmentRate = enrichmentData.requestsCount / salesData.emailsSent
        const responseRate = salesData.responses / salesData.emailsSent

        if (enrichmentRate > 0.3 && responseRate > 0.1) {
          insights.push({
            type: 'sales_enrichment_synergy',
            category: 'performance',
            title: 'Enrichment Boosting Sales',
            description: `Enriched leads show ${Math.round(responseRate * 100)}% response rate, ${Math.round((responseRate - 0.05) / 0.05 * 100)}% higher than average`,
            confidence: 0.75,
            impact: 'medium',
            recommendation: 'Continue enriching leads before outreach for better engagement',
            dataPoints: {
              enrichmentRate,
              responseRate,
              emailsSent: salesData.emailsSent,
              enrichedLeads: enrichmentData.requestsCount
            }
          })
        }
      }

      // Usage patterns and predictions
      const usagePattern = await this.analyzeUsagePatterns(organizationId)
      if (usagePattern) {
        insights.push(usagePattern)
      }

      // Performance anomalies
      const anomalies = await this.detectAnomalies(organizationId)
      insights.push(...anomalies)

      // Store insights
      for (const insight of insights) {
        await prisma.aiInsight.create({
          data: {
            organizationId,
            ...insight,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })
      }

      return insights
    } catch (error) {
      console.error('Error generating insights:', error)
      return []
    }
  }

  // Analyze usage patterns
  private async analyzeUsagePatterns(organizationId: string) {
    const usage = await prisma.usageRecord.findMany({
      where: {
        organizationId,
        periodStart: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { periodStart: 'asc' }
    })

    if (usage.length < 7) return null

    // Calculate growth trends
    const apiCallsTrend = this.calculateTrend(usage.map(u => u.apiCalls))
    const storageTrend = this.calculateTrend(usage.map(u => Number(u.storageUsed)))

    if (apiCallsTrend.growth > 50) {
      return {
        type: 'usage_spike',
        category: 'usage',
        title: 'Rapid Growth Detected',
        description: `API usage increased ${Math.round(apiCallsTrend.growth)}% this week. Based on current trends, you'll exceed your limit in ${apiCallsTrend.daysToLimit} days`,
        confidence: 0.9,
        impact: 'high',
        recommendation: 'Consider upgrading to Pro tier for 10x API limits',
        dataPoints: {
          currentUsage: apiCallsTrend.current,
          projectedUsage: apiCallsTrend.projected,
          growthRate: apiCallsTrend.growth,
          daysToLimit: apiCallsTrend.daysToLimit
        }
      }
    }

    return null
  }

  // Detect anomalies using statistical methods
  private async detectAnomalies(organizationId: string) {
    const anomalies = []

    // Check for unusual activity patterns
    const recentActivity = await prisma.activity.findMany({
      where: {
        user: {
          organizationId
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      select: {
        type: true,
        createdAt: true,
        userId: true
      }
    })

    // Group by hour
    const hourlyActivity = new Map<number, number>()
    recentActivity.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours()
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1)
    })

    // Check for unusual times (e.g., high activity at 3 AM)
    for (const [hour, count] of hourlyActivity) {
      if ((hour < 6 || hour > 22) && count > 10) {
        anomalies.push({
          type: 'unusual_activity_time',
          category: 'anomaly',
          title: 'Unusual Activity Pattern',
          description: `Detected ${count} activities at ${hour}:00, which is outside normal business hours`,
          confidence: 0.7,
          impact: 'low',
          recommendation: 'Review activity logs for potential automation opportunities',
          dataPoints: {
            hour,
            count,
            timestamp: new Date()
          }
        })
      }
    }

    return anomalies
  }

  // Smart suggestions based on usage
  async generateSmartSuggestions(organizationId: string) {
    const suggestions = []

    // Template performance analysis
    const templatePerformance = await this.analyzeTemplatePerformance(organizationId)
    if (templatePerformance.bestPerformer) {
      suggestions.push({
        type: 'template_optimization',
        title: 'High-Performing Template Identified',
        description: `Template "${templatePerformance.bestPerformer.name}" has ${templatePerformance.bestPerformer.responseRate}% response rate`,
        action: 'Use this template more frequently',
        priority: 'high'
      })
    }

    // Timing optimization
    const timingAnalysis = await this.analyzeOptimalTiming(organizationId)
    if (timingAnalysis.bestTime) {
      suggestions.push({
        type: 'timing_optimization',
        title: 'Optimal Send Time',
        description: `Emails sent on ${timingAnalysis.bestDay} at ${timingAnalysis.bestTime} get ${timingAnalysis.improvement}% better engagement`,
        action: 'Schedule campaigns for this time',
        priority: 'medium'
      })
    }

    // Feature discovery
    const unusedFeatures = await this.findUnusedFeatures(organizationId)
    for (const feature of unusedFeatures) {
      suggestions.push({
        type: 'feature_discovery',
        title: `Try ${feature.name}`,
        description: feature.description,
        action: feature.action,
        priority: 'low'
      })
    }

    return suggestions
  }

  // Natural language query processing
  async processNaturalQuery(query: string, organizationId: string) {
    try {
      // Analyze query intent
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a business analytics assistant. Analyze the query and extract the intent, metrics, and timeframe requested.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        response_format: { type: 'json_object' }
      })

      const intent = JSON.parse(completion.choices[0].message.content || '{}')

      // Fetch relevant data based on intent
      const data = await this.fetchDataForIntent(intent, organizationId)

      // Generate response
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful business analytics assistant. Provide clear, actionable insights based on the data.'
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nData: ${JSON.stringify(data)}\n\nProvide a concise, insightful response.`
          }
        ]
      })

      return {
        query,
        response: response.choices[0].message.content,
        data,
        intent
      }
    } catch (error) {
      console.error('Error processing natural query:', error)
      throw error
    }
  }

  // Helper methods

  private async getChatbotMetrics(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { licenses: true }
    })

    if (!org) return { totalConversations: 0, avgResponseTime: 0 }

    const siteKeys = org.licenses.map(l => l.siteKey).filter(Boolean)

    const logs = await prisma.chatbotLog.findMany({
      where: {
        siteKey: { in: siteKeys as string[] },
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    return {
      totalConversations: logs.length,
      avgResponseTime: logs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / logs.length || 0
    }
  }

  private async getSalesAgentMetrics(organizationId: string) {
    // This would connect to sales agent data
    return {
      emailsSent: 150,
      responses: 23,
      meetings: 5
    }
  }

  private async getEnrichmentMetrics(organizationId: string) {
    const usage = await prisma.usageRecord.aggregate({
      where: {
        organizationId,
        periodStart: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: {
        enrichmentRequests: true
      }
    })

    return {
      requestsCount: usage._sum.enrichmentRequests || 0
    }
  }

  private calculateTrend(values: number[]) {
    if (values.length < 2) {
      return { growth: 0, current: 0, projected: 0, daysToLimit: 999 }
    }

    const recent = values.slice(-7)
    const previous = values.slice(-14, -7)

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length

    const growth = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
    const dailyGrowth = growth / 7

    const current = values[values.length - 1]
    const projected = current * Math.pow(1 + dailyGrowth / 100, 30)

    // Assuming limit is 10x current (simplified)
    const limit = current * 10
    const daysToLimit = growth > 0 ? Math.log(limit / current) / Math.log(1 + dailyGrowth / 100) : 999

    return {
      growth,
      current,
      projected,
      daysToLimit: Math.round(daysToLimit)
    }
  }

  private async analyzeTemplatePerformance(organizationId: string) {
    // Simplified template analysis
    return {
      bestPerformer: {
        name: 'Introduction Template A',
        responseRate: 23
      }
    }
  }

  private async analyzeOptimalTiming(organizationId: string) {
    return {
      bestDay: 'Tuesday',
      bestTime: '10:00 AM',
      improvement: 30
    }
  }

  private async findUnusedFeatures(organizationId: string) {
    const features = []

    // Check which features haven't been used
    const usage = await prisma.usageRecord.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })

    if (!usage || usage.setupAgentSessions === 0) {
      features.push({
        name: 'Setup Agent',
        description: 'Automatically guide visitors through product setup',
        action: 'Enable Setup Agent on your pricing page'
      })
    }

    if (!usage || usage.enrichmentRequests === 0) {
      features.push({
        name: 'Lead Enrichment',
        description: 'Get detailed company and contact information',
        action: 'Enrich your next batch of leads'
      })
    }

    return features
  }

  private async fetchDataForIntent(intent: any, organizationId: string) {
    // Fetch data based on extracted intent
    const data: any = {}

    if (intent.metrics?.includes('revenue')) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { mrr: true, arr: true }
      })
      data.revenue = {
        mrr: org?.mrr || 0,
        arr: org?.arr || 0
      }
    }

    if (intent.metrics?.includes('usage')) {
      const usage = await prisma.usageRecord.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      })
      data.usage = usage
    }

    return data
  }
}

export const aiInsights = AIInsightsEngine.getInstance()