/**
 * Skills API
 * IMPORTANT: This is completely isolated from the chatbot system
 * No shared code or dependencies with chatbot to prevent any disruption
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

// Skills system is feature-flagged - can be disabled instantly if needed
const SKILLS_ENABLED = process.env.SKILLS_ENABLED !== 'false';

/**
 * GET /api/skills
 * List available skills for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Get skills from database
    const skills = await prisma.skills.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        version: true,
        author: true,
        configuration: true,
        created_at: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    // Get user's skill execution history (last 10)
    const recentExecutions = await prisma.skill_executions.findMany({
      where: {
        user_id: authResult.user?.id
      },
      take: 10,
      orderBy: {
        started_at: 'desc'
      },
      select: {
        id: true,
        skill_id: true,
        status: true,
        started_at: true,
        completed_at: true
      }
    });

    return NextResponse.json({
      skills,
      recentExecutions,
      totalSkills: skills.length,
      enabled: SKILLS_ENABLED
    });

  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 * Execute a skill
 */
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
    const { skillId, params } = data;

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Check if skill exists and is active
    const skill = await prisma.skills.findFirst({
      where: {
        id: skillId,
        active: true
      }
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found or inactive' },
        { status: 404 }
      );
    }

    // Create execution record
    const execution = await prisma.skill_executions.create({
      data: {
        skill_id: skillId,
        user_id: authResult.user?.id || 'anonymous',
        tenant_id: authResult.user?.tenant_id || 'default',
        input_params: params || {},
        status: 'pending',
        started_at: new Date()
      }
    });

    // For now, we'll simulate skill execution
    // In production, this would call the actual skill orchestrator
    const mockResult = {
      success: true,
      data: {
        message: `Skill '${skill.name}' executed successfully`,
        skillId,
        params,
        timestamp: new Date().toISOString()
      }
    };

    // Update execution record
    await prisma.skill_executions.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        output_result: mockResult,
        completed_at: new Date()
      }
    });

    return NextResponse.json({
      executionId: execution.id,
      result: mockResult,
      skill: {
        id: skill.id,
        name: skill.name
      }
    });

  } catch (error) {
    console.error('Skill execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute skill' },
      { status: 500 }
    );
  }
}