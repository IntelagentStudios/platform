import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { EmailSenderSkill } from '@/packages/skills-orchestrator/src/skills/impl/EmailSenderSkill';
import { PrismaClient } from '@prisma/client';

const emailSkill = new EmailSenderSkill();
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get user and license key
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user?.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Check for sales product
    const salesProduct = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        product: 'sales-outreach',
        status: 'active'
      }
    });

    if (!salesProduct) {
      return NextResponse.json({ error: 'No active sales product' }, { status: 403 });
    }

    // Determine action based on body
    let action = 'send_email';
    if (body.templateId) {
      action = 'send_template';
    } else if (body.campaignId) {
      action = 'send_campaign_email';
    } else if (body.recipients && Array.isArray(body.recipients)) {
      action = 'send_bulk';
    }

    const result = await emailSkill.execute({
      action,
      licenseKey: user.license_key,
      data: body
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Log activity if lead is specified
    if (body.leadId) {
      await prisma.sales_activities.create({
        data: {
          license_key: user.license_key,
          lead_id: body.leadId,
          campaign_id: body.campaignId,
          activity_type: 'email_sent',
          subject: body.subject,
          content: body.body,
          metadata: result.data,
          skill_used: 'email_sender'
        }
      });

      // Update lead's last contacted date
      await prisma.sales_leads.update({
        where: { id: body.leadId },
        data: {
          emails_sent: { increment: 1 },
          last_contacted_at: new Date()
        }
      });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}