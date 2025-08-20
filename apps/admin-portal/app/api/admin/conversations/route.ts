import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';

// GET /api/admin/conversations - Fetch all conversations across deployments
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Master sees all, clients see filtered
    const isMaster = auth.isMaster;
    
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const timeRange = searchParams.get('timeRange') || 'today';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Calculate time filter
    let timeFilter = {};
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        timeFilter = { timestamp: { gte: startOfDay } };
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        timeFilter = { timestamp: { gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        timeFilter = { timestamp: { gte: monthAgo } };
        break;
    }

    // Build where clause
    const where: any = {
      ...timeFilter
    };

    // If not master, filter by site_key
    if (!isMaster) {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: auth.license_key },
        select: { site_key: true }
      });
      
      if (!userLicense?.site_key) {
        return NextResponse.json({ conversations: [] });
      }
      
      where.site_key = userLicense.site_key;
    }

    // Filter by domain if specified
    if (domain && domain !== 'all') {
      where.domain = domain;
    }

    // Fetch conversations with license info
    const conversations = await prisma.chatbot_logs.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        session_id: true,
        domain: true,
        customer_message: true,
        chatbot_response: true,
        content: true,
        role: true,
        timestamp: true,
        conversation_id: true,
        site_key: true,
        licenses: {
          select: {
            domain: true,
            customer_name: true,
            plan: true
          }
        }
      }
    });

    // Group by session for better presentation
    const sessionMap = new Map();
    
    conversations.forEach(log => {
      const sessionId = log.session_id || log.conversation_id || log.id;
      
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          session_id: sessionId,
          domain: log.domain || log.licenses?.domain || 'Unknown',
          customer_name: log.licenses?.customer_name,
          plan: log.licenses?.plan || 'free',
          messages: [],
          startTime: log.timestamp,
          lastActivity: log.timestamp,
          messageCount: 0
        });
      }
      
      const session = sessionMap.get(sessionId);
      
      // Add message to session
      if (log.customer_message || log.chatbot_response || log.content) {
        session.messages.push({
          id: log.id,
          role: log.role || (log.customer_message ? 'user' : 'assistant'),
          content: log.content || log.customer_message || log.chatbot_response,
          timestamp: log.timestamp
        });
        session.messageCount++;
      }
      
      // Update session times
      if (log.timestamp && session.lastActivity && log.timestamp > session.lastActivity) {
        session.lastActivity = log.timestamp;
      }
      if (log.timestamp && session.startTime && log.timestamp < session.startTime) {
        session.startTime = log.timestamp;
      }
    });

    // Get unique domains for filter dropdown
    const domains = isMaster ? await prisma.licenses.findMany({
      where: { site_key: { not: null } },
      select: { domain: true },
      distinct: ['domain']
    }) : [];

    const formattedSessions = Array.from(sessionMap.values())
      .sort((a, b) => (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0))
      .slice(0, 20); // Limit to 20 most recent sessions

    return NextResponse.json({
      conversations: formattedSessions,
      domains: domains.map(d => d.domain).filter(Boolean),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}