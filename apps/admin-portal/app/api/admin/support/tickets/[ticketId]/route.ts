import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;
    const body = await request.json();
    const { status } = body;

    // TODO: Implement proper ticket management once support_tickets table is available
    // For now, return mock response
    const ticket = {
      id: ticketId,
      entity_type: 'support_ticket',
      entity_id: ticketId,
      metadata: {
        status: 'pending'
      }
    };

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update the ticket status (mock)
    const metadata = ticket.metadata as any;
    metadata.status = status;
    metadata.lastUpdated = new Date().toISOString();

    // TODO: Update ticket in database once support_tickets table is available
    // await prisma.audit_logs.update({
    //   where: { id: ticket.id },
    //   data: { metadata }
    // });

    // TODO: Log status change once audit_logs table is available
    // await prisma.audit_logs.create({
    //   data: {
    //     entity_type: 'ticket_status_change',
    //     entity_id: ticketId,
    //     action: `status_changed_to_${status}`,
    //     user_id: 'admin',
    //     license_key: metadata.customer?.licenseKey || 'unknown',
    //     metadata: {
    //       previousStatus: ticket.metadata?.status || 'open',
    //       newStatus: status,
    //       timestamp: new Date().toISOString()
    //     }
    //   }
    // });

    // If resolved or closed, trigger notification to customer
    if (status === 'resolved' || status === 'closed') {
      // This would trigger the Communications Agent in production
      console.log(`Notifying customer about ticket ${ticketId} status: ${status}`);
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketId} updated to ${status}`,
      ticket: {
        ticketId,
        status,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}