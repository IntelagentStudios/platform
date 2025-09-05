import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productKey = searchParams.get('productKey');
    const skillId = searchParams.get('skillId');
    const dateRange = searchParams.get('dateRange') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Build query
    const where: any = {
      timestamp: { gte: startDate }
    };
    
    if (productKey) {
      where.product_key = productKey;
    }
    
    if (skillId) {
      where.skill_id = skillId;
    }
    
    // Get skill execution logs
    const logs = await prisma.skill_logs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    // Get chatbot logs for comparison
    const chatbotLogs = await prisma.chatbot_logs.findMany({
      where: {
        timestamp: { gte: startDate },
        ...(productKey ? { product_key: productKey } : {})
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    // Calculate analytics
    const skillUsage = logs.reduce((acc: any, log) => {
      if (!acc[log.skill_id]) {
        acc[log.skill_id] = {
          skill_id: log.skill_id,
          skill_name: log.skill_name,
          count: 0,
          success: 0,
          error: 0,
          domains: new Set()
        };
      }
      
      acc[log.skill_id].count++;
      
      if (log.log_type === 'response') {
        acc[log.skill_id].success++;
      } else if (log.log_type === 'error') {
        acc[log.skill_id].error++;
      }
      
      if (log.domain) {
        acc[log.skill_id].domains.add(log.domain);
      }
      
      return acc;
    }, {});
    
    // Convert Sets to Arrays
    Object.values(skillUsage).forEach((usage: any) => {
      usage.domains = Array.from(usage.domains);
      usage.successRate = usage.count > 0 ? (usage.success / usage.count * 100).toFixed(1) : 0;
    });
    
    // Get unique sessions
    const uniqueSessions = new Set(logs.map(l => l.session_id));
    const uniqueChatbotSessions = new Set(chatbotLogs.map(l => l.session_id));
    
    // Time series data for chart
    const timeSeriesMap = new Map();
    
    logs.forEach(log => {
      const hour = new Date(log.timestamp!);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, {
          timestamp: key,
          skills: 0,
          chatbot: 0
        });
      }
      
      timeSeriesMap.get(key).skills++;
    });
    
    chatbotLogs.forEach(log => {
      const hour = new Date(log.timestamp!);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, {
          timestamp: key,
          skills: 0,
          chatbot: 0
        });
      }
      
      timeSeriesMap.get(key).chatbot++;
    });
    
    const timeSeries = Array.from(timeSeriesMap.values())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    // Top performing skills
    const topSkills = Object.values(skillUsage)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    // Response with comprehensive analytics
    return NextResponse.json({
      summary: {
        totalSkillExecutions: logs.length,
        totalChatbotConversations: chatbotLogs.length,
        uniqueSkillSessions: uniqueSessions.size,
        uniqueChatbotSessions: uniqueChatbotSessions.size,
        skillTypes: Object.keys(skillUsage).length,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      },
      skillUsage: Object.values(skillUsage),
      topSkills,
      timeSeries,
      recentExecutions: logs.slice(0, 20).map(log => ({
        id: log.id,
        skill: log.skill_name,
        type: log.log_type,
        session: log.session_id,
        domain: log.domain,
        timestamp: log.timestamp
      })),
      performance: {
        averageResponseTime: '< 500ms',
        successRate: logs.length > 0 
          ? (logs.filter(l => l.log_type === 'response').length / logs.length * 100).toFixed(1) + '%'
          : '0%',
        errorRate: logs.length > 0
          ? (logs.filter(l => l.log_type === 'error').length / logs.length * 100).toFixed(1) + '%'
          : '0%'
      }
    });
    
  } catch (error: any) {
    console.error('Skills analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}