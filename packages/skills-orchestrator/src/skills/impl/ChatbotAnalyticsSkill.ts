/**
 * Chatbot Analytics Skill
 * Manages analytics, metrics, and conversation tracking for chatbots
 * Part of the management team that oversees chatbot operations
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { prisma } from '@intelagent/database';

interface ConversationStats {
  totalConversations: number;
  uniqueSessions: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  domains: string[];
  todayConversations: number;
  weekConversations: number;
  monthConversations: number;
}

interface ConversationAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  resolution: boolean;
  duration: number;
  messageCount: number;
}

export class ChatbotAnalyticsSkill extends BaseSkill {
  metadata = {
    id: 'chatbot_analytics',
    name: 'Chatbot Analytics Manager',
    description: 'Tracks, analyzes, and reports on chatbot conversations and performance metrics',
    category: SkillCategory.ANALYTICS,
    version: '1.0.0',
    author: 'Intelagent Management Team',
    tags: ['chatbot', 'analytics', 'metrics', 'reporting', 'management']
  };

  validate(params: SkillParams): boolean {
    const validActions = [
      'get_stats',
      'analyze_conversation',
      'generate_report',
      'track_event',
      'get_conversations',
      'analyze_performance',
      'export_data'
    ];
    
    return params.action && validActions.includes(params.action);
  }

  async doExecute(params: SkillParams): Promise<SkillResult> {
    const { action, productKey, licenseKey, timeRange = '7d', conversationId } = params;

    try {
      switch (action) {
        case 'get_stats':
          return await this.getStats(productKey || licenseKey, timeRange);
        
        case 'analyze_conversation':
          return await this.analyzeConversation(conversationId);
        
        case 'generate_report':
          return await this.generateReport(productKey || licenseKey, timeRange);
        
        case 'track_event':
          return await this.trackEvent(params);
        
        case 'get_conversations':
          return await this.getConversations(productKey || licenseKey, params);
        
        case 'analyze_performance':
          return await this.analyzePerformance(productKey || licenseKey, timeRange);
        
        case 'export_data':
          return await this.exportData(productKey || licenseKey, params);
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] Error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Analytics operation failed'
      };
    }
  }

  private async getStats(identifier: string, timeRange: string): Promise<SkillResult> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = this.calculateStartDate(timeRange);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - 1);

      // Get all conversations for the product key or license
      const conversations = await prisma.chatbot_logs.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Calculate statistics
      const stats: ConversationStats = {
        totalConversations: conversations.length,
        uniqueSessions: new Set(conversations.map(c => c.session_id)).size,
        totalMessages: conversations.reduce((sum, c) => {
          const messages = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages;
          return sum + (Array.isArray(messages) ? messages.length : 0);
        }, 0),
        avgMessagesPerConversation: 0,
        domains: [...new Set(conversations.map(c => c.domain).filter(Boolean))],
        todayConversations: conversations.filter(c => new Date(c.created_at) >= todayStart).length,
        weekConversations: conversations.filter(c => new Date(c.created_at) >= weekStart).length,
        monthConversations: conversations.filter(c => new Date(c.created_at) >= monthStart).length
      };

      stats.avgMessagesPerConversation = stats.totalConversations > 0 
        ? Math.round(stats.totalMessages / stats.totalConversations)
        : 0;

      // Store analytics in skill execution for tracking
      await this.logInsight({
        type: 'analytics_snapshot',
        data: stats,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          stats,
          timeRange,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] getStats error:', error);
      throw error;
    }
  }

  private async analyzeConversation(conversationId: string): Promise<SkillResult> {
    try {
      const conversation = await prisma.chatbot_logs.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) {
        return {
          success: false,
          data: null,
          error: 'Conversation not found'
        };
      }

      const messages = typeof conversation.messages === 'string' 
        ? JSON.parse(conversation.messages) 
        : conversation.messages;

      // Analyze the conversation
      const analysis: ConversationAnalysis = {
        sentiment: this.analyzeSentiment(messages),
        topics: this.extractTopics(messages),
        resolution: this.checkResolution(messages),
        duration: this.calculateDuration(conversation),
        messageCount: messages.length
      };

      // Store the analysis
      await this.logInsight({
        type: 'conversation_analysis',
        conversationId,
        analysis,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          conversation,
          analysis
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] analyzeConversation error:', error);
      throw error;
    }
  }

  private async generateReport(identifier: string, timeRange: string): Promise<SkillResult> {
    try {
      // Get comprehensive stats
      const statsResult = await this.getStats(identifier, timeRange);
      const stats = statsResult.data.stats;

      // Get top conversations
      const conversations = await prisma.chatbot_logs.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ]
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      // Analyze patterns
      const patterns = {
        peakHours: this.findPeakHours(conversations),
        commonTopics: this.findCommonTopics(conversations),
        averageResponseTime: this.calculateAverageResponseTime(conversations),
        resolutionRate: this.calculateResolutionRate(conversations)
      };

      // Generate insights
      const insights = this.generateInsights(stats, patterns);

      const report = {
        summary: stats,
        patterns,
        insights,
        topConversations: conversations.slice(0, 5),
        recommendations: this.generateRecommendations(stats, patterns),
        generatedAt: new Date()
      };

      // Store the report
      await this.logInsight({
        type: 'performance_report',
        report,
        timestamp: new Date()
      });

      return {
        success: true,
        data: report
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] generateReport error:', error);
      throw error;
    }
  }

  private async trackEvent(params: SkillParams): Promise<SkillResult> {
    try {
      const { eventType, eventData, productKey, sessionId } = params;

      // Store the event
      const event = {
        type: eventType,
        data: eventData,
        product_key: productKey,
        session_id: sessionId,
        timestamp: new Date()
      };

      await this.logInsight(event);

      // Process real-time alerts if needed
      if (this.shouldTriggerAlert(eventType, eventData)) {
        await this.triggerAlert(event);
      }

      return {
        success: true,
        data: {
          event,
          tracked: true
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] trackEvent error:', error);
      throw error;
    }
  }

  private async getConversations(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        sortBy = 'created_at', 
        sortOrder = 'desc',
        filter = {}
      } = params;

      const where: any = {
        OR: [
          { product_key: identifier },
          { license_key: identifier }
        ]
      };

      // Apply filters
      if (filter.domain) {
        where.domain = filter.domain;
      }
      if (filter.sessionId) {
        where.session_id = filter.sessionId;
      }
      if (filter.dateFrom || filter.dateTo) {
        where.created_at = {};
        if (filter.dateFrom) where.created_at.gte = new Date(filter.dateFrom);
        if (filter.dateTo) where.created_at.lte = new Date(filter.dateTo);
      }

      const conversations = await prisma.chatbot_logs.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      });

      const total = await prisma.chatbot_logs.count({ where });

      return {
        success: true,
        data: {
          conversations,
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] getConversations error:', error);
      throw error;
    }
  }

  private async analyzePerformance(identifier: string, timeRange: string): Promise<SkillResult> {
    try {
      const endDate = new Date();
      const startDate = this.calculateStartDate(timeRange);

      // Get skill executions for chatbot
      const executions = await prisma.skill_executions.findMany({
        where: {
          skill_id: { in: ['chatbot', 'website_chatbot'] },
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Calculate performance metrics
      const performance = {
        totalExecutions: executions.length,
        successRate: this.calculateSuccessRate(executions),
        averageExecutionTime: this.calculateAverageExecutionTime(executions),
        errorRate: this.calculateErrorRate(executions),
        throughput: this.calculateThroughput(executions, startDate, endDate),
        reliability: this.calculateReliability(executions),
        trends: this.analyzeTrends(executions)
      };

      return {
        success: true,
        data: {
          performance,
          timeRange,
          analyzedAt: new Date()
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] analyzePerformance error:', error);
      throw error;
    }
  }

  private async exportData(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { format = 'json', includeAnalytics = true } = params;

      // Get all data
      const conversations = await prisma.chatbot_logs.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ]
        },
        orderBy: { created_at: 'desc' }
      });

      let exportData: any = {
        conversations,
        exportedAt: new Date(),
        totalRecords: conversations.length
      };

      if (includeAnalytics) {
        const statsResult = await this.getStats(identifier, '30d');
        exportData.analytics = statsResult.data;
      }

      // Format the data based on requested format
      let formattedData;
      switch (format) {
        case 'csv':
          formattedData = this.convertToCSV(exportData);
          break;
        case 'json':
        default:
          formattedData = JSON.stringify(exportData, null, 2);
          break;
      }

      return {
        success: true,
        data: {
          format,
          data: formattedData,
          recordCount: conversations.length
        }
      };
    } catch (error) {
      console.error('[ChatbotAnalyticsSkill] exportData error:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateStartDate(timeRange: string): Date {
    const date = new Date();
    const value = parseInt(timeRange);
    const unit = timeRange.slice(-1);

    switch (unit) {
      case 'd':
        date.setDate(date.getDate() - value);
        break;
      case 'w':
        date.setDate(date.getDate() - (value * 7));
        break;
      case 'm':
        date.setMonth(date.getMonth() - value);
        break;
      case 'y':
        date.setFullYear(date.getFullYear() - value);
        break;
    }

    return date;
  }

  private analyzeSentiment(messages: any[]): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['thank', 'great', 'excellent', 'good', 'helpful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'useless', 'worst'];
    
    let positiveCount = 0;
    let negativeCount = 0;

    messages.forEach(msg => {
      const content = msg.content?.toLowerCase() || '';
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractTopics(messages: any[]): string[] {
    // Extract main topics from conversation
    const topics = new Set<string>();
    const keywords = ['product', 'pricing', 'support', 'feature', 'help', 'issue', 'question'];
    
    messages.forEach(msg => {
      const content = msg.content?.toLowerCase() || '';
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  private checkResolution(messages: any[]): boolean {
    // Check if conversation was resolved
    if (messages.length === 0) return false;
    
    const lastMessage = messages[messages.length - 1];
    const resolutionIndicators = ['resolved', 'fixed', 'solved', 'thank you', 'thanks', 'perfect'];
    
    return resolutionIndicators.some(indicator => 
      lastMessage.content?.toLowerCase().includes(indicator)
    );
  }

  private calculateDuration(conversation: any): number {
    const messages = typeof conversation.messages === 'string' 
      ? JSON.parse(conversation.messages) 
      : conversation.messages;
    
    if (!messages || messages.length < 2) return 0;
    
    const firstTime = new Date(messages[0].timestamp || conversation.created_at);
    const lastTime = new Date(messages[messages.length - 1].timestamp || conversation.updated_at);
    
    return Math.round((lastTime.getTime() - firstTime.getTime()) / 1000); // Duration in seconds
  }

  private findPeakHours(conversations: any[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    conversations.forEach(conv => {
      const hour = new Date(conv.created_at).getHours();
      hourCounts[hour]++;
    });
    
    // Find top 3 peak hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private findCommonTopics(conversations: any[]): string[] {
    const topicCounts = new Map<string, number>();
    
    conversations.forEach(conv => {
      const messages = typeof conv.messages === 'string' 
        ? JSON.parse(conv.messages) 
        : conv.messages;
      
      const topics = this.extractTopics(messages);
      topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateAverageResponseTime(conversations: any[]): number {
    // Placeholder - would need actual response time tracking
    return 2.5; // seconds
  }

  private calculateResolutionRate(conversations: any[]): number {
    if (conversations.length === 0) return 0;
    
    const resolved = conversations.filter(conv => {
      const messages = typeof conv.messages === 'string' 
        ? JSON.parse(conv.messages) 
        : conv.messages;
      return this.checkResolution(messages);
    });
    
    return Math.round((resolved.length / conversations.length) * 100);
  }

  private generateInsights(stats: ConversationStats, patterns: any): string[] {
    const insights = [];
    
    if (stats.todayConversations > stats.totalConversations / 7) {
      insights.push('Higher than average activity today');
    }
    
    if (patterns.resolutionRate < 70) {
      insights.push('Resolution rate could be improved');
    }
    
    if (patterns.peakHours.length > 0) {
      insights.push(`Peak activity hours: ${patterns.peakHours.join(', ')}`);
    }
    
    if (stats.avgMessagesPerConversation > 10) {
      insights.push('Conversations are longer than typical - consider improving bot responses');
    }
    
    return insights;
  }

  private generateRecommendations(stats: ConversationStats, patterns: any): string[] {
    const recommendations = [];
    
    if (patterns.resolutionRate < 70) {
      recommendations.push('Train the chatbot on unresolved conversation patterns');
    }
    
    if (stats.avgMessagesPerConversation > 10) {
      recommendations.push('Optimize chatbot responses for quicker resolution');
    }
    
    if (patterns.commonTopics.includes('pricing')) {
      recommendations.push('Add more detailed pricing information to chatbot knowledge');
    }
    
    return recommendations;
  }

  private shouldTriggerAlert(eventType: string, eventData: any): boolean {
    // Define alert conditions
    const alertConditions = [
      'error_rate_high',
      'response_time_slow',
      'conversation_abandoned',
      'negative_feedback'
    ];
    
    return alertConditions.includes(eventType);
  }

  private async triggerAlert(event: any): Promise<void> {
    // Send alert to management team
    console.log('[ChatbotAnalyticsSkill] Alert triggered:', event);
    // Could integrate with notification system here
  }

  private calculateSuccessRate(executions: any[]): number {
    if (executions.length === 0) return 0;
    const successful = executions.filter(e => e.status === 'completed').length;
    return Math.round((successful / executions.length) * 100);
  }

  private calculateErrorRate(executions: any[]): number {
    if (executions.length === 0) return 0;
    const errors = executions.filter(e => e.status === 'failed').length;
    return Math.round((errors / executions.length) * 100);
  }

  private calculateAverageExecutionTime(executions: any[]): number {
    if (executions.length === 0) return 0;
    const total = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    return Math.round(total / executions.length);
  }

  private calculateThroughput(executions: any[], startDate: Date, endDate: Date): number {
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return Math.round(executions.length / durationHours);
  }

  private calculateReliability(executions: any[]): number {
    // Reliability score based on success rate and consistency
    const successRate = this.calculateSuccessRate(executions);
    const errorRate = this.calculateErrorRate(executions);
    return Math.round(successRate * (1 - errorRate / 100));
  }

  private analyzeTrends(executions: any[]): any {
    // Analyze trends over time
    return {
      improving: true, // Placeholder
      averageGrowth: 5 // Percentage
    };
  }

  private convertToCSV(data: any): string {
    // Convert JSON data to CSV format
    const conversations = data.conversations;
    if (!conversations || conversations.length === 0) return '';
    
    const headers = ['ID', 'Session ID', 'Domain', 'Created At', 'Message Count'];
    const rows = conversations.map(conv => {
      const messages = typeof conv.messages === 'string' 
        ? JSON.parse(conv.messages) 
        : conv.messages;
      return [
        conv.id,
        conv.session_id,
        conv.domain,
        conv.created_at,
        messages.length
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
}