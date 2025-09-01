/**
 * Skills Execution API
 * Handles skill execution requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';
import { SkillsRegistry } from '@intelagent/skills-orchestrator/src/skills/registry';
import { SkillExecutor } from '@intelagent/skills-orchestrator/src/executor';

const SKILLS_ENABLED = process.env.SKILLS_ENABLED !== 'false';

export async function POST(request: NextRequest) {
  // Feature flag check
  if (!SKILLS_ENABLED) {
    return NextResponse.json(
      { error: 'Skills system is currently disabled' },
      { status: 503 }
    );
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { skillId, params, options = {} } = data;

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Check if skill exists and is active in database
    const dbSkill = await prisma.skills.findFirst({
      where: {
        id: skillId,
        active: true
      }
    });

    if (!dbSkill) {
      // If not in DB, check if it exists in factory and create it
      const registry = SkillsRegistry.getInstance();
      const registrySkill = registry.getSkill(skillId);
      
      if (!registrySkill) {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        );
      }
      
      // Create skill in database
      await prisma.skills.create({
        data: {
          id: skillId,
          name: registrySkill.definition.name,
          description: registrySkill.definition.description,
          category: registrySkill.definition.category,
          version: '1.0.0',
          author: 'System',
          active: true,
          configuration: {}
        }
      });
    }

    // Check user's tier for premium skills
    const registry = SkillsRegistry.getInstance();
    const skillDefinition = registry.getSkill(skillId)?.definition;
    
    if (skillDefinition?.isPremium) {
      // Check if user has premium access
      const userTier = authResult.user?.subscription_tier || 'free';
      if (userTier === 'free' || userTier === 'basic') {
        return NextResponse.json(
          { error: 'This skill requires a Pro or Enterprise subscription' },
          { status: 403 }
        );
      }
    }

    // Create execution record
    const execution = await prisma.skill_executions.create({
      data: {
        skill_id: skillId,
        user_id: authResult.user?.id || 'anonymous',
        tenant_id: authResult.user?.tenant_id || 'default',
        input_params: params || {},
        status: 'running',
        started_at: new Date()
      }
    });

    try {
      // Load and execute skill
      const skill = await registry.loadSkill(skillId);
      
      if (!skill) {
        throw new Error('Failed to load skill implementation');
      }

      // Validate parameters
      if (!skill.validate(params)) {
        throw new Error('Invalid parameters for skill');
      }

      // Execute with timeout
      const executor = new SkillExecutor(registry);
      const result = await executor.execute(skillId, params, {
        timeout: options.timeout || 30000,
        userId: authResult.user?.id,
        metadata: {
          executionId: execution.id,
          source: 'api'
        }
      });

      // Update execution record with result
      await prisma.skill_executions.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'completed' : 'failed',
          output_result: result as any,
          error_message: result.error,
          completed_at: new Date()
        }
      });

      // Update registry statistics
      registry.updateSkillStats(
        skillId,
        result.success,
        result.executionTime || 0
      );

      // Log execution for analytics
      console.log(`[Skill Execution] ${skillId} - ${result.success ? 'Success' : 'Failed'} - ${result.executionTime}ms`);

      return NextResponse.json({
        executionId: execution.id,
        skillId,
        success: result.success,
        data: result.data,
        error: result.error,
        executionTime: result.executionTime,
        metadata: result.metadata
      });

    } catch (error: any) {
      // Update execution record with error
      await prisma.skill_executions.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date()
        }
      });

      // Update registry statistics
      registry.updateSkillStats(skillId, false, 0);

      console.error(`[Skill Execution Error] ${skillId}:`, error);

      return NextResponse.json(
        {
          executionId: execution.id,
          skillId,
          success: false,
          error: error.message || 'Skill execution failed'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Skill execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute skill' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/skills/execute?id=executionId
 * Get execution status and result
 */
export async function GET(request: NextRequest) {
  if (!SKILLS_ENABLED) {
    return NextResponse.json(
      { error: 'Skills system is currently disabled' },
      { status: 503 }
    );
  }

  try {
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('id');

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    const execution = await prisma.skill_executions.findFirst({
      where: {
        id: executionId,
        user_id: authResult.user?.id
      },
      include: {
        skills: {
          select: {
            name: true,
            description: true,
            category: true
          }
        }
      }
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: execution.id,
      skillId: execution.skill_id,
      skill: execution.skills,
      status: execution.status,
      inputParams: execution.input_params,
      outputResult: execution.output_result,
      errorMessage: execution.error_message,
      startedAt: execution.started_at,
      completedAt: execution.completed_at,
      duration: execution.completed_at && execution.started_at
        ? execution.completed_at.getTime() - execution.started_at.getTime()
        : null
    });

  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}