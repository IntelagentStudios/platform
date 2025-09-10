import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Sales skill execution mapping
const salesSkillHandlers: Record<string, (params: any) => Promise<any>> = {
  email_automation: async (params) => {
    const { campaignId, leadIds } = params;
    
    // Get campaign details
    const campaign = await prisma.sales_campaigns.findUnique({
      where: { id: campaignId }
      // TODO: Include leads when relation is set up
      // include: { leads: { where: { id: { in: leadIds || [] } } } }
    });

    if (!campaign) throw new Error('Campaign not found');

    const emailTemplates = campaign.email_templates as any[];
    if (!emailTemplates || emailTemplates.length === 0) {
      throw new Error('No email templates configured');
    }

    // Process each lead
    const results = [];
    // Fetch leads separately since we can't include them in the campaign query yet
    const leadsToProcess = leadIds ? await prisma.sales_leads.findMany({
      where: { id: { in: leadIds } }
    }) : await prisma.sales_leads.findMany({
      where: { 
        campaign_id: campaignId,
        status: 'new',
        is_bounced: false,
        is_unsubscribed: false
      },
      take: campaign.daily_send_limit
    });

    for (const lead of leadsToProcess) {
      try {
        // Determine which email to send based on sequence
        const emailToSend = emailTemplates[lead.emails_sent % emailTemplates.length];
        
        // Personalize email content
        const personalizedSubject = personalizeContent(emailToSend.subject, lead);
        const personalizedContent = personalizeContent(emailToSend.content, lead);

        // Create activity record
        await prisma.sales_activities.create({
          data: {
            campaign_id: campaignId,
            lead_id: lead.id,
            license_key: campaign.license_key,
            activity_type: 'email_sent',
            activity_subtype: lead.emails_sent === 0 ? 'cold_email' : 'follow_up',
            email_subject: personalizedSubject,
            email_content: personalizedContent,
            email_template_id: emailToSend.id,
            email_sequence_num: lead.emails_sent + 1,
            skill_used: 'email_automation'
          }
        });

        // Update lead status
        await prisma.sales_leads.update({
          where: { id: lead.id },
          data: {
            status: 'contacted',
            emails_sent: { increment: 1 },
            last_email_sent: new Date(),
            contacted_at: lead.contacted_at || new Date()
          }
        });

        results.push({
          leadId: lead.id,
          email: lead.email,
          status: 'sent',
          subject: personalizedSubject
        });
      } catch (error: any) {
        results.push({
          leadId: lead.id,
          email: lead.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update campaign metrics
    await prisma.sales_campaigns.update({
      where: { id: campaignId },
      data: {
        emails_sent: { increment: results.filter(r => r.status === 'sent').length },
        leads_contacted: { increment: results.filter(r => r.status === 'sent').length },
        last_activity_at: new Date()
      }
    });

    return {
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    };
  },

  lead_scoring: async (params) => {
    const { campaignId, leadIds } = params;
    
    const leads = await prisma.sales_leads.findMany({
      where: {
        campaign_id: campaignId,
        ...(leadIds ? { id: { in: leadIds } } : {})
      },
      include: {
        activities: {
          orderBy: { activity_date: 'desc' },
          take: 10
        }
      }
    });

    const scoredLeads = [];
    for (const lead of leads) {
      let score = 0;
      
      // Score based on engagement
      if (lead.emails_opened > 0) score += 10;
      if (lead.emails_clicked > 0) score += 20;
      if (lead.last_response) score += 30;
      
      // Score based on company info
      if (lead.company_name) score += 5;
      if (lead.job_title) score += 5;
      if (lead.company_size === '201-1000' || lead.company_size === '1000+') score += 10;
      
      // Score based on activities
      const recentActivities = lead.activities.filter(a => 
        new Date(a.activity_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      score += recentActivities.length * 5;
      
      // Check for positive intent
      const positiveActivity = lead.activities.find(a => 
        a.intent_detected === 'interested' || a.activity_type === 'meeting_scheduled'
      );
      if (positiveActivity) score += 20;
      
      // Cap score at 100
      score = Math.min(100, score);
      
      // Update lead score
      await prisma.sales_leads.update({
        where: { id: lead.id },
        data: { 
          lead_score: score,
          status: score >= 70 ? 'qualified' : lead.status,
          qualified_at: score >= 70 && !lead.qualified_at ? new Date() : lead.qualified_at
        }
      });
      
      scoredLeads.push({
        leadId: lead.id,
        email: lead.email,
        previousScore: lead.lead_score,
        newScore: score,
        qualified: score >= 70
      });
    }
    
    return {
      processed: scoredLeads.length,
      qualified: scoredLeads.filter(l => l.qualified).length,
      leads: scoredLeads
    };
  },

  response_handler: async (params) => {
    const { leadId, responseContent, sentiment } = params;
    
    const lead = await prisma.sales_leads.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) throw new Error('Lead not found');
    
    // Analyze response intent
    const intent = analyzeIntent(responseContent);
    
    // Create activity
    await prisma.sales_activities.create({
      data: {
        campaign_id: lead.campaign_id,
        lead_id: leadId,
        license_key: lead.license_key,
        activity_type: 'response_received',
        response_content: responseContent,
        sentiment_score: sentiment || 0,
        intent_detected: intent,
        skill_used: 'response_handler'
      }
    });
    
    // Update lead
    await prisma.sales_leads.update({
      where: { id: leadId },
      data: {
        status: intent === 'interested' ? 'qualified' : 
                intent === 'not_interested' ? 'lost' : 'responded',
        last_response: new Date(),
        lead_score: Math.min(100, lead.lead_score + (intent === 'interested' ? 20 : 5))
      }
    });
    
    // Update campaign metrics
    await prisma.sales_campaigns.update({
      where: { id: lead.campaign_id },
      data: {
        responses_received: { increment: 1 },
        last_activity_at: new Date()
      }
    });
    
    return {
      leadId,
      intent,
      sentiment,
      suggestedAction: intent === 'interested' ? 'schedule_meeting' : 
                       intent === 'need_info' ? 'send_info' : 'mark_lost'
    };
  },

  meeting_scheduler: async (params) => {
    const { leadId, meetingDate, duration, notes } = params;
    
    const lead = await prisma.sales_leads.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) throw new Error('Lead not found');
    
    // Create meeting activity
    await prisma.sales_activities.create({
      data: {
        campaign_id: lead.campaign_id,
        lead_id: leadId,
        license_key: lead.license_key,
        activity_type: 'meeting_scheduled',
        meeting_date: new Date(meetingDate),
        meeting_duration: duration || 30,
        metadata: { notes },
        skill_used: 'meeting_scheduler'
      }
    });
    
    // Update lead status
    await prisma.sales_leads.update({
      where: { id: leadId },
      data: {
        status: 'meeting_scheduled',
        lead_score: Math.min(100, lead.lead_score + 15)
      }
    });
    
    // Update campaign metrics
    await prisma.sales_campaigns.update({
      where: { id: lead.campaign_id },
      data: {
        meetings_booked: { increment: 1 },
        last_activity_at: new Date()
      }
    });
    
    return {
      leadId,
      meetingDate,
      duration,
      status: 'scheduled'
    };
  }
};

// Helper function to personalize content
function personalizeContent(template: string, lead: any): string {
  return template
    .replace(/{{first_name}}/g, lead.first_name || 'there')
    .replace(/{{last_name}}/g, lead.last_name || '')
    .replace(/{{full_name}}/g, lead.full_name || lead.first_name || 'there')
    .replace(/{{company_name}}/g, lead.company_name || 'your company')
    .replace(/{{job_title}}/g, lead.job_title || 'your role')
    .replace(/{{industry}}/g, lead.industry || 'your industry');
}

// Helper function to analyze response intent
function analyzeIntent(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('interested') || 
      lowerContent.includes('schedule') || 
      lowerContent.includes('meeting') ||
      lowerContent.includes('call')) {
    return 'interested';
  }
  
  if (lowerContent.includes('not interested') || 
      lowerContent.includes('unsubscribe') || 
      lowerContent.includes('remove')) {
    return 'not_interested';
  }
  
  if (lowerContent.includes('more info') || 
      lowerContent.includes('tell me') || 
      lowerContent.includes('questions')) {
    return 'need_info';
  }
  
  return 'neutral';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { skillId, parameters } = body;

    if (!skillId || !salesSkillHandlers[skillId]) {
      return NextResponse.json(
        { error: `Invalid skill: ${skillId}` },
        { status: 400 }
      );
    }

    // Execute the skill
    const result = await salesSkillHandlers[skillId](parameters);

    // Log skill execution
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'skill_executed',
        resource_type: 'sales_skill',
        resource_id: skillId,
        changes: {
          parameters,
          result: {
            processed: result.processed,
            success: result.sent || result.qualified || result.status
          }
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      skillId,
      result
    });

  } catch (error: any) {
    console.error('Error executing sales skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute skill' },
      { status: 500 }
    );
  }
}