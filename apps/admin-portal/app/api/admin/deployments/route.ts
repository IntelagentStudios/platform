import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthFromCookies } from '@/lib/auth';

// GET /api/admin/deployments - List all chatbot deployments (licenses with site_keys)
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only master can see all deployments
    if (!auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    const where: any = {
      site_key: { not: null } // Only licenses with deployed chatbots
    };
    
    if (domain) where.domain = { contains: domain };
    if (status) where.status = status;
    if (plan) where.plan = plan;

    // Get all licenses with chatbot deployments
    const deployments = await prisma.licenses.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        license_key: true,
        site_key: true,
        domain: true,
        status: true,
        plan: true,
        created_at: true,
        used_at: true,
        last_indexed: true,
        customer_name: true,
        email: true,
        products: true,
        _count: {
          select: {
            chatbot_logs: true
          }
        }
      }
    });

    // Get message counts and session stats for each deployment
    const deploymentsWithStats = await Promise.all(
      deployments.map(async (deployment) => {
        // Get message count for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyMessages = await prisma.chatbot_logs.count({
          where: {
            site_key: deployment.site_key!,
            timestamp: { gte: startOfMonth }
          }
        });

        // Get unique sessions count
        const sessions = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            site_key: deployment.site_key!
          }
        });

        // Calculate revenue based on plan
        let monthlyRevenue = 0;
        if (deployment.plan === 'pro') monthlyRevenue = 49;
        if (deployment.plan === 'enterprise') monthlyRevenue = 299;

        return {
          id: deployment.license_key,
          domain: deployment.domain || 'Unknown',
          licenseKey: deployment.license_key,
          siteKey: deployment.site_key,
          status: deployment.status || 'active',
          plan: deployment.plan || 'free',
          createdAt: deployment.created_at,
          lastActive: deployment.used_at || deployment.created_at,
          messageCount: deployment._count.chatbot_logs,
          sessionCount: sessions.length,
          monthlyMessages,
          monthlyRevenue,
          customerName: deployment.customer_name,
          email: deployment.email,
          indexed: deployment.last_indexed ? true : false,
          products: deployment.products
        };
      })
    );

    // Calculate totals
    const totals = {
      activeDeployments: deployments.filter(d => d.status === 'active').length,
      totalMessages: deploymentsWithStats.reduce((sum, d) => sum + d.messageCount, 0),
      totalSessions: deploymentsWithStats.reduce((sum, d) => sum + d.sessionCount, 0),
      monthlyRevenue: deploymentsWithStats.reduce((sum, d) => sum + d.monthlyRevenue, 0),
      monthlyMessages: deploymentsWithStats.reduce((sum, d) => sum + d.monthlyMessages, 0)
    };

    return NextResponse.json({
      deployments: deploymentsWithStats,
      totals,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/deployments - Create new deployment (activate a license)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { domain, licenseKey, plan = 'free', customerName, email } = body;

    // Validate required fields
    if (!domain || !licenseKey) {
      return NextResponse.json(
        { error: 'Domain and license key are required' },
        { status: 400 }
      );
    }

    // Check if license exists
    const existingLicense = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    if (existingLicense && existingLicense.site_key) {
      return NextResponse.json(
        { error: 'License already has a deployment' },
        { status: 400 }
      );
    }

    // Generate site key
    const siteKey = `ik_${domain.replace(/\./g, '_')}_n8n_indexed_${Math.random().toString(36).substr(2, 9)}`;

    // Create or update license with deployment info
    const deployment = await prisma.licenses.upsert({
      where: { license_key: licenseKey },
      update: {
        site_key: siteKey,
        domain,
        status: 'active',
        plan,
        used_at: new Date(),
        customer_name: customerName,
        email,
        products: ['chatbot']
      },
      create: {
        license_key: licenseKey,
        site_key: siteKey,
        domain,
        status: 'active',
        plan,
        created_at: new Date(),
        used_at: new Date(),
        customer_name: customerName,
        email,
        products: ['chatbot']
      }
    });

    return NextResponse.json({
      deployment,
      message: 'Deployment created successfully'
    });
  } catch (error) {
    console.error('Failed to create deployment:', error);
    return NextResponse.json(
      { error: 'Failed to create deployment' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/deployments - Update deployment
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { siteKey, status, plan, indexed } = body;

    if (!siteKey) {
      return NextResponse.json(
        { error: 'Site key is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (plan) updateData.plan = plan;
    if (indexed) updateData.last_indexed = new Date();

    const deployment = await prisma.licenses.update({
      where: { site_key: siteKey },
      data: updateData
    });

    return NextResponse.json({
      deployment,
      message: 'Deployment updated successfully'
    });
  } catch (error) {
    console.error('Failed to update deployment:', error);
    return NextResponse.json(
      { error: 'Failed to update deployment' },
      { status: 500 }
    );
  }
}