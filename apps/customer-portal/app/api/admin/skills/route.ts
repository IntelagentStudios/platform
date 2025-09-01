/**
 * Admin Skills API
 * Manages skills registry for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/auth-validator';
import { SkillFactory } from '@intelagent/skills-orchestrator/src/skills/SkillFactory';
import { SkillsRegistry } from '@intelagent/skills-orchestrator/src/skills/registry';

export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get registry instance
    const registry = SkillsRegistry.getInstance();
    
    // Fetch skills from database (for persistence)
    const dbSkills = await prisma.skills.findMany({
      include: includeStats ? {
        _count: {
          select: { skill_executions: true }
        }
      } : undefined,
      orderBy: { created_at: 'desc' }
    });

    // Create a map of database skills
    const dbSkillsMap = new Map(dbSkills.map(s => [s.id, s]));

    // Get all skills from factory
    let factorySkills = SkillFactory.getAllSkills();
    
    // Apply filters
    if (category && category !== 'all') {
      factorySkills = factorySkills.filter(s => s.category === category);
    }
    
    if (search) {
      factorySkills = SkillFactory.searchSkills(search);
    }

    // Merge factory definitions with database data
    const mergedSkills = await Promise.all(factorySkills.map(async (factorySkill) => {
      const dbSkill = dbSkillsMap.get(factorySkill.id);
      const registryStats = registry.getSkillStats(factorySkill.id);
      
      // If skill exists in DB, merge data
      if (dbSkill) {
        // Get execution statistics if requested
        let stats = null;
        if (includeStats) {
          const executions = await prisma.skill_executions.findMany({
            where: { skill_id: factorySkill.id },
            select: {
              status: true,
              started_at: true,
              completed_at: true
            },
            take: 100,
            orderBy: { started_at: 'desc' }
          });

          const successCount = executions.filter(e => e.status === 'completed').length;
          const totalDuration = executions.reduce((sum, e) => {
            if (e.completed_at && e.started_at) {
              return sum + (e.completed_at.getTime() - e.started_at.getTime());
            }
            return sum;
          }, 0);

          stats = {
            execution_count: dbSkill._count?.skill_executions || 0,
            success_rate: executions.length > 0 ? (successCount / executions.length * 100) : 100,
            avg_duration: executions.length > 0 ? Math.round(totalDuration / executions.length) : 0,
            last_executed: executions[0]?.started_at || null
          };
        }

        return {
          id: factorySkill.id,
          name: factorySkill.name,
          description: factorySkill.description,
          category: factorySkill.category,
          tags: factorySkill.tags,
          version: dbSkill.version,
          author: dbSkill.author,
          active: dbSkill.active,
          configuration: dbSkill.configuration,
          isPremium: factorySkill.isPremium || false,
          requiredParams: factorySkill.requiredParams || [],
          optionalParams: factorySkill.optionalParams || [],
          created_at: dbSkill.created_at,
          updated_at: dbSkill.updated_at,
          ...(stats && { stats }),
          // Add registry stats if available
          registryStats: registryStats || undefined
        };
      } else {
        // Skill not in DB yet, use factory definition
        return {
          id: factorySkill.id,
          name: factorySkill.name,
          description: factorySkill.description,
          category: factorySkill.category,
          tags: factorySkill.tags,
          version: '1.0.0',
          author: 'Intelagent',
          active: true,
          configuration: {},
          isPremium: factorySkill.isPremium || false,
          requiredParams: factorySkill.requiredParams || [],
          optionalParams: factorySkill.optionalParams || [],
          created_at: new Date(),
          updated_at: new Date(),
          stats: {
            execution_count: 0,
            success_rate: 100,
            avg_duration: 0,
            last_executed: null
          },
          registryStats: registryStats || undefined
        };
      }
    }));

    // Get categories with counts
    const categories = SkillFactory.getCategories().map(cat => ({
      name: cat,
      count: SkillFactory.getSkillsByCategory(cat).length
    }));

    // Get registry statistics
    const registryStats = registry.getRegistryStats();

    return NextResponse.json({
      skills: mergedSkills,
      total: mergedSkills.length,
      categories,
      registryStats,
      factoryTotal: SkillFactory.getSkillCount()
    });

  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { action, skillId, config } = data;

    const registry = SkillsRegistry.getInstance();

    switch (action) {
      case 'enable':
        // Enable skill in registry
        registry.enableSkill(skillId);
        
        // Update or create in database
        await prisma.skills.upsert({
          where: { id: skillId },
          update: { active: true },
          create: {
            id: skillId,
            name: data.name || skillId,
            description: data.description || '',
            category: data.category || 'utility',
            version: '1.0.0',
            author: 'Admin',
            active: true,
            configuration: config || {}
          }
        });
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} enabled`
        });

      case 'disable':
        // Disable skill in registry
        registry.disableSkill(skillId);
        
        // Update in database
        await prisma.skills.update({
          where: { id: skillId },
          data: { active: false }
        });
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} disabled`
        });

      case 'configure':
        // Update skill configuration
        await prisma.skills.update({
          where: { id: skillId },
          data: { configuration: config }
        });
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} configured`
        });

      case 'sync':
        // Sync all factory skills to database
        const allSkills = SkillFactory.getAllSkills();
        
        for (const skill of allSkills) {
          await prisma.skills.upsert({
            where: { id: skill.id },
            update: {
              name: skill.name,
              description: skill.description,
              category: skill.category
            },
            create: {
              id: skill.id,
              name: skill.name,
              description: skill.description,
              category: skill.category,
              version: '1.0.0',
              author: 'System',
              active: true,
              configuration: {}
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          message: `Synced ${allSkills.length} skills to database`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error managing skill:', error);
    return NextResponse.json(
      { error: 'Failed to manage skill' },
      { status: 500 }
    );
  }
}