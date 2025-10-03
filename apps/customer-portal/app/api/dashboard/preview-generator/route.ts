import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq only when API key is available
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
};

export async function POST(req: NextRequest) {
  let body: any = {};

  try {
    body = await req.json();
    const { agentConfig } = body;

    if (!agentConfig) {
      return NextResponse.json(
        { error: 'Agent configuration is required' },
        { status: 400 }
      );
    }

    // Generate context-aware preview data based on the agent configuration
    const prompt = `You are a UI/UX expert generating preview dashboard data for an AI agent platform.

Given this agent configuration:
- Name: ${agentConfig.name || 'Custom AI Agent'}
- Description: ${agentConfig.description || 'AI-powered business automation'}
- Skills: ${agentConfig.skills.join(', ')}
- Features: ${agentConfig.features.join(', ')}
- Integrations: ${agentConfig.integrations.join(', ')}
- Agent Type: ${agentConfig.agentType || 'general'}

Generate realistic, compelling preview data for a dashboard that showcases these capabilities.

IMPORTANT RULES:
1. Create specific metrics and KPIs relevant to the selected skills
2. Generate realistic sample data that demonstrates value
3. Include industry-specific terminology based on the agent type
4. Show how different skills integrate and work together
5. Make the data compelling and business-focused

Respond with a JSON object containing:
{
  "overview": {
    "kpis": [
      { "label": "string", "value": "string", "trend": "string", "icon": "string" }
    ],
    "recentActivity": ["string array of recent activities"],
    "notifications": ["string array of important notifications"]
  },
  "skillSpecific": {
    "skillId": {
      "metrics": { "key": "value" },
      "sampleData": [],
      "insights": ["string array"]
    }
  },
  "integrationStatus": {
    "integrationId": {
      "status": "active|syncing|error",
      "lastSync": "timestamp",
      "dataPoints": number
    }
  },
  "aiInsights": [
    { "type": "recommendation|warning|success", "message": "string", "impact": "high|medium|low" }
  ],
  "upcomingActions": [
    { "time": "string", "action": "string", "priority": "high|medium|low" }
  ]
}`;

    const groq = getGroqClient();

    if (!groq) {
      // If Groq is not available, use fallback data
      console.log('Groq API not configured, using fallback preview data');
      return NextResponse.json({
        success: true,
        previewData: generateDefaultPreviewData(agentConfig),
        generatedBy: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at generating realistic, compelling dashboard preview data for AI agent platforms. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    let previewData;
    try {
      const responseContent = completion.choices[0]?.message?.content || '{}';
      previewData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', parseError);
      // Fallback to default preview data
      previewData = generateDefaultPreviewData(agentConfig);
    }

    return NextResponse.json({
      success: true,
      previewData,
      generatedBy: 'groq-ai',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Preview generator error:', error);

    // Fallback to default preview data if Groq fails
    const fallbackData = generateDefaultPreviewData(body?.agentConfig || {});

    return NextResponse.json({
      success: true,
      previewData: fallbackData,
      generatedBy: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
}

function generateDefaultPreviewData(agentConfig: any) {
  const hasSkill = (pattern: string) =>
    agentConfig.skills.some((s: string) => s.includes(pattern));

  const overview = {
    kpis: [
      {
        label: 'Total Automations',
        value: '1,234',
        trend: '+23%',
        icon: 'BoltIcon'
      },
      {
        label: 'Time Saved',
        value: '156 hrs',
        trend: '+45%',
        icon: 'ClockIcon'
      }
    ],
    recentActivity: [
      'New workflow deployed successfully',
      'AI model updated with latest training data',
      'Integration sync completed'
    ],
    notifications: [
      'System performance optimal',
      `${agentConfig.skills.length} skills active`
    ]
  };

  // Add skill-specific KPIs
  if (hasSkill('email')) {
    overview.kpis.push({
      label: 'Emails Processed',
      value: '5,678',
      trend: '+34%',
      icon: 'EnvelopeIcon'
    });
  }

  if (hasSkill('lead') || hasSkill('sales')) {
    overview.kpis.push({
      label: 'Leads Generated',
      value: '456',
      trend: '+67%',
      icon: 'UserGroupIcon'
    });
  }

  if (hasSkill('analytics') || hasSkill('data')) {
    overview.kpis.push({
      label: 'Reports Generated',
      value: '89',
      trend: '+12%',
      icon: 'ChartBarIcon'
    });
  }

  const skillSpecific: any = {};

  // Generate skill-specific data
  agentConfig.skills.forEach((skillId: string) => {
    skillSpecific[skillId] = {
      metrics: {
        usage: Math.floor(Math.random() * 1000) + 100,
        efficiency: `${Math.floor(Math.random() * 30) + 70}%`,
        lastUsed: 'Just now'
      },
      sampleData: generateSampleDataForSkill(skillId),
      insights: [
        `${skillId.replace(/_/g, ' ')} performing above average`,
        'Optimization opportunity detected',
        'Usage trending upward'
      ]
    };
  });

  const integrationStatus: any = {};

  // Generate integration status
  agentConfig.integrations.forEach((integrationId: string) => {
    integrationStatus[integrationId] = {
      status: 'active',
      lastSync: new Date().toISOString(),
      dataPoints: Math.floor(Math.random() * 10000) + 1000
    };
  });

  const aiInsights = [
    {
      type: 'recommendation',
      message: `Enable ${agentConfig.features.length > 2 ? 'additional features' : 'voice commands'} to increase efficiency by 40%`,
      impact: 'high'
    },
    {
      type: 'success',
      message: 'All systems operating at peak performance',
      impact: 'medium'
    }
  ];

  if (agentConfig.skills.length > 10) {
    aiInsights.push({
      type: 'recommendation',
      message: 'Consider creating skill groups for better organization',
      impact: 'medium'
    });
  }

  const upcomingActions = [
    {
      time: 'In 5 minutes',
      action: 'Scheduled data sync',
      priority: 'medium'
    },
    {
      time: 'In 1 hour',
      action: 'Generate weekly report',
      priority: 'high'
    },
    {
      time: 'Tomorrow',
      action: 'Model retraining',
      priority: 'low'
    }
  ];

  return {
    overview,
    skillSpecific,
    integrationStatus,
    aiInsights,
    upcomingActions
  };
}

function generateSampleDataForSkill(skillId: string): any[] {
  const samples = [];

  if (skillId.includes('email')) {
    samples.push(
      { subject: 'Q1 Product Launch', status: 'Sent', opens: '68%' },
      { subject: 'Customer Newsletter', status: 'Draft', opens: '-' },
      { subject: 'Follow-up Sequence', status: 'Scheduled', opens: '-' }
    );
  } else if (skillId.includes('lead')) {
    samples.push(
      { name: 'John Smith', company: 'Tech Corp', score: 95 },
      { name: 'Sarah Johnson', company: 'StartupXYZ', score: 88 },
      { name: 'Mike Chen', company: 'BigCo Ltd', score: 76 }
    );
  } else if (skillId.includes('content')) {
    samples.push(
      { title: 'Blog Post: AI Trends', status: 'Published', views: 1234 },
      { title: 'Case Study: Success Story', status: 'Review', views: 0 },
      { title: 'White Paper: Industry Report', status: 'Draft', views: 0 }
    );
  } else {
    // Generic sample data
    samples.push(
      { item: 'Task 1', status: 'Complete', metric: '100%' },
      { item: 'Task 2', status: 'In Progress', metric: '45%' },
      { item: 'Task 3', status: 'Pending', metric: '0%' }
    );
  }

  return samples;
}