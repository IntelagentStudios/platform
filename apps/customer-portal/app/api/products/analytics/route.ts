import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Get product from query params
  const { searchParams } = new URL(request.url);
  const product = searchParams.get('product') || 'chatbot';

  // Generate sample analytics data
  // In production, this would fetch from database
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
}