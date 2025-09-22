import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { OrchestratorAgent } from '@intelagent/skills-orchestrator';

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

    // Use the skills orchestrator to generate insights
    const orchestrator = new OrchestratorAgent();

    // Execute the ChatbotInsightsSkill through the orchestrator
    const result = await orchestrator.execute({
      skillId: 'chatbot_insights',
      params: {
        conversations,
        productKey,
        storeInDb: true
      },
      context: {
        userId: 'system',
        licenseKey: productKey || 'system',
        sessionId: `insights-${Date.now()}`,
        metadata: {
          source: 'chatbot-dashboard'
        }
      }
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate insights');
    }

    const insights = result.results[0]?.data?.insights || {};

    // Log skill execution for audit
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'execution',
        skill_id: 'chatbot_insights',
        user_id: 'system',
        license_key: productKey,
        event_data: {
          conversationsAnalyzed: conversations.length,
          success: true
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({ insights });

  } catch (error: any) {
    console.error('Error generating insights:', error);

    // Log the error
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'error',
        skill_id: 'chatbot_insights',
        user_id: 'system',
        license_key: productKey || 'unknown',
        event_data: {
          error: error.message || 'Unknown error',
          conversationsCount: conversations.length
        },
        created_at: new Date()
      }
    }).catch(console.error);

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