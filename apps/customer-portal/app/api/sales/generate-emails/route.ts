import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize OpenAI client inside the function to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build'
    });

    const { campaign, generateCount = 3 } = await request.json();

    // Generate sample prospects based on targeting
    const sampleProspects = generateSampleProspects(campaign, generateCount);

    // Generate personalized emails for each prospect
    const previews = await Promise.all(
      sampleProspects.map(async (prospect) => {
        const email = await generatePersonalizedEmail(campaign, prospect, openai);
        return {
          ...email,
          recipientName: prospect.name,
          recipientCompany: prospect.company,
          recipientRole: prospect.role
        };
      })
    );

    return NextResponse.json({ previews });
  } catch (error) {
    console.error('Error generating emails:', error);
    return NextResponse.json(
      { error: 'Failed to generate emails' },
      { status: 500 }
    );
  }
}

function generateSampleProspects(campaign: any, count: number) {
  // Generate realistic sample prospects based on targeting criteria
  const sampleRoles = [
    { role: 'CTO', name: 'Sarah Chen', company: 'TechFlow Solutions' },
    { role: 'VP of Engineering', name: 'Michael Rodriguez', company: 'DataSync Inc' },
    { role: 'Head of Product', name: 'Emma Thompson', company: 'CloudFirst Systems' },
    { role: 'CEO', name: 'James Wilson', company: 'InnovateTech Corp' },
    { role: 'Director of Operations', name: 'Lisa Park', company: 'ScaleUp Ventures' }
  ];

  return sampleRoles.slice(0, count).map(sample => ({
    ...sample,
    industry: campaign.targetCriteria?.industry || 'technology',
    companySize: campaign.targetCriteria?.companySize || '50-200',
    location: campaign.targetCriteria?.location || 'San Francisco, CA',
    companyContext: generateCompanyContext(sample.company)
  }));
}

function generateCompanyContext(company: string) {
  // Simulate company research data
  const contexts = {
    'TechFlow Solutions': {
      recentNews: 'Raised $25M Series B funding',
      technologies: ['AWS', 'Kubernetes', 'React'],
      challenges: 'Scaling infrastructure for rapid growth'
    },
    'DataSync Inc': {
      recentNews: 'Launched new real-time sync platform',
      technologies: ['Python', 'PostgreSQL', 'Redis'],
      challenges: 'Managing complex data pipelines'
    },
    'CloudFirst Systems': {
      recentNews: 'Expanded to European market',
      technologies: ['Azure', 'Docker', '.NET'],
      challenges: 'Multi-region deployment complexity'
    },
    'InnovateTech Corp': {
      recentNews: 'Acquired competitor SmartTools',
      technologies: ['GCP', 'Node.js', 'MongoDB'],
      challenges: 'Integration of acquired technology stacks'
    },
    'ScaleUp Ventures': {
      recentNews: 'Doubled customer base in Q4',
      technologies: ['AWS', 'Java', 'Kafka'],
      challenges: 'Customer support automation at scale'
    }
  };

  return contexts[company as keyof typeof contexts] || {
    recentNews: 'Growing rapidly',
    technologies: ['Cloud infrastructure'],
    challenges: 'Operational efficiency'
  };
}

async function generatePersonalizedEmail(campaign: any, prospect: any, openai: any) {
  const prompt = `
You are an expert sales copywriter creating a personalized cold outreach email.

Campaign Context:
- Purpose/CTA: ${campaign.purpose}
- Value Proposition: ${campaign.contentSettings.valueProposition}
- Pain Points: ${campaign.contentSettings.painPoints?.join(', ') || 'General business challenges'}
- Social Proof: ${campaign.contentSettings.socialProof || 'Trusted by leading companies'}
- Tone: ${campaign.contentSettings.tone}
- Personalization Level: ${campaign.contentSettings.personalizationLevel}

Prospect Information:
- Name: ${prospect.name}
- Role: ${prospect.role}
- Company: ${prospect.company}
- Industry: ${prospect.industry}
- Company Size: ${prospect.companySize}
- Location: ${prospect.location}
${campaign.contentSettings.includeCompanyResearch ? `
- Recent Company News: ${prospect.companyContext.recentNews}
- Technologies Used: ${prospect.companyContext.technologies.join(', ')}
- Likely Challenges: ${prospect.companyContext.challenges}
` : ''}

Instructions:
1. Write a compelling subject line (max 60 characters)
2. Create a personalized email body that:
   - Opens with a relevant, personalized hook based on their company/role
   ${campaign.contentSettings.includeCompanyResearch ? '- References their recent news or specific context' : ''}
   ${campaign.contentSettings.includeRoleContext ? '- Speaks to challenges specific to their role' : ''}
   - Clearly presents the value proposition
   - Includes a clear, specific call-to-action
   - Is concise (150-200 words max)
   - Matches the ${campaign.contentSettings.tone} tone
   - Feels genuine and human, not templated
   - Does NOT use excessive flattery or generic compliments
   - Does NOT make assumptions about their specific problems without evidence

${campaign.contentSettings.customInstructions ? `Additional Instructions: ${campaign.contentSettings.customInstructions}` : ''}

Format the response as JSON:
{
  "subject": "Subject line here",
  "body": "Email body here"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing personalized cold outreach emails that get responses. You write concise, relevant, and genuine emails that provide value to the recipient.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      subject: result.subject || 'Helping ' + prospect.company + ' achieve better results',
      body: result.body || generateFallbackEmail(campaign, prospect)
    };
  } catch (error) {
    console.error('OpenAI generation failed:', error);
    // Fallback to template-based generation
    return {
      subject: `Quick question for ${prospect.company}`,
      body: generateFallbackEmail(campaign, prospect)
    };
  }
}

function generateFallbackEmail(campaign: any, prospect: any) {
  return `Hi ${prospect.name.split(' ')[0]},

I noticed ${prospect.company} is ${prospect.companyContext?.recentNews?.toLowerCase() || 'growing rapidly'}, and I wanted to reach out because we help companies like yours ${campaign.contentSettings.valueProposition}.

${campaign.contentSettings.socialProof || 'Many companies in your industry'} use our solution to ${campaign.contentSettings.painPoints?.[0] ? `solve ${campaign.contentSettings.painPoints[0]}` : 'improve their operations'}.

${campaign.purpose}

Would you be open to a brief conversation to explore if this could be valuable for ${prospect.company}?

Best regards,
${campaign.emailSettings?.fromName || 'Your Sales Team'}`;
}