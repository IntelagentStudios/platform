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

    // Get user's license - lookup by email
    let license = null;
    if (session.user.email) {
      const user = await prisma.users.findFirst({
        where: { email: session.user.email },
        select: { license_key: true }
      });
      
      if (user?.license_key) {
        license = await prisma.licenses.findUnique({
          where: { license_key: user.license_key }
        });
      }
    }

    if (!license) {
      return NextResponse.json(
        { error: 'No valid license found' },
        { status: 403 }
      );
    }

    // Import skills from orchestrator
    const { SkillsRegistry, SkillFactory } = await import('@intelagent/skills-orchestrator');
    const registry = SkillsRegistry.getInstance();
    const allSkillDefs = SkillFactory.getAllSkills();

    // Determine user's tier and accessible skills
    const tier = license.plan || 'free';
    const isPro = license.is_pro === true;
    const hasAllAccess = license.products?.includes('all') || false;

    // Filter skills based on tier
    const availableSkills = allSkillDefs
      .filter(skill => {
        // All skills are enabled in fallback build
        
        // Enterprise gets everything
        if (hasAllAccess) return true;
        
        // Pro gets most skills
        if (isPro && !skill.isPremium) return true;
        
        // Free tier gets basic skills
        const freeSkills = [
          'calculator', 'datetime', 'weather', 
          'text_summarizer', 'language_detector',
          'url_shortener', 'qr_generator', 'uuid_generator'
        ];
        
        return freeSkills.includes(skill.id);
      })
      .map(skill => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        isPremium: skill.isPremium,
        status: 'enabled',
        stats: {}
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