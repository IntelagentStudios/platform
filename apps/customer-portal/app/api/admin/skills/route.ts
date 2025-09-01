/**
 * Admin Skills API
 * Manages skills registry for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/auth-validator';
import { SkillFactory, SkillsRegistry } from '@intelagent/skills-orchestrator';

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
    
    // Mock database skills for now (skills table doesn't exist yet)
    const dbSkillsMap = new Map();

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
        
        // Database operations disabled until skills table is created
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} enabled`
        });

      case 'disable':
        // Disable skill in registry
        registry.disableSkill(skillId);
        
        // Database operations disabled until skills table is created
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} disabled`
        });

      case 'configure':
        // Database operations disabled until skills table is created
        
        return NextResponse.json({
          success: true,
          message: `Skill ${skillId} configured`
        });

      case 'sync':
        // Database operations disabled until skills table is created
        const allSkills = SkillFactory.getAllSkills();
        
        return NextResponse.json({
          success: true,
          message: `Would sync ${allSkills.length} skills to database (table not created yet)`
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