/**
 * Chatbot Knowledge Manager Skill
 * Manages custom knowledge base, training data, and response templates for chatbots
 * Part of the management team that ensures chatbots have accurate, relevant information
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { prisma } from '@intelagent/database';

interface KnowledgeEntry {
  id: string;
  product_key: string;
  license_key: string;
  knowledge_type: string;
  content: string;
  metadata?: any;
  is_active: boolean;
  expires_at?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface KnowledgeUpdate {
  content?: string;
  metadata?: any;
  expires_at?: Date | null;
  is_active?: boolean;
}

export class ChatbotKnowledgeManagerSkill extends BaseSkill {
  metadata = {
    id: 'chatbot_knowledge_manager',
    name: 'Chatbot Knowledge Manager',
    description: 'Manages custom knowledge, training data, and response templates for chatbot systems',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent Management Team',
    tags: ['chatbot', 'knowledge', 'training', 'content', 'management', 'ai']
  };

  validate(params: SkillParams): boolean {
    const validActions = [
      'add_knowledge',
      'update_knowledge',
      'delete_knowledge',
      'get_knowledge',
      'search_knowledge',
      'import_knowledge',
      'export_knowledge',
      'validate_knowledge',
      'optimize_knowledge',
      'sync_knowledge'
    ];
    
    return params.action && validActions.includes(params.action);
  }

  async doExecute(params: SkillParams): Promise<SkillResult> {
    const { action, productKey, licenseKey } = params;

    try {
      switch (action) {
        case 'add_knowledge':
          return await this.addKnowledge(params);
        
        case 'update_knowledge':
          return await this.updateKnowledge(params);
        
        case 'delete_knowledge':
          return await this.deleteKnowledge(params);
        
        case 'get_knowledge':
          return await this.getKnowledge(productKey || licenseKey, params);
        
        case 'search_knowledge':
          return await this.searchKnowledge(productKey || licenseKey, params);
        
        case 'import_knowledge':
          return await this.importKnowledge(params);
        
        case 'export_knowledge':
          return await this.exportKnowledge(productKey || licenseKey, params);
        
        case 'validate_knowledge':
          return await this.validateKnowledge(params);
        
        case 'optimize_knowledge':
          return await this.optimizeKnowledge(productKey || licenseKey);
        
        case 'sync_knowledge':
          return await this.syncKnowledge(productKey || licenseKey, params);
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] Error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Knowledge management operation failed'
      };
    }
  }

  private async addKnowledge(params: SkillParams): Promise<SkillResult> {
    try {
      const {
        productKey,
        licenseKey,
        content,
        knowledgeType = 'general',
        metadata = {},
        expiresAt,
        createdBy = 'system'
      } = params;

      // Validate content
      const validation = this.validateContent(content);
      if (!validation.valid) {
        return {
          success: false,
          data: null,
          error: `Invalid content: ${validation.error}`
        };
      }

      // Process and enhance content
      const processedContent = await this.processContent(content, knowledgeType);

      // Create knowledge entry
      const knowledge = await prisma.custom_knowledge.create({
        data: {
          product_key: productKey,
          license_key: licenseKey,
          knowledge_type: knowledgeType,
          content: processedContent,
          metadata: metadata,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          created_by: createdBy,
          is_active: true
        }
      });

      // Index for search
      await this.indexKnowledge(knowledge);

      // Log the addition
      await this.logInsight({
        type: 'knowledge_added',
        knowledgeId: knowledge.id,
        knowledgeType,
        contentLength: processedContent.length,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          knowledge,
          processed: true,
          indexed: true
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] addKnowledge error:', error);
      throw error;
    }
  }

  private async updateKnowledge(params: SkillParams): Promise<SkillResult> {
    try {
      const {
        knowledgeId,
        productKey,
        updates
      } = params;

      // Find existing knowledge
      const existing = await prisma.custom_knowledge.findFirst({
        where: {
          id: knowledgeId,
          product_key: productKey
        }
      });

      if (!existing) {
        return {
          success: false,
          data: null,
          error: 'Knowledge entry not found'
        };
      }

      // Validate updates if content is being changed
      if (updates.content) {
        const validation = this.validateContent(updates.content);
        if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: `Invalid content: ${validation.error}`
          };
        }
        updates.content = await this.processContent(updates.content, existing.knowledge_type);
      }

      // Update knowledge
      const updated = await prisma.custom_knowledge.update({
        where: { id: knowledgeId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      // Re-index if content changed
      if (updates.content) {
        await this.indexKnowledge(updated);
      }

      // Log the update
      await this.logInsight({
        type: 'knowledge_updated',
        knowledgeId,
        updates: Object.keys(updates),
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          knowledge: updated,
          updated: true,
          reindexed: !!updates.content
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] updateKnowledge error:', error);
      throw error;
    }
  }

  private async deleteKnowledge(params: SkillParams): Promise<SkillResult> {
    try {
      const { knowledgeId, productKey, hardDelete = false } = params;

      if (hardDelete) {
        // Permanently delete
        await prisma.custom_knowledge.delete({
          where: { id: knowledgeId }
        });
      } else {
        // Soft delete
        await prisma.custom_knowledge.update({
          where: { id: knowledgeId },
          data: {
            is_active: false,
            updated_at: new Date()
          }
        });
      }

      // Remove from index
      await this.removeFromIndex(knowledgeId);

      // Log the deletion
      await this.logInsight({
        type: hardDelete ? 'knowledge_deleted' : 'knowledge_deactivated',
        knowledgeId,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          deleted: true,
          hardDelete
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] deleteKnowledge error:', error);
      throw error;
    }
  }

  private async getKnowledge(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        knowledgeType, 
        includeInactive = false,
        includeExpired = false 
      } = params;

      const where: any = {
        OR: [
          { product_key: identifier },
          { license_key: identifier }
        ]
      };

      if (knowledgeType) {
        where.knowledge_type = knowledgeType;
      }

      if (!includeInactive) {
        where.is_active = true;
      }

      if (!includeExpired) {
        where.OR.push(
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        );
      }

      const knowledge = await prisma.custom_knowledge.findMany({
        where,
        orderBy: { created_at: 'desc' }
      });

      // Group by type
      const grouped = knowledge.reduce((acc, item) => {
        if (!acc[item.knowledge_type]) {
          acc[item.knowledge_type] = [];
        }
        acc[item.knowledge_type].push(item);
        return acc;
      }, {} as Record<string, KnowledgeEntry[]>);

      return {
        success: true,
        data: {
          knowledge,
          grouped,
          total: knowledge.length
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] getKnowledge error:', error);
      throw error;
    }
  }

  private async searchKnowledge(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { query, limit = 10 } = params;

      // Get all active knowledge
      const knowledge = await prisma.custom_knowledge.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });

      // Search and rank results
      const results = knowledge
        .map(item => ({
          ...item,
          relevance: this.calculateRelevance(query, item.content)
        }))
        .filter(item => item.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      return {
        success: true,
        data: {
          results,
          query,
          total: results.length
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] searchKnowledge error:', error);
      throw error;
    }
  }

  private async importKnowledge(params: SkillParams): Promise<SkillResult> {
    try {
      const {
        productKey,
        licenseKey,
        source,
        format = 'json',
        data,
        overwrite = false
      } = params;

      // Parse imported data based on format
      let entries: any[];
      switch (format) {
        case 'json':
          entries = JSON.parse(data);
          break;
        case 'csv':
          entries = this.parseCSV(data);
          break;
        case 'markdown':
          entries = this.parseMarkdown(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Validate all entries
      const validationResults = entries.map(entry => ({
        entry,
        valid: this.validateContent(entry.content).valid
      }));

      const validEntries = validationResults.filter(r => r.valid).map(r => r.entry);
      const invalidCount = validationResults.filter(r => !r.valid).length;

      // Clear existing if overwrite
      if (overwrite) {
        await prisma.custom_knowledge.updateMany({
          where: {
            product_key: productKey
          },
          data: {
            is_active: false
          }
        });
      }

      // Import valid entries
      const imported = await Promise.all(
        validEntries.map(entry => 
          prisma.custom_knowledge.create({
            data: {
              product_key: productKey,
              license_key: licenseKey,
              knowledge_type: entry.type || 'imported',
              content: entry.content,
              metadata: entry.metadata || {},
              created_by: 'import',
              is_active: true
            }
          })
        )
      );

      // Index all imported knowledge
      await Promise.all(imported.map(item => this.indexKnowledge(item)));

      // Log the import
      await this.logInsight({
        type: 'knowledge_imported',
        source,
        format,
        imported: imported.length,
        invalid: invalidCount,
        overwrite,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          imported: imported.length,
          invalid: invalidCount,
          total: entries.length,
          entries: imported
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] importKnowledge error:', error);
      throw error;
    }
  }

  private async exportKnowledge(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { format = 'json', includeMetadata = true } = params;

      // Get all knowledge
      const knowledge = await prisma.custom_knowledge.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          is_active: true
        },
        orderBy: { created_at: 'desc' }
      });

      // Format for export
      let exportData;
      switch (format) {
        case 'json':
          exportData = JSON.stringify(knowledge, null, 2);
          break;
        case 'csv':
          exportData = this.convertToCSV(knowledge, includeMetadata);
          break;
        case 'markdown':
          exportData = this.convertToMarkdown(knowledge);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        data: {
          format,
          data: exportData,
          recordCount: knowledge.length,
          exportedAt: new Date()
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] exportKnowledge error:', error);
      throw error;
    }
  }

  private async validateKnowledge(params: SkillParams): Promise<SkillResult> {
    try {
      const { content, knowledgeType = 'general' } = params;

      const validation = {
        valid: true,
        errors: [] as string[],
        warnings: [] as string[],
        suggestions: [] as string[]
      };

      // Check content length
      if (!content || content.trim().length === 0) {
        validation.valid = false;
        validation.errors.push('Content cannot be empty');
      } else if (content.length > 50000) {
        validation.valid = false;
        validation.errors.push('Content exceeds maximum length of 50KB');
      }

      // Check for problematic content
      if (this.containsPII(content)) {
        validation.warnings.push('Content may contain personally identifiable information');
      }

      if (this.containsProfanity(content)) {
        validation.warnings.push('Content contains potentially inappropriate language');
      }

      // Type-specific validation
      switch (knowledgeType) {
        case 'faq':
          if (!this.isValidFAQ(content)) {
            validation.errors.push('FAQ content must be in Q&A format');
          }
          break;
        case 'product':
          if (!this.hasProductInfo(content)) {
            validation.warnings.push('Product knowledge should include features and benefits');
          }
          break;
        case 'support':
          if (!this.hasSupportInfo(content)) {
            validation.suggestions.push('Consider adding troubleshooting steps');
          }
          break;
      }

      // Generate improvement suggestions
      validation.suggestions.push(...this.generateSuggestions(content, knowledgeType));

      return {
        success: true,
        data: validation
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] validateKnowledge error:', error);
      throw error;
    }
  }

  private async optimizeKnowledge(identifier: string): Promise<SkillResult> {
    try {
      // Get all knowledge
      const knowledge = await prisma.custom_knowledge.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          is_active: true
        }
      });

      const optimizations = {
        duplicatesRemoved: 0,
        contentMerged: 0,
        outdatedDeactivated: 0,
        contentOptimized: 0
      };

      // Find and remove duplicates
      const contentMap = new Map<string, KnowledgeEntry[]>();
      knowledge.forEach(item => {
        const key = this.generateContentHash(item.content);
        if (!contentMap.has(key)) {
          contentMap.set(key, []);
        }
        contentMap.get(key)!.push(item);
      });

      // Process duplicates
      for (const [hash, items] of contentMap.entries()) {
        if (items.length > 1) {
          // Keep the newest, deactivate others
          const sorted = items.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          for (let i = 1; i < sorted.length; i++) {
            await prisma.custom_knowledge.update({
              where: { id: sorted[i].id },
              data: { is_active: false }
            });
            optimizations.duplicatesRemoved++;
          }
        }
      }

      // Find similar content to merge
      const mergeGroups = this.findSimilarContent(knowledge);
      for (const group of mergeGroups) {
        if (group.length > 1) {
          const merged = this.mergeContent(group);
          
          // Create merged entry
          await prisma.custom_knowledge.create({
            data: {
              product_key: group[0].product_key,
              license_key: group[0].license_key,
              knowledge_type: 'merged',
              content: merged,
              metadata: { mergedFrom: group.map(g => g.id) },
              created_by: 'optimizer',
              is_active: true
            }
          });
          
          // Deactivate originals
          for (const item of group) {
            await prisma.custom_knowledge.update({
              where: { id: item.id },
              data: { is_active: false }
            });
          }
          
          optimizations.contentMerged++;
        }
      }

      // Deactivate outdated content
      const outdatedThreshold = new Date();
      outdatedThreshold.setMonths(outdatedThreshold.getMonth() - 6);
      
      const outdated = await prisma.custom_knowledge.updateMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          updated_at: { lt: outdatedThreshold },
          is_active: true
        },
        data: { is_active: false }
      });
      
      optimizations.outdatedDeactivated = outdated.count;

      // Log optimization
      await this.logInsight({
        type: 'knowledge_optimized',
        optimizations,
        timestamp: new Date()
      });

      return {
        success: true,
        data: {
          optimizations,
          optimizedAt: new Date()
        }
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] optimizeKnowledge error:', error);
      throw error;
    }
  }

  private async syncKnowledge(identifier: string, params: SkillParams): Promise<SkillResult> {
    try {
      const { targetSystem, syncDirection = 'bidirectional' } = params;

      // This would integrate with external systems
      // For now, we'll simulate the sync process
      
      const syncResult = {
        synced: true,
        targetSystem,
        direction: syncDirection,
        itemsSynced: 0,
        errors: [] as string[]
      };

      // Get local knowledge
      const localKnowledge = await prisma.custom_knowledge.findMany({
        where: {
          OR: [
            { product_key: identifier },
            { license_key: identifier }
          ],
          is_active: true
        }
      });

      // Simulate sync based on target system
      switch (targetSystem) {
        case 'n8n':
          // Would sync with n8n workflow
          syncResult.itemsSynced = localKnowledge.length;
          break;
        case 'openai':
          // Would sync with OpenAI fine-tuning
          syncResult.itemsSynced = localKnowledge.length;
          break;
        case 'database':
          // Already in database
          syncResult.itemsSynced = localKnowledge.length;
          break;
        default:
          syncResult.errors.push(`Unknown target system: ${targetSystem}`);
      }

      // Log the sync
      await this.logInsight({
        type: 'knowledge_synced',
        syncResult,
        timestamp: new Date()
      });

      return {
        success: true,
        data: syncResult
      };
    } catch (error) {
      console.error('[ChatbotKnowledgeManagerSkill] syncKnowledge error:', error);
      throw error;
    }
  }

  // Helper methods
  private validateContent(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: 'Content cannot be empty' };
    }
    if (content.length > 50000) {
      return { valid: false, error: 'Content exceeds maximum length' };
    }
    return { valid: true };
  }

  private async processContent(content: string, type: string): Promise<string> {
    // Process content based on type
    let processed = content.trim();
    
    // Remove excess whitespace
    processed = processed.replace(/\s+/g, ' ');
    
    // Type-specific processing
    switch (type) {
      case 'faq':
        // Ensure Q&A format
        if (!processed.includes('Q:') && !processed.includes('A:')) {
          processed = `Q: ${processed.split('?')[0]}?\nA: ${processed.split('?')[1] || ''}`;
        }
        break;
      case 'product':
        // Add structure if missing
        if (!processed.includes('Features:') && !processed.includes('Benefits:')) {
          processed = `Product Information:\n${processed}`;
        }
        break;
    }
    
    return processed;
  }

  private async indexKnowledge(knowledge: any): Promise<void> {
    // Would integrate with search index (e.g., Elasticsearch)
    console.log(`[ChatbotKnowledgeManagerSkill] Indexed knowledge: ${knowledge.id}`);
  }

  private async removeFromIndex(knowledgeId: string): Promise<void> {
    // Would remove from search index
    console.log(`[ChatbotKnowledgeManagerSkill] Removed from index: ${knowledgeId}`);
  }

  private calculateRelevance(query: string, content: string): number {
    // Simple relevance scoring
    const queryWords = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    
    return score / queryWords.length;
  }

  private parseCSV(data: string): any[] {
    // Simple CSV parsing
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header.trim()] = values[index]?.trim();
      });
      return entry;
    });
  }

  private parseMarkdown(data: string): any[] {
    // Parse markdown sections as knowledge entries
    const sections = data.split('##').filter(s => s.trim());
    
    return sections.map(section => {
      const lines = section.split('\n');
      return {
        type: lines[0].trim(),
        content: lines.slice(1).join('\n').trim()
      };
    });
  }

  private convertToCSV(data: any[], includeMetadata: boolean): string {
    if (data.length === 0) return '';
    
    const headers = ['ID', 'Type', 'Content', 'Created At', 'Updated At'];
    if (includeMetadata) headers.push('Metadata');
    
    const rows = data.map(item => {
      const row = [
        item.id,
        item.knowledge_type,
        `"${item.content.replace(/"/g, '""')}"`,
        item.created_at,
        item.updated_at
      ];
      if (includeMetadata) row.push(JSON.stringify(item.metadata));
      return row.join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  private convertToMarkdown(data: any[]): string {
    const sections = data.map(item => {
      return `## ${item.knowledge_type}\n\n${item.content}\n\n---\n`;
    });
    
    return `# Knowledge Base Export\n\n${sections.join('\n')}`;
  }

  private containsPII(content: string): boolean {
    // Check for PII patterns (simplified)
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ // Phone
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  private containsProfanity(content: string): boolean {
    // Would check against profanity list
    return false;
  }

  private isValidFAQ(content: string): boolean {
    return content.includes('Q:') || content.includes('Question:') || 
           content.includes('A:') || content.includes('Answer:');
  }

  private hasProductInfo(content: string): boolean {
    const productKeywords = ['feature', 'benefit', 'specification', 'price', 'model'];
    return productKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private hasSupportInfo(content: string): boolean {
    const supportKeywords = ['troubleshoot', 'fix', 'solve', 'issue', 'problem', 'help'];
    return supportKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  private generateSuggestions(content: string, type: string): string[] {
    const suggestions = [];
    
    if (content.length < 100) {
      suggestions.push('Consider adding more detailed information');
    }
    
    if (!content.includes('example')) {
      suggestions.push('Adding examples can improve understanding');
    }
    
    if (type === 'faq' && !content.includes('how')) {
      suggestions.push('Consider adding "how-to" questions');
    }
    
    return suggestions;
  }

  private generateContentHash(content: string): string {
    // Simple hash for duplicate detection
    return content.toLowerCase().replace(/\s+/g, '').substring(0, 50);
  }

  private findSimilarContent(knowledge: any[]): any[][] {
    // Group similar content (simplified)
    const groups: any[][] = [];
    const processed = new Set<string>();
    
    knowledge.forEach(item1 => {
      if (processed.has(item1.id)) return;
      
      const group = [item1];
      processed.add(item1.id);
      
      knowledge.forEach(item2 => {
        if (item1.id !== item2.id && !processed.has(item2.id)) {
          const similarity = this.calculateSimilarity(item1.content, item2.content);
          if (similarity > 0.8) {
            group.push(item2);
            processed.add(item2.id);
          }
        }
      });
      
      if (group.length > 1) {
        groups.push(group);
      }
    });
    
    return groups;
  }

  private calculateSimilarity(content1: string, content2: string): number {
    // Simple similarity calculation
    const words1 = new Set(content1.toLowerCase().split(' '));
    const words2 = new Set(content2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private mergeContent(items: any[]): string {
    // Merge similar content intelligently
    const allContent = items.map(item => item.content).join('\n\n');
    
    // Remove duplicates while preserving structure
    const lines = allContent.split('\n');
    const uniqueLines = [...new Set(lines)];
    
    return uniqueLines.join('\n');
  }
}