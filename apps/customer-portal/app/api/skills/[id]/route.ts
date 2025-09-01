/**
 * Individual Skill API
 * Get details about a specific skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { prisma } from '@/lib/prisma';

const SKILLS_ENABLED = process.env.SKILLS_ENABLED !== 'false';

/**
 * GET /api/skills/[id]
 * Get details about a specific skill
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const skill = await prisma.skills.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { skill_executions: true }
        }
      }
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get execution statistics for this skill
    const executions = await prisma.skill_executions.findMany({
      where: {
        skill_id: params.id,
        user_id: authResult.user?.id
      },
      orderBy: { started_at: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        started_at: true,
        completed_at: true,
        input_params: true,
        output_result: true
      }
    });

    const stats = {
      totalExecutions: skill._count.skill_executions,
      userExecutions: executions.length,
      successRate: executions.length > 0
        ? (executions.filter(e => e.status === 'completed').length / executions.length) * 100
        : 0
    };

    return NextResponse.json({
      skill,
      executions,
      stats
    });

  } catch (error) {
    console.error('Skill detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill details' },
      { status: 500 }
    );
  }
}