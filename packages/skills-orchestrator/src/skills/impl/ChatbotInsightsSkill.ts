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
                "No conversations yet - start engaging with your chatbot",
                "Add knowledge base content to improve responses",
                "Monitor initial conversations closely for improvements"
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
Analyze these chatbot conversations and provide the 3 most important takeaways.

Conversations data:
${JSON.stringify(conversationSummary, null, 2)}

Total conversations: ${conversations.length}

Provide insights in this JSON format:
{
  "takeaways": [
    "First most important insight or recommendation",
    "Second most important insight or recommendation",
    "Third most important insight or recommendation"
  ]
}

Focus on:
1. Actual patterns in the data, not assumptions
2. Specific, actionable recommendations
3. Problems that can realistically be fixed
4. Keep each takeaway concise (1 sentence)
5. Make takeaways actionable and valuable
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
            `You have ${conversations?.length || 0} total conversations to analyze`,
            "AI insights require OpenAI API key configuration",
            "Upgrade to unlock full analytics and recommendations"
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