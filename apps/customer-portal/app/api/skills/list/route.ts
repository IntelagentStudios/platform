/**
 * Skills List API
 * Returns available skills based on user's license tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get session
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
      include: { 
        license_types: true,
        users: true
      }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'No valid license found' },
        { status: 403 }
      );
    }

    // Import skills from orchestrator
    const { SkillsRegistry } = await import('@intelagent/skills-orchestrator');
    const registry = SkillsRegistry.getInstance();
    const allSkills = registry.getAllSkills();

    // Determine user's tier and accessible skills
    const tier = license.license_types?.name || 'free';
    const isPro = tier === 'professional' || tier === 'enterprise';
    const hasAllAccess = tier === 'enterprise';

    // Filter skills based on tier
    const availableSkills = allSkills
      .filter(skill => {
        // Check if skill is enabled
        if (!registry.isSkillEnabled(skill.definition.id)) {
          return false;
        }
        
        // Enterprise gets everything
        if (hasAllAccess) return true;
        
        // Pro gets most skills
        if (isPro && !skill.definition.isPremium) return true;
        
        // Free tier gets basic skills
        const freeSkills = [
          'calculator', 'datetime', 'weather', 
          'text_summarizer', 'language_detector',
          'url_shortener', 'qr_generator', 'uuid_generator'
        ];
        
        return freeSkills.includes(skill.definition.id);
      })
      .map(skill => ({
        id: skill.definition.id,
        name: skill.definition.name,
        description: skill.definition.description,
        category: skill.definition.category,
        isPremium: skill.definition.isPremium,
        status: skill.status,
        stats: skill.stats
      }));

    // Get execution stats from database
    const executionStats = await prisma.skill_executions.groupBy({
      by: ['skill_id'],
      where: {
        license_key: license.license_key,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: true,
      _avg: {
        execution_time: true
      }
    });

    // Merge stats with skills
    const skillsWithStats = availableSkills.map(skill => {
      const stats = executionStats.find(s => s.skill_id === skill.id);
      if (stats) {
        return {
          ...skill,
          stats: {
            ...skill.stats,
            totalExecutions: stats._count,
            averageTime: stats._avg.execution_time || 0
          }
        };
      }
      return skill;
    });

    // Group by category
    const skillsByCategory = skillsWithStats.reduce((acc: any, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});

    return NextResponse.json({
      total: skillsWithStats.length,
      skills: skillsWithStats,
      byCategory: skillsByCategory,
      license: {
        tier,
        hasAllAccess,
        isPro
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