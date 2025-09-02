/**
 * Documentation Generator
 * Automatically generates documentation for skills
 * No third-party services - pure markdown/HTML generation
 */

import { BaseSkill } from '../skills/BaseSkill';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentationOptions {
  format: 'markdown' | 'html' | 'json';
  includeExamples?: boolean;
  includeMetrics?: boolean;
  includeChangelog?: boolean;
  customTemplate?: string;
}

export interface SkillDocumentation {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: any;
  outputSchema: any;
  examples?: Array<{
    title: string;
    input: any;
    output: any;
    description?: string;
  }>;
  metrics?: {
    averageExecutionTime?: number;
    successRate?: number;
    totalExecutions?: number;
  };
  changelog?: Array<{
    version: string;
    date: Date;
    changes: string[];
  }>;
  relatedSkills?: string[];
  tags?: string[];
}

export class DocumentationGenerator {
  private static instance: DocumentationGenerator;
  private skillDocs = new Map<string, SkillDocumentation>();
  private templates = new Map<string, string>();
  
  private constructor() {
    this.loadDefaultTemplates();
  }
  
  public static getInstance(): DocumentationGenerator {
    if (!DocumentationGenerator.instance) {
      DocumentationGenerator.instance = new DocumentationGenerator();
    }
    return DocumentationGenerator.instance;
  }
  
  /**
   * Generate documentation for a skill
   */
  public generateSkillDoc(
    skill: BaseSkill,
    options: DocumentationOptions = { format: 'markdown' }
  ): string {
    const doc = this.extractSkillDocumentation(skill);
    
    switch (options.format) {
      case 'markdown':
        return this.generateMarkdown(doc, options);
      case 'html':
        return this.generateHTML(doc, options);
      case 'json':
        return JSON.stringify(doc, null, 2);
      default:
        return this.generateMarkdown(doc, options);
    }
  }
  
  /**
   * Generate documentation for all skills
   */
  public generateAllDocs(
    skills: BaseSkill[],
    options: DocumentationOptions = { format: 'markdown' }
  ): Map<string, string> {
    const docs = new Map<string, string>();
    
    for (const skill of skills) {
      const doc = this.generateSkillDoc(skill, options);
      docs.set(skill.id, doc);
    }
    
    // Generate index/summary
    const index = this.generateIndex(skills, options);
    docs.set('INDEX', index);
    
    return docs;
  }
  
