/**
 * Skills API
 * IMPORTANT: This is completely isolated from the chatbot system
 * No shared code or dependencies with chatbot to prevent any disruption
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { SkillsRegistry, SkillFactory } from '@intelagent/skills-orchestrator';

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

    // Get skills from factory since registry might be empty
    const allSkills = SkillFactory.getAllSkills();
    
    // Transform to API response format
    const skills = allSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      version: '1.0.0',
      author: 'Intelagent',
      configuration: {},
      created_at: new Date(),
      tags: skill.tags,
      isPremium: skill.isPremium || false
    }));

    // Mock recent executions for now
    const recentExecutions = [];

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

    // Check if skill exists
    const registry = SkillsRegistry.getInstance();
    const registrySkill = registry.get(skillId);
    const skillDefinition = registrySkill ? null : SkillFactory.getSkillDefinition(skillId);

    if (!registrySkill && !skillDefinition) {
      return NextResponse.json(
        { error: 'Skill not found or inactive' },
        { status: 404 }
      );
    }
    
    const skill = registrySkill || skillDefinition;

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For now, we'll simulate skill execution
    // In production, this would call the actual skill orchestrator
    const mockResult = {
      success: true,
      data: {
        message: `Skill '${skill.name || skillId}' executed successfully`,
        skillId,
        params,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json({
      executionId,
      result: mockResult,
      skill: {
        id: skillId,
        name: skill.name || skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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