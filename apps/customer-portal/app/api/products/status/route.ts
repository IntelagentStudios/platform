import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated || !authResult.licenseKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { licenseKey } = authResult;

    // Get license and user details
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Get the user associated with this license
    const user = await prisma.users.findUnique({
      where: { license_key: licenseKey }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found for license' },
        { status: 404 }
      );
    }

    // Get setup status for each product
    const productSetups = await prisma.product_setups.findMany({
      where: { user_id: user.id }
    });

    // Map setup status by product
    const setupStatus: Record<string, any> = {};
    const purchasedProducts = license.products || [];

    for (const productId of purchasedProducts) {
      const setup = productSetups.find(s => s.product === productId);
      
      if (setup) {
        setupStatus[productId] = {
          isComplete: setup.setup_completed,
          inProgress: !setup.setup_completed && setup.setup_data != null,
          progress: calculateSetupProgress(productId, setup.setup_data),
          completedAt: setup.setup_completed_at,
          usage: await getProductUsage(licenseKey, productId)
        };
      } else {
        setupStatus[productId] = {
          isComplete: false,
          inProgress: false,
          progress: 0,
          usage: null
        };
      }
    }

    return NextResponse.json(setupStatus);

  } catch (error) {
    console.error('Product status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product status' },
      { status: 500 }
    );
  }
}

// Calculate setup progress based on product type and data
function calculateSetupProgress(productId: string, setupData: any): number {
  if (!setupData) return 0;

  const data = typeof setupData === 'string' ? JSON.parse(setupData) : setupData;
  if (!data) return 0;

  switch (productId) {
    case 'chatbot':
      // Chatbot has 5 steps
      const steps = ['domain', 'colors', 'position', 'welcomeMessage', 'embedCode'];
      const completed = steps.filter(step => data[step] != null).length;
      return Math.round((completed / steps.length) * 100);

    case 'sales-agent':
      // Sales agent setup steps
      const salesSteps = ['company', 'targets', 'messaging', 'integration'];
      const salesCompleted = salesSteps.filter(step => data[step] != null).length;
      return Math.round((salesCompleted / salesSteps.length) * 100);

    case 'enrichment':
      // Enrichment setup steps
      const enrichSteps = ['dataSource', 'fields', 'apiKey'];
      const enrichCompleted = enrichSteps.filter(step => data[step] != null).length;
      return Math.round((enrichCompleted / enrichSteps.length) * 100);

    case 'setup-agent':
      // Setup agent configuration
      const agentSteps = ['workflow', 'fields', 'validation'];
      const agentCompleted = agentSteps.filter(step => data[step] != null).length;
      return Math.round((agentCompleted / agentSteps.length) * 100);

    default:
      return 0;
  }
}

// Get product usage statistics
async function getProductUsage(licenseKey: string, productId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (productId) {
    case 'chatbot':
      const chatbotLogs = await prisma.chatbot_logs.count({
        where: {
          license_key: licenseKey,
          created_at: { gte: startOfMonth }
        }
      });
      return {
        current: chatbotLogs,
        limit: 10000,
        unit: 'conversations'
      };

    case 'sales-agent':
      // Count sales activities
      const salesEvents = await prisma.usage_events.count({
        where: {
          license_key: licenseKey,
          event_type: 'sales_outreach',
          created_at: { gte: startOfMonth }
        }
      });
      return {
        current: salesEvents,
        limit: 5000,
        unit: 'leads'
      };

    case 'enrichment':
      // Count enrichment requests
      const enrichmentEvents = await prisma.usage_events.count({
        where: {
          license_key: licenseKey,
          event_type: 'data_enrichment',
          created_at: { gte: startOfMonth }
        }
      });
      return {
        current: enrichmentEvents,
        limit: 1000,
        unit: 'enrichments'
      };

    case 'setup-agent':
      // Count setup sessions
      const setupEvents = await prisma.usage_events.count({
        where: {
          license_key: licenseKey,
          event_type: 'setup_session',
          created_at: { gte: startOfMonth }
        }
      });
      return {
        current: setupEvents,
        limit: 100,
        unit: 'sessions'
      };

    default:
      return null;
  }
}