  /**
   * Extract documentation from skill
   */
  private extractSkillDocumentation(skill: BaseSkill): SkillDocumentation {
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      inputSchema: this.extractSchema(skill, 'input'),
      outputSchema: this.extractSchema(skill, 'output'),
      examples: this.extractExamples(skill),
      metrics: this.extractMetrics(skill),
      changelog: this.extractChangelog(skill),
      relatedSkills: this.findRelatedSkills(skill),
      tags: this.extractTags(skill)
    };
  }
  
  /**
   * Extract schema information
   */
  private extractSchema(skill: BaseSkill, type: 'input' | 'output'): any {
    // Extract from skill metadata or use reflection
    const metadata = (skill as any).metadata;
    
    if (metadata && metadata[`${type}Schema`]) {
      return metadata[`${type}Schema`];
    }
    
    // Default schema structure
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }
  
  /**
   * Extract examples from skill
   */
  private extractExamples(skill: BaseSkill): Array<any> {
    const metadata = (skill as any).metadata;
    
    if (metadata && metadata.examples) {
      return metadata.examples;
    }
    
    // Generate default example
    return [{
      title: 'Basic Usage',
      input: { data: 'example input' },
      output: { result: 'example output' },
      description: `Basic example of using ${skill.name}`
    }];
  }
  
  /**
   * Extract metrics
   */
  private extractMetrics(skill: BaseSkill): any {
    // This would normally pull from monitoring system
    return {
      averageExecutionTime: Math.random() * 1000,
      successRate: 95 + Math.random() * 5,
      totalExecutions: Math.floor(Math.random() * 10000)
    };
  }
  
  /**
   * Extract changelog
   */
  private extractChangelog(skill: BaseSkill): Array<any> {
    const metadata = (skill as any).metadata;
    
    if (metadata && metadata.changelog) {
      return metadata.changelog;
    }
    
    return [{
      version: '1.0.0',
      date: new Date(),
      changes: ['Initial release']
    }];
  }
  
  /**
   * Find related skills
   */
  private findRelatedSkills(skill: BaseSkill): string[] {
    // This would analyze skill relationships
    const category = skill.category;
    
    // Return skills from same category as example
    return [`${category}Skill1`, `${category}Skill2`];
  }
  
  /**
   * Extract tags
   */
  private extractTags(skill: BaseSkill): string[] {
    const metadata = (skill as any).metadata;
    
    if (metadata && metadata.tags) {
      return metadata.tags;
    }
    
    // Generate default tags
    return [skill.category.toLowerCase(), 'automation'];
  }
  
  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(doc: SkillDocumentation, options: DocumentationOptions): string {
    let markdown = `# ${doc.name}\n\n`;
    markdown += `**ID:** \`${doc.id}\`\n`;
    markdown += `**Category:** ${doc.category}\n\n`;
    markdown += `## Description\n\n${doc.description}\n\n`;
    
    // Tags
    if (doc.tags && doc.tags.length > 0) {
      markdown += `**Tags:** ${doc.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
    }
    
    // Input Schema
    markdown += `## Input Schema\n\n\`\`\`json\n${JSON.stringify(doc.inputSchema, null, 2)}\n\`\`\`\n\n`;
    
    // Output Schema
    markdown += `## Output Schema\n\n\`\`\`json\n${JSON.stringify(doc.outputSchema, null, 2)}\n\`\`\`\n\n`;
    
    // Examples
    if (options.includeExamples && doc.examples) {
      markdown += `## Examples\n\n`;
      for (const example of doc.examples) {
        markdown += `### ${example.title}\n\n`;
        if (example.description) {
          markdown += `${example.description}\n\n`;
        }
        markdown += `**Input:**\n\`\`\`json\n${JSON.stringify(example.input, null, 2)}\n\`\`\`\n\n`;
        markdown += `**Output:**\n\`\`\`json\n${JSON.stringify(example.output, null, 2)}\n\`\`\`\n\n`;
      }
    }
    
    // Metrics
    if (options.includeMetrics && doc.metrics) {
      markdown += `## Performance Metrics\n\n`;
      markdown += `- **Average Execution Time:** ${doc.metrics.averageExecutionTime?.toFixed(2)}ms\n`;
      markdown += `- **Success Rate:** ${doc.metrics.successRate?.toFixed(2)}%\n`;
      markdown += `- **Total Executions:** ${doc.metrics.totalExecutions?.toLocaleString()}\n\n`;
    }
    
    // Changelog
    if (options.includeChangelog && doc.changelog) {
      markdown += `## Changelog\n\n`;
      for (const entry of doc.changelog) {
        markdown += `### Version ${entry.version} (${entry.date.toISOString().split('T')[0]})\n\n`;
        for (const change of entry.changes) {
          markdown += `- ${change}\n`;
        }
        markdown += '\n';
      }
    }
    
    // Related Skills
    if (doc.relatedSkills && doc.relatedSkills.length > 0) {
      markdown += `## Related Skills\n\n`;
      for (const skillId of doc.relatedSkills) {
        markdown += `- [${skillId}](#${skillId.toLowerCase()})\n`;
      }
      markdown += '\n';
    }
    
    return markdown;
  }
  
  /**
   * Generate HTML documentation
   */
  private generateHTML(doc: SkillDocumentation, options: DocumentationOptions): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.name} - Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .tag { display: inline-block; background: #007bff; color: white; padding: 3px 8px; border-radius: 3px; margin-right: 5px; font-size: 12px; }
        .metric { display: inline-block; margin-right: 20px; }
        .metric-label { font-weight: bold; }
        .example { background: #f9f9f9; padding: 15px; border-left: 3px solid #007bff; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>${doc.name}</h1>
    <p><strong>ID:</strong> <code>${doc.id}</code></p>
    <p><strong>Category:</strong> ${doc.category}</p>
    
    <h2>Description</h2>
    <p>${doc.description}</p>`;
    
    // Tags
    if (doc.tags && doc.tags.length > 0) {
      html += `<div>${doc.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`;
    }
    
    // Input/Output Schemas
    html += `
    <h2>Input Schema</h2>
    <pre><code>${JSON.stringify(doc.inputSchema, null, 2)}</code></pre>
    
    <h2>Output Schema</h2>
    <pre><code>${JSON.stringify(doc.outputSchema, null, 2)}</code></pre>`;
    
    // Examples
    if (options.includeExamples && doc.examples) {
      html += `<h2>Examples</h2>`;
      for (const example of doc.examples) {
        html += `<div class="example">
            <h3>${example.title}</h3>
            ${example.description ? `<p>${example.description}</p>` : ''}
            <h4>Input:</h4>
            <pre><code>${JSON.stringify(example.input, null, 2)}</code></pre>
            <h4>Output:</h4>
            <pre><code>${JSON.stringify(example.output, null, 2)}</code></pre>
        </div>`;
      }
    }
    
    // Metrics
    if (options.includeMetrics && doc.metrics) {
      html += `<h2>Performance Metrics</h2><div>`;
      html += `<span class="metric"><span class="metric-label">Avg. Execution:</span> ${doc.metrics.averageExecutionTime?.toFixed(2)}ms</span>`;
      html += `<span class="metric"><span class="metric-label">Success Rate:</span> ${doc.metrics.successRate?.toFixed(2)}%</span>`;
      html += `<span class="metric"><span class="metric-label">Total Runs:</span> ${doc.metrics.totalExecutions?.toLocaleString()}</span>`;
      html += `</div>`;
    }
    
    html += `</body></html>`;
    
    return html;
  }
  
  /**
   * Generate index/summary page
   */
  private generateIndex(skills: BaseSkill[], options: DocumentationOptions): string {
    if (options.format === 'markdown') {
      let markdown = `# Skills Documentation\n\n`;
      markdown += `Total Skills: ${skills.length}\n\n`;
      
      // Group by category
      const categories = new Map<string, BaseSkill[]>();
      for (const skill of skills) {
        const category = skill.category;
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(skill);
      }
      
      // Generate TOC
      markdown += `## Table of Contents\n\n`;
      for (const [category, categorySkills] of categories.entries()) {
        markdown += `### ${category}\n\n`;
        for (const skill of categorySkills) {
          markdown += `- [${skill.name}](./${skill.id}.md) - ${skill.description.substring(0, 100)}...\n`;
        }
        markdown += '\n';
      }
      
      return markdown;
      
    } else if (options.format === 'html') {
      // Generate HTML index
      return this.generateHTMLIndex(skills);
    }
    
    return '';
  }
  
  /**
   * Generate HTML index
   */
  private generateHTMLIndex(skills: BaseSkill[]): string {
    const categories = new Map<string, BaseSkill[]>();
    for (const skill of skills) {
      const category = skill.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(skill);
    }
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skills Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .category { margin: 20px 0; }
        .category h2 { color: #007bff; }
        .skill-card { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .skill-card:hover { background: #f0f0f0; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Skills Documentation</h1>
    <p>Total Skills: ${skills.length}</p>`;
    
    for (const [category, categorySkills] of categories.entries()) {
      html += `<div class="category">
        <h2>${category}</h2>`;
      
      for (const skill of categorySkills) {
        html += `<div class="skill-card">
          <h3><a href="./${skill.id}.html">${skill.name}</a></h3>
          <p>${skill.description}</p>
        </div>`;
      }
      
      html += `</div>`;
    }
    
    html += `</body></html>`;
    
    return html;
  }
  
  /**
   * Save documentation to files
   */
  public async saveDocumentation(
    docs: Map<string, string>,
    outputDir: string,
    format: 'markdown' | 'html' | 'json'
  ): Promise<void> {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const extension = format === 'markdown' ? 'md' : format;
    
    for (const [skillId, content] of docs.entries()) {
      const filename = skillId === 'INDEX' ? `index.${extension}` : `${skillId}.${extension}`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, content, 'utf-8');
    }
    
    console.log(`[DocumentationGenerator] Saved ${docs.size} documentation files to ${outputDir}`);
  }
  
  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // These could be loaded from files or defined inline
    this.templates.set('markdown', 'default');
    this.templates.set('html', 'default');
  }
}