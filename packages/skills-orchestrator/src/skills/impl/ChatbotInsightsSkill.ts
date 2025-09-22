import { BaseSkill } from '../BaseSkill';
import { SkillParams, SkillResult, SkillCategory } from '../../types';
import OpenAI from 'openai';

export class ChatbotInsightsSkill extends BaseSkill {
  metadata = {
    id: 'chatbot_insights',
    name: 'Chatbot AI Insights',
    description: 'Analyzes chatbot conversations using AI to provide actionable insights and recommendations',
    category: SkillCategory.AI_ANALYTICS,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['chatbot', 'analytics', 'insights', 'ai', 'openai']
  };

  validate(params: SkillParams): boolean {
    return !!(params.conversations && Array.isArray(params.conversations));
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const conversations = params.conversations as any[];
      const productKey = params.productKey as string || '';

      if (!conversations || conversations.length === 0) {
        return {
          success: true,
          data: {
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
          },
          metadata: {
            skillId: this.metadata.id,
            skillName: this.metadata.name,
            timestamp: new Date()
          }
        };
      }

      // Initialize OpenAI only when needed and API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured - returning basic insights');
        return this.generateBasicInsights(conversations);
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

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
      if (params.storeInDb && productKey) {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.chatbot_logs.create({
          data: {
            product_key: productKey,
            customer_message: 'SYSTEM:INSIGHTS_GENERATED',
            chatbot_response: JSON.stringify(insights),
            created_at: new Date()
          }
        });

        await prisma.$disconnect();
      }

      return {
        success: true,
        data: { insights },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date(),
          conversationsAnalyzed: conversations.length
        }
      };

    } catch (error) {
      console.error('Error generating insights:', error);
      return this.generateBasicInsights(params.conversations as any[]);
    }
  }

  private generateBasicInsights(conversations: any[]): SkillResult {
    return {
      success: true,
      data: {
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
      },
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date()
      }
    };
  }
}