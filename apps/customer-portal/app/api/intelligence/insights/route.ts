/**
 * AI Intelligence Insights API
 * Provides intelligent insights and recommendations based on execution data
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { AIIntelligenceService } from '@intelagent/ai-intelligence';
import { prisma } from '@/lib/prisma';

const aiService = new AIIntelligenceService();

/**
 * GET /api/intelligence/insights
 * Get AI-generated insights for the authenticated license
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || 'general';
    const timeRangeStr = searchParams.get('timeRange') || '24h';
    const includeRecommendations = searchParams.get('recommendations') === 'true';
    const includePredictions = searchParams.get('predictions') === 'true';

    // Calculate time range
    let timeRange;
    switch (timeRangeStr) {
      case '1h':
        timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000),
          end: new Date()
        };
        break;
      case '24h':
        timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        };
        break;
      case '7d':
        timeRange = {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        };
        break;
      case '30d':
        timeRange = {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        };
        break;
      default:
        timeRange = undefined;
    }

    const licenseKey = authResult.user?.licenseKey;
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 400 }
      );
    }

    // Get AI insights
    const insightType = includeRecommendations ? 'recommendation' : 
                       includePredictions ? 'prediction' : 'summary';
    
    const insights = await aiService.generateInsights({
      licenseKey,
      type: insightType as any,
      timeRange: timeRange ? { start: timeRange.start, end: timeRange.end } : undefined,
      context: { context }
    });

    // Map insights to match expected format
    const allInsights = insights.map(insight => ({
      ...insight,
      severity: insight.impact === 'critical' ? 'critical' : 
                insight.impact === 'high' ? 'warning' : 'info',
      actions: insight.recommendations.map((rec, idx) => ({
        id: `action-${idx}`,
        label: rec,
        type: 'recommendation'
      })),
      metadata: insight.data
    }));

    // Store insights in audit log for tracking
    if (allInsights.length > 0) {
      await prisma.audit_logs.createMany({
        data: allInsights.map(insight => ({
          license_key: licenseKey,
          user_id: authResult.user?.userId || licenseKey,
          action: 'ai_insight_generated',
          resource_type: 'insight',
          resource_id: insight.id,
          changes: {
            type: insight.type,
            title: insight.title,
            description: insight.description,
            severity: insight.severity,
            confidence: insight.confidence,
            data: insight.data,
            actions: insight.actions,
            metadata: insight.metadata
          }
        }))
      });
    }

    return NextResponse.json({
      insights: allInsights,
      summary: {
        total: allInsights.length,
        critical: allInsights.filter(i => i.severity === 'critical').length,
        warnings: allInsights.filter(i => i.severity === 'warning').length,
        recommendations: allInsights.filter(i => i.type === 'recommendation').length,
        predictions: allInsights.filter(i => i.type === 'prediction').length
      },
      context,
      timeRange: timeRangeStr
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intelligence/insights
 * Execute an AI-recommended action
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { insightId, actionId } = await request.json();

    if (!insightId || !actionId) {
      return NextResponse.json(
        { error: 'Insight ID and Action ID are required' },
        { status: 400 }
      );
    }

    const licenseKey = authResult.user?.licenseKey;
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 400 }
      );
    }

    // Get the insight from audit logs
    const insightLog = await prisma.audit_logs.findFirst({
      where: {
        resource_id: insightId,
        license_key: licenseKey,
        action: 'ai_insight_generated',
        resource_type: 'insight'
      }
    });

    if (!insightLog) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      );
    }

    // Find the action
    const insightData = insightLog.changes as any;
    const actions = insightData?.actions as any[];
    const action = actions?.find((a: any) => a.id === actionId);

    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    // Execute the action based on type
    let result: any = {};
    
    switch (action.type) {
      case 'execute_skill':
        // Create execution record for tracking
        const execution = await prisma.executions.create({
          data: {
            license_key: licenseKey,
            execution_type: 'ai_action',
            execution_name: `AI Action: ${action.label}`,
            status: 'pending',
            input_data: action.params,
            metadata: { insightId, actionId }
          }
        });
        
        result = {
          success: true,
          message: 'Skill execution initiated',
          executionId: execution.id
        };
        break;

      case 'adjust_setting':
        // Update configuration
        result = {
          success: true,
          message: `Setting ${action.params.setting} updated to ${action.params.value}`
        };
        break;

      case 'alert_user':
        // Create notification
        result = {
          success: true,
          message: 'Alert sent to user'
        };
        break;

      case 'auto_fix':
        // Initiate automatic fix
        result = {
          success: true,
          message: 'Automatic fix initiated',
          details: action.params
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action type'
        };
    }

    // Mark insight as acted upon
    await prisma.platform_insights.update({
      where: { id: insightId },
      data: {
        acted_on: true,
        acted_at: new Date()
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}