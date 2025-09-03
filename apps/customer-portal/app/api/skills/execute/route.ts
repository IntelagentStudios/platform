/**
 * Skill Execution API
 * Execute skills with proper monitoring and license tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SkillsRegistry } from '@intelagent/skills-orchestrator';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { skillId, params, licenseKey } = body;

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Validate license key - if not provided, try to find it from the user's email
    let finalLicenseKey = licenseKey;
    
    if (!finalLicenseKey && session.user.email) {
      const user = await prisma.users.findFirst({
        where: { email: session.user.email },
        select: { license_key: true }
      });
      finalLicenseKey = user?.license_key;
    }
    
    if (!finalLicenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      );
    }
    
    const license = await prisma.licenses.findUnique({
      where: { license_key: finalLicenseKey }
    });

    if (!license || license.status !== 'active') {
      return NextResponse.json(
        { error: 'Valid active license required' },
        { status: 403 }
      );
    }

    // Check if skill is available for this license tier
    // For now, check if user has pro license for premium skills
    const isPremiumSkill = await checkIfPremiumSkill(skillId);
    
    if (isPremiumSkill && !license.is_pro) {
      return NextResponse.json(
        { error: 'This skill requires a Pro license' },
        { status: 403 }
      );
    }

    // Create execution record
    const executionId = uuidv4();
    const execution = await prisma.executions.create({
      data: {
        id: executionId,
        license_key: license.license_key,
        execution_type: 'skill',
        status: 'running',
        metadata: {
          skillId,
          userId: session.user.id,
          userEmail: session.user.email,
          params
        },
        started_at: new Date()
      }
    });

    // Log execution start event
    await prisma.execution_events.create({
      data: {
        execution_id: executionId,
        event_type: 'skill_start',
        event_data: {
          skillId,
          params,
          user: session.user.email
        }
      }
    });

    // Use Orchestrator Agent - Single point of contact
    const { OrchestratorAgent } = await import('@intelagent/skills-orchestrator');
    const orchestrator = OrchestratorAgent.getInstance();

    // Execute through orchestrator
    try {
      const startTime = Date.now();
      
      const orchestrationResult = await orchestrator.execute({
        skillId,
        params: params || {},
        context: {
          userId: session.user.id,
          licenseKey: license.license_key,
          sessionId: executionId,
          metadata: {
            userEmail: session.user.email,
            executionId
          }
        }
      });

      const executionTime = Date.now() - startTime;
      const result = orchestrationResult.results[0] || { 
        success: false, 
        error: orchestrationResult.error 
      };

      // Update execution record
      await prisma.executions.update({
        where: { id: executionId },
        data: {
          status: result.success ? 'completed' : 'failed',
          result: result as any,
          completed_at: new Date(),
          duration_ms: executionTime,
          error_message: result.error
        }
      });

      // Log execution completion
      await prisma.execution_events.create({
        data: {
          execution_id: executionId,
          event_type: result.success ? 'skill_success' : 'skill_failure',
          event_data: {
            skillId,
            success: result.success,
            executionTime,
            error: result.error
          }
        }
      });

      // Track metrics
      await prisma.execution_metrics.create({
        data: {
          execution_id: executionId,
          metric_name: 'skill_execution_time',
          metric_value: executionTime,
          unit: 'ms'
        }
      });

      // Stats are now handled by the orchestrator internally
      
      // Return result
      return NextResponse.json({
        executionId,
        skillId,
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: {
          ...result.metadata,
          executionTime,
          licenseKey: license.license_key
        }
      });

    } catch (error: any) {
      await updateExecutionStatus(executionId, 'failed', error.message);
      
      await prisma.execution_events.create({
        data: {
          execution_id: executionId,
          event_type: 'skill_error',
          event_data: {
            skillId,
            error: error.message,
            stack: error.stack
          }
        }
      });

      return NextResponse.json(
        { 
          error: 'Skill execution failed',
          message: error.message,
          executionId 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Skill execution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update execution status
async function updateExecutionStatus(
  executionId: string,
  status: string,
  errorMessage?: string
) {
  await prisma.executions.update({
    where: { id: executionId },
    data: {
      status,
      error_message: errorMessage,
      completed_at: new Date()
    }
  });
}

// Helper function to check if skill is premium
async function checkIfPremiumSkill(skillId: string): Promise<boolean> {
  const premiumSkills = [
    'predictive_analytics',
    'image_analysis',
    'face_recognizer',
    'recommendation_engine',
    'salesforce_connector',
    'hubspot_connector',
    'stripe_payment',
    'shopify_connector'
  ];
  
  return premiumSkills.includes(skillId);
}

// GET endpoint to list available skills
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's license
    const license = await prisma.licenses.findUnique({
      where: { license_key: session.user.licenseKey! },
      include: { license_types: true }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'No valid license found' },
        { status: 403 }
      );
    }

    // Get all skills from registry
    const registry = SkillsRegistry.getInstance();
    const allSkills = registry.getAllSkills();

    // Filter based on license tier
    const tierSkills = license.license_types?.features?.skills || [];
    const hasAllAccess = tierSkills.includes('all');

    const availableSkills = [];
    for (const skill of allSkills) {
      if (!registry.isSkillEnabled(skill.definition.id)) continue;
      
      if (hasAllAccess) {
        availableSkills.push(skill);
      } else {
        const isPremium = await checkIfPremiumSkill(skill.definition.id);
        if (!isPremium || tierSkills.includes(skill.definition.id)) {
          availableSkills.push(skill);
        }
      }
    }
    
    const formattedSkills = availableSkills
      .map(skill => ({
        id: skill.definition.id,
        name: skill.definition.name,
        description: skill.definition.description,
        category: skill.definition.category,
        isPremium: skill.definition.isPremium,
        status: skill.status,
        stats: skill.stats
      }));

    // Group by category
    const skillsByCategory = formattedSkills.reduce((acc: any, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});

    return NextResponse.json({
      total: availableSkills.length,
      skills: availableSkills,
      byCategory: skillsByCategory,
      license: {
        tier: license.license_types?.name,
        hasAllAccess
      }
    });

  } catch (error: any) {
    console.error('Skills listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}