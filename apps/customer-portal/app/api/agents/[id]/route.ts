import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    
    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch agent configuration
    const agent = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        customization_type: 'agent',
        custom_name: agentId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const config = JSON.parse(agent.configuration as string || '{}');

    return NextResponse.json({
      success: true,
      agent: config
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const body = await request.json();
    const { status } = body;
    
    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch agent configuration
    const agent = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        customization_type: 'agent',
        custom_name: agentId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const config = JSON.parse(agent.configuration as string || '{}');
    config.status = status;
    config.updatedAt = new Date().toISOString();

    // Update agent status
    await prisma.product_configurations.update({
      where: { id: agent.id },
      data: {
        configuration: JSON.stringify(config),
        updated_at: new Date()
      }
    });

    // Log audit event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'agent_status_updated',
        skill_id: 'agent_builder',
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          agent_id: agentId,
          new_status: status
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent status updated successfully'
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    
    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find and delete agent
    const agent = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        customization_type: 'agent',
        custom_name: agentId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    await prisma.product_configurations.delete({
      where: { id: agent.id }
    });

    // Log audit event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'agent_deleted',
        skill_id: 'agent_builder',
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          agent_id: agentId
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}