/**
 * Skill Registrar
 * Automatically registers all implemented skills in the system
 */

import { SkillsRegistry } from './registry';
import { ALL_SKILLS } from './impl/getAllSkills';
import { BaseSkill } from './BaseSkill';

export class SkillRegistrar {
  private static instance: SkillRegistrar;
  private registry: SkillsRegistry;
  private registered: boolean = false;

  private constructor() {
    this.registry = SkillsRegistry.getInstance();
  }

  public static getInstance(): SkillRegistrar {
    if (!SkillRegistrar.instance) {
      SkillRegistrar.instance = new SkillRegistrar();
    }
    return SkillRegistrar.instance;
  }

  /**
   * Register all available skills
   */
  public registerAllSkills(): void {
    if (this.registered) {
      console.log('Skills already registered');
      return;
    }

    console.log(`Registering ${ALL_SKILLS.length} skills...`);
    
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const SkillClass of ALL_SKILLS) {
      try {
        // Create instance to get metadata
        const skillInstance = new SkillClass() as BaseSkill;
        const metadata = skillInstance.metadata;
        
        // Register the skill class
        this.registry.register(metadata.id, SkillClass);
        successCount++;
        
        console.log(`✓ Registered: ${metadata.name} (${metadata.id})`);
      } catch (error: any) {
        failureCount++;
        const errorMsg = `Failed to register ${SkillClass.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    this.registered = true;

    // Summary
    console.log('\n=== Skill Registration Summary ===');
    console.log(`✅ Successfully registered: ${successCount} skills`);
    
    if (failureCount > 0) {
      console.log(`❌ Failed to register: ${failureCount} skills`);
      console.log('Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log(`📊 Total available skills: ${this.registry.getAllSkills().length}`);
    console.log('==================================\n');
  }

  /**
   * Get registration status
   */
  public isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Get count of registered skills
   */
  public getSkillCount(): number {
    return this.registry.getAllSkills().length;
  }

  /**
   * List all registered skill IDs
   */
  public listSkillIds(): string[] {
    return this.registry.getAllSkills().map((skill: any) => {
      const instance = new skill() as BaseSkill;
      return instance.metadata.id;
    });
  }

  /**
   * List skills by category
   */
  public listSkillsByCategory(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    
    this.registry.getAllSkills().forEach((SkillClass: any) => {
      const instance = new SkillClass() as BaseSkill;
      const category = instance.metadata.category;
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(instance.metadata.id);
    });
    
    return categories;
  }

  /**
   * Get skill metadata
   */
  public getSkillMetadata(skillId: string): any {
    const SkillClass = this.registry.get(skillId);
    if (SkillClass) {
      const instance = new SkillClass() as BaseSkill;
      return instance.metadata;
    }
    return null;
  }

  /**
   * Reset registration (mainly for testing)
   */
  public reset(): void {
    this.registered = false;
    // Note: We don't clear the registry as other parts might be using it
  }
}

// Auto-register on import (can be disabled if needed)
if (process.env.AUTO_REGISTER_SKILLS !== 'false') {
  SkillRegistrar.getInstance().registerAllSkills();
}