/**
 * Template Engine Skill
 * Manages and renders dynamic templates
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class TemplateEngineSkill extends BaseSkill {
  metadata = {
    id: 'template_engine',
    name: 'Template Engine',
    description: 'Manage and render dynamic templates',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['template', 'render', 'dynamic', 'content']
  };

  private templates: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Pre-load common templates
    this.templates.set('email_welcome', {
      subject: 'Welcome to {{company}}!',
      body: `Dear {{name}},

Welcome to {{company}}! We're thrilled to have you join our community.

{{#if personalMessage}}
{{personalMessage}}
{{/if}}

Here's what you can expect:
{{#each features}}
• {{this}}
{{/each}}

Best regards,
The {{company}} Team`
    });

    this.templates.set('invoice', {
      template: `Invoice #{{invoiceNumber}}
Date: {{date}}
Due Date: {{dueDate}}

Bill To:
{{customer.name}}
{{customer.address}}

Items:
{{#each items}}
{{description}} - {{quantity}} x \${{price}} = \${{total}}
{{/each}}

Subtotal: \${{subtotal}}
Tax ({{taxRate}}%): \${{tax}}
Total: \${{total}}`
    });

    this.templates.set('notification', {
      template: `{{#if urgent}}🚨 URGENT: {{/if}}{{title}}

{{message}}

{{#if actionRequired}}
Action Required: {{actionRequired}}
{{/if}}

{{#if link}}
View Details: {{link}}
{{/if}}`
    });
  }

  validate(params: SkillParams): boolean {
    return !!(params.template || params.templateId || params.templateString);
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        templateId, 
        templateString, 
        data = {}, 
        options = {},
        action = 'render'
      } = params;

      let result: any;

      switch (action) {
        case 'render':
          result = await this.renderTemplate(templateId, templateString, data, options);
          break;
        
        case 'validate':
          result = this.validateTemplate(templateId || templateString);
          break;
        
        case 'save':
          result = this.saveTemplate(params.name, params.template);
          break;
        
        case 'list':
          result = this.listTemplates();
          break;
        
        case 'delete':
          result = this.deleteTemplate(templateId);
          break;
        
        case 'compile':
          result = this.compileTemplate(templateString);
          break;
        
        default:
          result = await this.renderTemplate(templateId, templateString, data, options);
      }

      return {
        success: true,
        data: result,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private async renderTemplate(
    templateId?: string, 
    templateString?: string, 
    data: any = {}, 
    options: any = {}
  ): Promise<any> {
    let template: string;

    if (templateId) {
      const storedTemplate = this.templates.get(templateId);
      if (!storedTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }
      template = storedTemplate.body || storedTemplate.template || storedTemplate;
    } else if (templateString) {
      template = templateString;
    } else {
      throw new Error('No template provided');
    }

    // Render the template
    const rendered = this.render(template, data, options);

    // Apply post-processing if needed
    const processed = options.postProcess 
      ? this.postProcess(rendered, options.postProcess)
      : rendered;

    return {
      rendered: processed,
      templateId,
      dataUsed: Object.keys(data),
      length: processed.length,
      options
    };
  }

  private render(template: string, data: any, options: any = {}): string {
    let result = template;

    // Handle variables {{variable}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : match;
    });

    // Handle conditionals {{#if condition}}...{{/if}}
    result = this.handleConditionals(result, data);

    // Handle loops {{#each array}}...{{/each}}
    result = this.handleLoops(result, data);

    // Handle partials {{> partialName}}
    if (options.partials) {
      result = this.handlePartials(result, options.partials);
    }

    // Handle helpers
    if (options.helpers) {
      result = this.handleHelpers(result, data, options.helpers);
    }

    return result;
  }

  private handleConditionals(template: string, data: any): string {
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = this.getNestedValue(data, condition.trim());
      
      // Check for else clause
      const elseMatch = content.match(/\{\{else\}\}([\s\S]*)/);
      if (elseMatch) {
        const [, elseContent] = elseMatch;
        const ifContent = content.substring(0, content.indexOf('{{else}}'));
        return value ? ifContent : elseContent;
      }
      
      return value ? content : '';
    });
  }

  private handleLoops(template: string, data: any): string {
    const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return template.replace(loopRegex, (match, arrayPath, content) => {
      const array = this.getNestedValue(data, arrayPath.trim());
      
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemContent = content;
        
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
        
        // Replace {{@first}} and {{@last}}
        itemContent = itemContent.replace(/\{\{@first\}\}/g, String(index === 0));
        itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1));
        
        // Handle item properties
        if (typeof item === 'object') {
          itemContent = itemContent.replace(/\{\{([^}]+)\}\}/g, (m: string, prop: string) => {
            const value = this.getNestedValue(item, prop.trim());
            return value !== undefined ? String(value) : m;
          });
        }
        
        return itemContent;
      }).join('');
    });
  }

  private handlePartials(template: string, partials: any): string {
    const partialRegex = /\{\{>\s*([^}]+)\}\}/g;
    
    return template.replace(partialRegex, (match, partialName) => {
      const partial = partials[partialName.trim()];
      return partial || match;
    });
  }

  private handleHelpers(template: string, data: any, helpers: any): string {
    const helperRegex = /\{\{([a-zA-Z]+)\s+([^}]+)\}\}/g;
    
    return template.replace(helperRegex, (match, helperName, args) => {
      const helper = helpers[helperName];
      if (!helper) return match;
      
      // Parse arguments
      const argValues = args.split(/\s+/).map((arg: string) => {
        const value = this.getNestedValue(data, arg);
        return value !== undefined ? value : arg;
      });
      
      return String(helper(...argValues));
    });
  }

  private postProcess(content: string, processors: string[]): string {
    let result = content;
    
    processors.forEach(processor => {
      switch (processor) {
        case 'trim':
          result = result.trim();
          break;
        case 'uppercase':
          result = result.toUpperCase();
          break;
        case 'lowercase':
          result = result.toLowerCase();
          break;
        case 'capitalize':
          result = result.replace(/\b\w/g, l => l.toUpperCase());
          break;
        case 'removeEmptyLines':
          result = result.replace(/^\s*[\r\n]/gm, '');
          break;
        case 'minify':
          result = result.replace(/\s+/g, ' ').trim();
          break;
      }
    });
    
    return result;
  }

  private validateTemplate(template: string | any): any {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const templateStr = typeof template === 'string' 
      ? template 
      : (template.body || template.template || '');
    
    // Check for unclosed tags
    const openIfs = (templateStr.match(/\{\{#if/g) || []).length;
    const closeIfs = (templateStr.match(/\{\{\/if/g) || []).length;
    if (openIfs !== closeIfs) {
      errors.push(`Unclosed if statements: ${openIfs - closeIfs}`);
    }
    
    const openEachs = (templateStr.match(/\{\{#each/g) || []).length;
    const closeEachs = (templateStr.match(/\{\{\/each/g) || []).length;
    if (openEachs !== closeEachs) {
      errors.push(`Unclosed each loops: ${openEachs - closeEachs}`);
    }
    
    // Check for malformed variables
    const malformed = templateStr.match(/\{\{[^}]*$/gm);
    if (malformed) {
      errors.push(`Malformed template variables found`);
    }
    
    // Extract variables
    const variables = this.extractVariables(templateStr);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      variables,
      statistics: {
        length: templateStr.length,
        variables: variables.length,
        conditionals: openIfs,
        loops: openEachs
      }
    };
  }

  private extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract simple variables
    const varMatches = template.match(/\{\{([^#/][^}]+)\}\}/g) || [];
    varMatches.forEach(match => {
      const variable = match.replace(/\{\{|\}\}/g, '').trim();
      if (!variable.startsWith('>') && !variable.startsWith('@')) {
        variables.add(variable);
      }
    });
    
    // Extract variables from conditionals
    const ifMatches = template.match(/\{\{#if\s+([^}]+)\}\}/g) || [];
    ifMatches.forEach(match => {
      const variable = match.replace(/\{\{#if\s+|\}\}/g, '').trim();
      variables.add(variable);
    });
    
    // Extract variables from loops
    const eachMatches = template.match(/\{\{#each\s+([^}]+)\}\}/g) || [];
    eachMatches.forEach(match => {
      const variable = match.replace(/\{\{#each\s+|\}\}/g, '').trim();
      variables.add(variable);
    });
    
    return Array.from(variables);
  }

  private saveTemplate(name: string, template: any): any {
    if (!name) {
      throw new Error('Template name is required');
    }
    
    this.templates.set(name, template);
    
    return {
      saved: true,
      name,
      template,
      timestamp: new Date()
    };
  }

  private listTemplates(): any {
    const templates = Array.from(this.templates.entries()).map(([name, template]) => ({
      name,
      type: typeof template === 'string' ? 'string' : 'object',
      hasSubject: !!(template.subject),
      hasBody: !!(template.body),
      variables: this.extractVariables(
        typeof template === 'string' ? template : (template.body || template.template || '')
      )
    }));
    
    return {
      count: templates.length,
      templates
    };
  }

  private deleteTemplate(templateId: string): any {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    const existed = this.templates.has(templateId);
    this.templates.delete(templateId);
    
    return {
      deleted: existed,
      templateId
    };
  }

  private compileTemplate(template: string): any {
    // Pre-compile template for faster rendering
    const compiled = {
      original: template,
      variables: this.extractVariables(template),
      hasConditionals: template.includes('{{#if'),
      hasLoops: template.includes('{{#each'),
      hasPartials: template.includes('{{>'),
      optimized: this.optimizeTemplate(template)
    };
    
    return compiled;
  }

  private optimizeTemplate(template: string): string {
    // Remove unnecessary whitespace while preserving structure
    return template
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim();
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getConfig(): Record<string, any> {
    return {
      syntaxStyle: 'handlebars',
      features: ['variables', 'conditionals', 'loops', 'partials', 'helpers'],
      maxTemplateSize: 100000,
      maxRenderDepth: 10,
      builtInTemplates: Array.from(this.templates.keys())
    };
  }
}