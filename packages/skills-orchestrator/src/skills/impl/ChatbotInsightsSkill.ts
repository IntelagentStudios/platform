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
              takeaways: [
                {
                  title: "No Conversations Yet",
                  explanation: "Start engaging with your chatbot to see behavior patterns"
                },
                {
                  title: "Knowledge Base Empty",
                  explanation: "Add product documentation to answer common questions"
                },
                {
                  title: "Ready to Learn",
                  explanation: "Monitor initial conversations to identify improvement areas"
                }
              ],
              lastUpdated: new Date().toISOString()
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
Analyze these chatbot conversations and provide the 3 most important takeaways about user behavior and UI interaction patterns.

Conversations data:
${JSON.stringify(conversationSummary, null, 2)}

Total conversations: ${conversations.length}

Provide insights in this JSON format:
{
  "takeaways": [
    {
      "title": "Brief insight title (3-5 words)",
      "explanation": "One sentence explanation of why this matters based on the data"
    },
    {
      "title": "Brief insight title (3-5 words)",
      "explanation": "One sentence explanation of why this matters based on the data"
    },
    {
      "title": "Brief insight title (3-5 words)",
      "explanation": "One sentence explanation of why this matters based on the data"
    }
  ]
}

Focus on:
1. User behavior patterns and how they interact with the chatbot
2. UI/UX issues or successes based on conversation flow
3. Knowledge gaps indicated by repeated questions or drop-offs
4. Response time impacts on engagement
5. Specific percentages or numbers when relevant
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

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      // Add timestamp and ensure we have takeaways
      const insights = {
        takeaways: aiResponse.takeaways || [
          "Your chatbot is handling conversations effectively",
          "Consider adding more knowledge to reduce unanswered questions",
          "Response times are meeting user expectations"
        ],
        lastUpdated: new Date().toISOString()
      };

      // Store insights in database for caching (refreshed daily)
      if (params.storeInDb && productKey) {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Check if we have insights from today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const existingInsights = await prisma.chatbot_logs.findFirst({
          where: {
            product_key: productKey,
            customer_message: 'SYSTEM:DAILY_INSIGHTS',
            created_at: { gte: todayStart }
          }
        });

        // Only create new insights if we don't have today's insights
        if (!existingInsights) {
          await prisma.chatbot_logs.create({
            data: {
              product_key: productKey,
              customer_message: 'SYSTEM:DAILY_INSIGHTS',
              chatbot_response: JSON.stringify(insights),
              created_at: new Date()
            }
          });
        }

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
          takeaways: [
            {
              title: "Limited Analysis Available",
              explanation: `${conversations?.length || 0} conversations ready for analysis when AI is configured`
            },
            {
              title: "Configuration Required",
              explanation: "OpenAI API key needed for behavior insights"
            },
            {
              title: "Basic Metrics Only",
              explanation: "Advanced pattern recognition unavailable without AI"
            }
          ],
          lastUpdated: new Date().toISOString()
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