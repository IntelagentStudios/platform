import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  let conversations: any[] = [];
  let productKey = '';

  try {
    const body = await req.json();
    conversations = body.conversations || [];
    productKey = body.productKey || '';

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        insights: {
          performance: {
            summary: "No conversations yet",
            metrics: [],
            description: "Start engaging with your chatbot to see insights"
          },
          issues: [],
          recommendations: [],
          patterns: {
            commonTopics: [],
            dropOffPoints: [],
            peakTimes: []
          }
        }
      });
    }

    // Prepare conversation data for AI analysis
    const conversationSummary = conversations.slice(0, 50).map((conv: any) => ({
      messages: conv.messages.length,
      duration: conv.messages.length > 0 ?
        (new Date(conv.messages[conv.messages.length - 1].timestamp).getTime() -
         new Date(conv.messages[0].timestamp).getTime()) / 1000 : 0,
      domain: conv.domain,
      firstMessage: conv.messages[0]?.content || '',
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      userMessages: conv.messages.filter((m: any) => m.sender === 'user').map((m: any) => m.content).join(' | ')
    }));

    // Initialize OpenAI only when needed and API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
Analyze these chatbot conversations and provide actionable insights. Focus on practical improvements rather than generic metrics.

Conversations data:
${JSON.stringify(conversationSummary, null, 2)}

Total conversations: ${conversations.length}

Provide insights in this JSON format:
{
  "performance": {
    "summary": "One sentence overview of chatbot performance",
    "metrics": [
      {
        "label": "Most relevant metric name",
        "value": "Actual value or percentage",
        "trend": "up/down/stable",
        "context": "Why this matters"
      }
    ],
    "description": "2-3 sentences about overall performance"
  },
  "issues": [
    {
      "title": "Specific problem identified",
      "severity": "high/medium/low",
      "impact": "How many conversations affected",
      "suggestion": "Specific action to fix"
    }
  ],
  "recommendations": [
    {
      "title": "Specific improvement",
      "priority": "high/medium/low",
      "impact": "Expected improvement",
      "effort": "low/medium/high",
      "description": "How to implement"
    }
  ],
  "patterns": {
    "commonTopics": [
      {
        "topic": "Topic name",
        "frequency": "Number or percentage",
        "sentiment": "positive/negative/neutral"
      }
    ],
    "dropOffPoints": [
      {
        "trigger": "What causes drop-off",
        "frequency": "How often it happens",
        "suggestion": "How to fix"
      }
    ],
    "peakTimes": [
      {
        "period": "Time period description",
        "activity": "high/medium/low",
        "recommendation": "What to do about it"
      }
    ]
  }
}

Focus on:
1. Actual patterns in the data, not assumptions
2. Specific, actionable recommendations
3. Problems that can realistically be fixed
4. Insights appropriate for the volume of data (don't overanalyze small samples)
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing chatbot conversations and providing actionable business insights. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const insights = JSON.parse(completion.choices[0].message.content || '{}');

    // Store insights in database for caching (optional)
    await prisma.chatbot_logs.create({
      data: {
        product_key: productKey,
        customer_message: 'SYSTEM:INSIGHTS_GENERATED',
        chatbot_response: JSON.stringify(insights),
        created_at: new Date()
      }
    });

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Error generating insights:', error);

    // Fallback insights for error cases
    return NextResponse.json({
      insights: {
        performance: {
          summary: "Unable to generate AI insights",
          metrics: [
            {
              label: "Total Conversations",
              value: conversations?.length || 0,
              trend: "stable",
              context: "Analyzing conversations for patterns"
            }
          ],
          description: "AI analysis temporarily unavailable. Showing basic statistics."
        },
        issues: [],
        recommendations: [
          {
            title: "Enable AI insights",
            priority: "low",
            impact: "Better understanding of chatbot performance",
            effort: "low",
            description: "Ensure OpenAI API key is configured"
          }
        ],
        patterns: {
          commonTopics: [],
          dropOffPoints: [],
          peakTimes: []
        }
      }
    });
  }
}