/**
 * Individual Skill API
 * Get details about a specific skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { SkillsRegistry, SkillFactory } from '@intelagent/skills-orchestrator';

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

    // Get skill from registry/factory
    const registry = SkillsRegistry.getInstance();
    const registrySkill = registry.getSkill(params.id);
    
    // Also check SkillFactory for definition
    const skillDefinition = registrySkill ? null : SkillFactory.getSkillDefinition(params.id);
    
    if (!registrySkill && !skillDefinition) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get skill statistics from registry
    const registryStats = registry.getSkillStats(params.id);

    // Use either registry skill or factory definition
    const skillInfo = registrySkill ? {
      id: params.id,
      name: params.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Skill: ${params.id}`,
      category: 'utility',
      tags: [],
      isPremium: false,
      requiredParams: [],
      optionalParams: [],
    } : {
      id: skillDefinition!.id,
      name: skillDefinition!.name,
      description: skillDefinition!.description,
      category: skillDefinition!.category,
      tags: skillDefinition!.tags || [],
      isPremium: skillDefinition!.isPremium || false,
      requiredParams: skillDefinition!.requiredParams || [],
      optionalParams: skillDefinition!.optionalParams || [],
    };

    // Return skill information without database data
    return NextResponse.json({
      skill: {
        ...skillInfo,
        version: '1.0.0',
        author: 'Intelagent',
        active: true
      },
      executions: [], // No execution history yet
      stats: {
        totalExecutions: registryStats?.totalExecutions || 0,
        userExecutions: 0,
        successRate: registryStats?.successRate || 0,
        avgDuration: registryStats?.avgDuration || 0
      }
    });

  } catch (error) {
    console.error('Skill detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill details' },
      { status: 500 }
    );
  }
}