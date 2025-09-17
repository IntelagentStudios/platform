import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and their product
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Check for sales product
    const salesProduct = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        OR: [
          { product: 'sales-outreach' },
          { product_type: 'sales-agent' }
        ],
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    const licenseKey = user.license_key;

    // Get aggregated stats
    const [campaigns, leads, totalStats] = await Promise.all([
      prisma.sales_campaigns.findMany({
        where: { license_key: licenseKey }
      }),
      prisma.sales_leads.findMany({
        where: { license_key: licenseKey }
      }),
      prisma.sales_campaigns.aggregate({
        where: { license_key: licenseKey },
        _sum: {
          emails_sent: true,
          emails_opened: true,
          emails_clicked: true,
          replies_received: true,
          meetings_booked: true,
          deals_created: true
        }
      })
    ]);

    // Calculate metrics
    const stats = {
      totalLeads: leads.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      emailsSent: totalStats._sum.emails_sent || 0,
      emailsOpened: totalStats._sum.emails_opened || 0,
      emailsClicked: totalStats._sum.emails_clicked || 0,
      meetingsBooked: totalStats._sum.meetings_booked || 0,
      openRate: totalStats._sum.emails_sent > 0
        ? Math.round((totalStats._sum.emails_opened || 0) / totalStats._sum.emails_sent * 100)
        : 0,
      clickRate: totalStats._sum.emails_sent > 0
        ? Math.round((totalStats._sum.emails_clicked || 0) / totalStats._sum.emails_sent * 100)
        : 0,
      replyRate: totalStats._sum.emails_sent > 0
        ? Math.round((totalStats._sum.replies_received || 0) / totalStats._sum.emails_sent * 100)
        : 0,
      conversionRate: leads.length > 0
        ? Math.round((totalStats._sum.deals_created || 0) / leads.length * 100)
        : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}