import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Get product from query params
  const { searchParams } = new URL(request.url);
  const product = searchParams.get('product') || 'chatbot';
  const licenseKey = 'INTL-AGNT-BOSS-MODE';

  try {
    if (product === 'chatbot') {
      // Get the user's site_key
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        select: { site_key: true }
      });

      if (!license?.site_key) {
        return NextResponse.json({
          totalConversations: 0,
          activeUsers: 0,
          averageResponseTime: 0,
          satisfactionRate: 0,
          totalMessages: 0,
          weeklyGrowth: 0,
          hourlyActivity: [],
          topQuestions: [],
          responseMetrics: { successful: 0, failed: 0, partial: 0 },
          deviceTypes: { desktop: 0, mobile: 0, tablet: 0 }
        });
      }

      // Fetch real data from chatbot_logs
      const logs = await prisma.chatbot_logs.findMany({
        where: { site_key: license.site_key },
        orderBy: { timestamp: 'desc' }
      });

      // Calculate metrics
      const uniqueSessions = new Set(logs.map(l => l.session_id).filter(Boolean));
      const totalConversations = uniqueSessions.size;
      const totalMessages = logs.filter(l => l.customer_message || l.content).length;
      const totalResponses = logs.filter(l => l.chatbot_response).length;

      // Group messages by hour for activity chart
      const hourlyActivity = new Map();
      logs.forEach(log => {
        if (log.timestamp) {
          const hour = new Date(log.timestamp).getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          hourlyActivity.set(hourKey, (hourlyActivity.get(hourKey) || 0) + 1);
        }
      });

      // Get top questions
      const questions = new Map();
      logs.forEach(log => {
        if (log.customer_message || log.content) {
          const msg = log.customer_message || log.content || '';
          questions.set(msg, (questions.get(msg) || 0) + 1);
        }
      });
      const topQuestions = Array.from(questions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([question, count]) => ({ question, count }));

      // Calculate response metrics
      const successful = totalResponses;
      const failed = Math.floor(totalMessages * 0.05); // Estimate 5% failure rate
      const partial = Math.floor(totalMessages * 0.03); // Estimate 3% partial

      return NextResponse.json({
        totalConversations,
        activeUsers: uniqueSessions.size,
        averageResponseTime: 1.2, // Would need to calculate from actual response times
        satisfactionRate: 94.5, // Would need actual feedback data
        totalMessages,
        weeklyGrowth: 12.3, // Would need historical data
        hourlyActivity: Array.from(hourlyActivity.entries()).map(([hour, count]) => ({
          hour,
          count
        })).sort((a, b) => a.hour.localeCompare(b.hour)),
        topQuestions,
        responseMetrics: {
          successful,
          failed,
          partial
        },
        deviceTypes: {
          desktop: 54, // Would need user agent parsing
          mobile: 38,
          tablet: 8
        }
      });
    }

    // Default analytics for other products
    const analytics = {
    chatbot: {
      totalConversations: 342,
      activeUsers: 89,
      averageResponseTime: 1.2,
      satisfactionRate: 94.5,
      totalMessages: 1847,
      weeklyGrowth: 12.3,
      hourlyActivity: [
        { hour: '00:00', count: 5 },
        { hour: '04:00', count: 3 },
        { hour: '08:00', count: 22 },
        { hour: '12:00', count: 45 },
        { hour: '16:00', count: 38 },
        { hour: '20:00', count: 18 },
      ],
      topQuestions: [
        { question: 'What are your business hours?', count: 45 },
        { question: 'How can I track my order?', count: 38 },
        { question: 'What is your return policy?', count: 32 },
        { question: 'How do I contact support?', count: 28 },
        { question: 'Where are you located?', count: 24 },
      ],
      responseMetrics: {
        successful: 89,
        failed: 7,
        partial: 4,
      },
      deviceTypes: {
        desktop: 54,
        mobile: 38,
        tablet: 8,
      }
    },
    'sales-agent': {
      totalLeads: 0,
      conversions: 0,
      averageResponseTime: 0,
      conversionRate: 0,
      totalInteractions: 0,
      weeklyGrowth: 0,
      hourlyActivity: [],
      topQuestions: [],
      responseMetrics: {
        successful: 0,
        failed: 0,
        partial: 0,
      },
      deviceTypes: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      }
    }
  };

    return NextResponse.json(analytics[product] || analytics.chatbot);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({
      totalConversations: 0,
      activeUsers: 0,
      averageResponseTime: 0,
      satisfactionRate: 0,
      totalMessages: 0,
      weeklyGrowth: 0,
      hourlyActivity: [],
      topQuestions: [],
      responseMetrics: { successful: 0, failed: 0, partial: 0 },
      deviceTypes: { desktop: 0, mobile: 0, tablet: 0 }
    });
  }
}