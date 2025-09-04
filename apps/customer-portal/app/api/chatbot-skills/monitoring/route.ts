import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Monitoring endpoint for the chatbot skills API
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1h'; // 1h, 24h, 7d
    const detailed = searchParams.get('detailed') === 'true';
    
    // Calculate time range
    const now = new Date();
    let since = new Date();
    
    switch(period) {
      case '1h':
        since.setHours(since.getHours() - 1);
        break;
      case '24h':
        since.setHours(since.getHours() - 24);
        break;
      case '7d':
        since.setDate(since.getDate() - 7);
        break;
      default:
        since.setHours(since.getHours() - 1);
    }
    
    // Get metrics from database
    const conversations = await prisma.chatbot_logs.findMany({
      where: {
        timestamp: {
          gte: since
        }
      },
      select: {
        id: true,
        product_key: true,
        customer_message: true,
        chatbot_response: true,
        intent_detected: true,
        timestamp: true,
        session_id: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: detailed ? 100 : 10
    });
    
    // Calculate statistics
    const totalRequests = conversations.length;
    // Since we don't have error field in chatbot_logs, count empty responses as failures
    const failedRequests = conversations.filter(c => !c.chatbot_response || c.chatbot_response === '').length;
    const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2) : '100';
    
    // Calculate average response time from intent_detected JSON
    const responseTimes = conversations
      .map(c => {
        try {
          if (c.intent_detected) {
            const meta = JSON.parse(c.intent_detected);
            return meta?.responseTime || meta?.executionTime || 0;
          }
          return 0;
        } catch {
          return 0;
        }
      })
      .filter(t => t > 0);
    
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    // Group by product key
    const byProductKey: Record<string, number> = {};
    conversations.forEach(c => {
      if (c.product_key) {
        byProductKey[c.product_key] = (byProductKey[c.product_key] || 0) + 1;
      }
    });
    
    // Get unique sessions count
    const uniqueSessions = new Set(conversations.map(c => {
      return c.session_id || 'unknown';
    })).size;
    
    // Check system health
    const healthChecks = {
      database: 'healthy',
      skillsApi: 'healthy',
      responseTime: avgResponseTime < 1000 ? 'healthy' : avgResponseTime < 3000 ? 'degraded' : 'unhealthy'
    };
    
    // Overall health status
    const overallHealth = Object.values(healthChecks).includes('unhealthy') ? 'unhealthy' :
                         Object.values(healthChecks).includes('degraded') ? 'degraded' : 'healthy';
    
    const response = {
      status: overallHealth,
      timestamp: new Date().toISOString(),
      period: period,
      metrics: {
        totalRequests,
        successRate: parseFloat(successRate),
        failedRequests,
        avgResponseTime: `${avgResponseTime}ms`,
        uniqueSessions,
        requestsByProductKey: byProductKey
      },
      health: healthChecks,
      performance: {
        monitoringResponseTime: `${Date.now() - startTime}ms`
      }
    };
    
    // Add recent errors if detailed view requested
    if (detailed) {
      // Since we don't have error field, filter by empty responses
      const recentErrors = conversations
        .filter(c => !c.chatbot_response || c.chatbot_response === '')
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          time: c.timestamp,
          error: 'No response generated',
          message: c.customer_message
        }));
      
      response['recentErrors'] = recentErrors;
      
      // Add recent conversations sample
      response['recentConversations'] = conversations.slice(0, 5).map(c => ({
        id: c.id,
        time: c.timestamp,
        userMessage: c.customer_message?.substring(0, 50) + '...',
        responsePreview: c.chatbot_response?.substring(0, 50) + '...',
        productKey: c.product_key
      }));
    }
    
    // Set cache headers
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    };
    
    return NextResponse.json(response, { 
      status: 200,
      headers 
    });
    
  } catch (error) {
    console.error('Monitoring endpoint error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Failed to fetch monitoring data',
      health: {
        database: 'unhealthy',
        skillsApi: 'unknown',
        responseTime: 'unknown'
      }
    }, { status: 500 });
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    // Quick health check - just verify database connection
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}