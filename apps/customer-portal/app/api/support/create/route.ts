import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Import management agents
import { CommunicationsAgent } from '@intelagent/skills-orchestrator/src/agents/CommunicationsAgent';
import { InfrastructureAgent } from '@intelagent/skills-orchestrator/src/agents/InfrastructureAgent';
import { OperationsAgent } from '@intelagent/skills-orchestrator/src/agents/OperationsAgent';
import { FinanceAgent } from '@intelagent/skills-orchestrator/src/agents/FinanceAgent';
import { SecurityAgent } from '@intelagent/skills-orchestrator/src/agents/SecurityAgent';
import { IntegrationAgent } from '@intelagent/skills-orchestrator/src/agents/IntegrationAgent';

// Agent mapping
const AGENT_MAP = {
  communications: CommunicationsAgent,
  infrastructure: InfrastructureAgent,
  operations: OperationsAgent,
  finance: FinanceAgent,
  security: SecurityAgent,
  integration: IntegrationAgent
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, agent, subject, message, priority, metadata } = body;

    // Generate ticket ID
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get user's license information
    const license = await prisma.licenses.findFirst({
      where: {
        OR: [
          { customer_email: session.user.email },
          { customer_name: session.user.name || '' }
        ],
        status: 'active'
      }
    });

    // Create support record in audit_logs (temporary storage)
    await prisma.audit_logs.create({
      data: {
        entity_type: 'support_ticket',
        entity_id: ticketId,
        action: 'created',
        user_id: session.user.email || 'unknown',
        license_key: license?.license_key || 'unknown',
        metadata: {
          type,
          agent,
          subject,
          message,
          priority,
          status: 'open',
          customer: {
            email: session.user.email,
            name: session.user.name,
            licenseKey: license?.license_key
          },
          ...metadata
        }
      }
    });

    // Route to appropriate management agent
    const AgentClass = AGENT_MAP[agent as keyof typeof AGENT_MAP] || CommunicationsAgent;
    const agentInstance = new AgentClass();

    // Execute support workflow through the agent
    try {
      await agentInstance.execute({
        action: 'handle_support',
        data: {
          ticketId,
          type,
          subject,
          message,
          priority,
          customer: {
            email: session.user.email,
            name: session.user.name,
            licenseKey: license?.license_key
          }
        }
      });

      // For high priority issues, also notify via Communications Agent
      if (priority === 'high' || priority === 'urgent') {
        const commsAgent = new CommunicationsAgent();
        await commsAgent.execute({
          action: 'send_notification',
          data: {
            type: 'urgent_support',
            recipient: 'admin',
            subject: `[${priority.toUpperCase()}] Support: ${subject}`,
            message: `New ${priority} priority support ticket from ${session.user.email}`,
            ticketId
          }
        });
      }
    } catch (agentError) {
      console.error('Agent execution error:', agentError);
      // Continue anyway - ticket is created
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support request submitted successfully',
      assignedAgent: agent,
      expectedResponseTime: getExpectedResponseTime(priority)
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

function getExpectedResponseTime(priority: string): string {
  switch (priority) {
    case 'urgent': return '1 hour';
    case 'high': return '4 hours';
    case 'normal': return '24 hours';
    case 'low': return '48 hours';
    default: return '24 hours';
  }
}