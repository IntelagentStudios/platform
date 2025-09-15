const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    // Create unique IDs with timestamp
    const timestamp = Date.now();
    const campaignId = `campaign_${timestamp}`;
    const leadIds = [`lead_${timestamp}_1`, `lead_${timestamp}_2`];
    const templateId = `template_${timestamp}`;
    const activityId = `activity_${timestamp}`;

    // Create a test license for sales outreach
    const license = await prisma.licenses.upsert({
      where: { license_key: 'TEST-SALES-001' },
      update: {},
      create: {
        license_key: 'TEST-SALES-001',
        email: 'test@salesagent.com',
        status: 'active',
        products: ['Sales Outreach Agent'],
        customer_name: 'Test Sales Company',
        domain: 'salestest.com',
        plan: 'professional',
        tier: 'pro',
        is_pro: true,
        created_at: new Date(),
        activated_at: new Date()
      }
    });

    console.log('✅ Created/Found test license:', license.license_key);

    // Create a test campaign
    const campaign = await prisma.sales_campaigns.create({
      data: {
        id: campaignId,
        license_key: license.license_key,
        name: 'Test Outreach Campaign',
        description: 'Testing the sales outreach functionality',
        status: 'draft',
        campaign_type: 'email',
        target_criteria: {
          industry: 'technology',
          company_size: '10-50',
          location: 'United States'
        },
        email_templates: {
          initial: templateId,
          followup1: null,
          followup2: null
        },
        total_leads: 0,
        emails_sent: 0,
        emails_opened: 0,
        replies_received: 0,
        meetings_booked: 0
      }
    });

    console.log('✅ Created test campaign:', campaign.id);

    // Create test leads
    const leads = await Promise.all([
      prisma.sales_leads.create({
        data: {
          id: leadIds[0],
          license_key: license.license_key,
          campaign_id: campaign.id,
          email: `john.doe.${timestamp}@techcorp.com`,
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          company_name: 'TechCorp Inc',
          company_domain: 'techcorp.com',
          job_title: 'CTO',
          status: 'new',
          source: 'manual_import',
          custom_fields: {
            linkedin: 'https://linkedin.com/in/johndoe',
            phone: '+1-555-0123',
            timezone: 'America/New_York'
          },
          score: 85,
          tags: ['high_value', 'decision_maker']
        }
      }),
      prisma.sales_leads.create({
        data: {
          id: leadIds[1],
          license_key: license.license_key,
          campaign_id: campaign.id,
          email: `jane.smith.${timestamp}@innovate.io`,
          first_name: 'Jane',
          last_name: 'Smith',
          full_name: 'Jane Smith',
          company_name: 'Innovate.io',
          company_domain: 'innovate.io',
          job_title: 'VP of Engineering',
          status: 'new',
          source: 'csv_upload',
          custom_fields: {
            linkedin: 'https://linkedin.com/in/janesmith',
            website: 'https://innovate.io'
          },
          score: 75,
          tags: ['qualified', 'tech_buyer']
        }
      })
    ]);

    console.log('✅ Created test leads:', leads.length);

    // Create email templates
    const template = await prisma.sales_email_templates.create({
      data: {
        id: templateId,
        license_key: license.license_key,
        name: 'Initial Outreach Template',
        subject: 'Quick question about {{company}}',
        body: `Hi {{first_name}},

I noticed that {{company}} is growing rapidly in the {{industry}} space.

We've helped similar companies automate their sales outreach and increase response rates by 40%.

Would you be open to a quick 15-minute call next week to discuss how this could work for {{company}}?

Best regards,
{{sender_name}}`,
        template_type: 'initial',
        variables: ['first_name', 'company', 'industry', 'sender_name'],
        avg_open_rate: 0.45,
        avg_reply_rate: 0.12,
        is_active: true
      }
    });

    console.log('✅ Created email template:', template.id);

    // Create an activity
    const activity = await prisma.sales_activities.create({
      data: {
        id: activityId,
        license_key: license.license_key,
        campaign_id: campaign.id,
        lead_id: leads[0].id,
        activity_type: 'email_sent',
        status: 'completed',
        subject: 'Quick question about TechCorp Inc',
        content: template.body,
        metadata: {
          template_used: template.id,
          sent_at: new Date().toISOString()
        },
        performed_at: new Date()
      }
    });

    console.log('✅ Created test activity:', activity.id);

    console.log('\n🎉 Test data created successfully!');
    console.log('\nYou can now:');
    console.log('1. Access Prisma Studio at http://localhost:5555');
    console.log('2. Test the API at http://localhost:3002/api/sales/*');
    console.log('3. Use license key: TEST-SALES-001');
    console.log('4. Email for auth: test@salesagent.com');
    console.log('\nTest IDs created:');
    console.log('- Campaign ID:', campaignId);
    console.log('- Lead IDs:', leadIds.join(', '));
    console.log('- Template ID:', templateId);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();