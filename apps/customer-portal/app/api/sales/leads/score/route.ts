import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    const body = await request.json();
    const { leadId } = body;

    // Calculate lead score based on various factors
    const lead = await prisma.sales_leads.findFirst({
      where: {
        id: leadId,
        license_key: user.license_key
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Simple scoring logic
    let score = 0;
    if (lead.email) score += 10;
    if (lead.company_name) score += 15;
    if (lead.job_title) score += 10;
    if (lead.phone) score += 5;
    if (lead.linkedin_url) score += 10;
    if (lead.emails_opened > 0) score += 20;
    if (lead.emails_opened > 3) score += 10;
    if (lead.last_contacted_at) score += 10;

    // Cap at 100
    score = Math.min(score, 100);

    // Update the lead with the new score
    const updatedLead = await prisma.sales_leads.update({
      where: { id: leadId },
      data: { score }
    });

    return NextResponse.json({ lead: updatedLead, score });
  } catch (error) {
    console.error('Error scoring lead:', error);
    return NextResponse.json(
      { error: 'Failed to score lead' },
      { status: 500 }
    );
  }
}