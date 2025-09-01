/**
 * Skills Execution API
 * Handles skill execution requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';
import { SkillsRegistry } from '@intelagent/skills-orchestrator';

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

    // Check if skill exists in registry
    const registry = SkillsRegistry.getInstance();
    const registrySkill = registry.getSkill(skillId);
    
    if (!registrySkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Check user's tier for premium skills
    const skillDefinition = registrySkill.definition;
    
    if (skillDefinition?.isPremium) {
      // Check if user has premium access
      const userIsPro = authResult.user?.is_pro || false;
      if (!userIsPro) {
        return NextResponse.json(
          { error: 'This skill requires a Pro or Enterprise subscription' },
          { status: 403 }
        );
      }
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Load and execute skill
      const startTime = Date.now();
      const skill = await registry.loadSkill(skillId);
      
      if (!skill) {
        throw new Error('Failed to load skill implementation');
      }

      // Validate parameters
      if (!skill.validate(params)) {
        throw new Error('Invalid parameters for skill');
      }

      // Execute skill directly
      const result = await skill.execute(params);
      const executionTime = Date.now() - startTime;

      // Update registry statistics
      registry.updateSkillStats(
        skillId,
        result.success,
        executionTime
      );

      // Log execution for analytics
      console.log(`[Skill Execution] ${skillId} - ${result.success ? 'Success' : 'Failed'} - ${executionTime}ms`);

      return NextResponse.json({
        executionId,
        skillId,
        success: result.success,
        data: result.data,
        error: result.error,
        executionTime,
        metadata: result.metadata
      });

    } catch (error: any) {
      // Update registry statistics
      registry.updateSkillStats(skillId, false, 0);

      console.error(`[Skill Execution Error] ${skillId}:`, error);

      return NextResponse.json(
        {
          executionId,
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

    // Return mock execution data for now
    // In production, this would query the skill_executions table
    return NextResponse.json({
      id: executionId,
      skillId: 'unknown',
      status: 'completed',
      message: 'Execution tracking not yet available'
    });

  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    );
  }
}