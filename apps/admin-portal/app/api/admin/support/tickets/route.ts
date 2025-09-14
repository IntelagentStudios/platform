import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch support tickets from audit_logs (temporary storage)
    const tickets = await prisma.audit_logs.findMany({
      where: {
        entity_type: 'support_ticket'
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100
    });

    // Transform audit logs into ticket format
    const formattedTickets = tickets.map(log => {
      const metadata = log.metadata as any;
      return {
        id: log.id,
        ticketId: log.entity_id,
        type: metadata.type || 'general',
        agent: metadata.agent || 'communications',
        subject: metadata.subject || 'No subject',
        message: metadata.message || '',
        priority: metadata.priority || 'normal',
        status: metadata.status || 'open',
        customer: metadata.customer || {
          email: log.user_id,
          name: 'Unknown',
          licenseKey: log.license_key
        },
        createdAt: log.created_at,
        updatedAt: log.created_at
      };
    });

    // Get agent status for each ticket
    const agentStatuses = await Promise.all(
      formattedTickets.map(async (ticket) => {
        try {
          // Check if agent is actively working on ticket
          const recentActivity = await prisma.audit_logs.findFirst({
            where: {
              entity_type: 'agent_activity',
              entity_id: ticket.ticketId,
              created_at: {
                gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
              }
            }
          });
          return {
            ticketId: ticket.ticketId,
            agentActive: !!recentActivity
          };
        } catch {
          return { ticketId: ticket.ticketId, agentActive: false };
        }
      })
    );

    // Merge agent status with tickets
    const ticketsWithStatus = formattedTickets.map(ticket => {
      const status = agentStatuses.find(s => s.ticketId === ticket.ticketId);
      return {
        ...ticket,
        agentActive: status?.agentActive || false
      };
    });

    return NextResponse.json({
      success: true,
      tickets: ticketsWithStatus,
      stats: {
        total: ticketsWithStatus.length,
        open: ticketsWithStatus.filter(t => t.status === 'open').length,
        inProgress: ticketsWithStatus.filter(t => t.status === 'in-progress').length,
        resolved: ticketsWithStatus.filter(t => t.status === 'resolved').length,
        closed: ticketsWithStatus.filter(t => t.status === 'closed').length
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}