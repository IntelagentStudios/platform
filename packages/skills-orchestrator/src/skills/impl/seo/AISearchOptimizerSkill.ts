import { BaseSkill } from '../../BaseSkill';
import { SkillResult } from '../../types';

interface AISearchOptimizerInput {
  content: string;
  url?: string;
  targetSystems?: ('chatgpt' | 'perplexity' | 'claude' | 'bard' | 'bing-chat')[];
  optimizationGoals?: ('citations' | 'featured' | 'authoritative')[];
}

export class AISearchOptimizerSkill extends BaseSkill {
  metadata = {
    id: 'ai-search-optimizer_v1',
    name: 'AI Search Optimizer',
    description: 'Optimize content for AI chatbots and answer engines like ChatGPT, Perplexity, Claude, and Bard',
    category: 'seo' as const,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['ai-seo', 'chatgpt', 'perplexity', 'claude', 'bard', 'answer-engine', 'llm-optimization'],
    cost: {
      base: 15000,
      perToken: 0.02
    },
    tier: 'Pro' as const
  };

  async execute(params: AISearchOptimizerInput): Promise<SkillResult> {
    const { 
      content, 
      url,
      targetSystems = ['chatgpt', 'perplexity', 'claude', 'bard', 'bing-chat'],
      optimizationGoals = ['citations', 'featured', 'authoritative']
    } = params;

    if (!content) {
      return this.error('Content is required for AI search optimization');
    }

    try {
      // Analyze current content structure
      const contentAnalysis = this.analyzeContent(content);
      
      // Perform AI-specific optimizations
      const optimizations = await this.generateOptimizations(
        content,
        contentAnalysis,
        targetSystems,
        optimizationGoals
      );
      
      // Generate AI-friendly version
      const aiFriendlyContent = this.createAIFriendlyVersion(
        content,
        optimizations
      );
      
      // Extract Q&A pairs for better AI comprehension
      const qaPairs = this.extractQAPairs(content, contentAnalysis);
      
      // Calculate optimization scores
      const scores = this.calculateOptimizationScores(
        content,
        aiFriendlyContent,
        targetSystems
      );

      const result = {
        originalContent: content.substring(0, 500) + '...',
        optimizations,
        aiFriendlyVersion: aiFriendlyContent,
        structuredQAPairs: qaPairs,
        scores,
        recommendations: this.generateRecommendations(optimizations, scores),
        metadata: {
          url,
          targetSystems,
          optimizationGoals,
          contentLength: content.length,
          optimizedLength: aiFriendlyContent.length
        }
      };

      return {
        success: true,
        data: result,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date(),
          executionTime: Date.now()
        }
      };
    } catch (error: any) {
      return this.error(error.message);
    }
  }

  private analyzeContent(content: string) {
    const analysis = {
      structure: {
        paragraphs: 0,
        sentences: 0,
        words: 0,
        headings: [] as string[],
        lists: 0,
        tables: 0,
        codeBlocks: 0
      },
      factualDensity: {
        factsPerParagraph: 0,
        citations: 0,
        statistics: 0,
        dates: 0,
        entities: [] as string[]
      },
      readability: {
        avgSentenceLength: 0,
        complexWords: 0,
        passiveVoice: 0,
        readabilityScore: 0
      },
      aiFeatures: {
        directAnswers: 0,
        definitions: 0,
        examples: 0,
        comparisons: 0,
        summaries: 0
      }
    };

    // Count paragraphs
    analysis.structure.paragraphs = (content.match(/\n\n/g) || []).length + 1;
    
    // Count sentences
    analysis.structure.sentences = (content.match(/[.!?]+/g) || []).length;
    
    // Count words
    analysis.structure.words = content.split(/\s+/).length;
    
    // Extract headings (assuming markdown)
    const headingMatches = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    analysis.structure.headings = headingMatches.map(h => h.replace(/^#+\s+/, ''));
    
    // Count lists
    analysis.structure.lists = (content.match(/^[\*\-\+]\s+/gm) || []).length;
    
    // Count tables (markdown tables)
    analysis.structure.tables = (content.match(/\|.*\|.*\|/g) || []).length > 0 ? 1 : 0;
    
    // Count code blocks
    analysis.structure.codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    
    // Calculate factual density
    analysis.factualDensity.factsPerParagraph = analysis.structure.sentences / Math.max(1, analysis.structure.paragraphs);
    analysis.factualDensity.citations = (content.match(/\[[\d\w]+\]/g) || []).length;
    analysis.factualDensity.statistics = (content.match(/\d+%|\d+\.\d+/g) || []).length;
    analysis.factualDensity.dates = (content.match(/\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/g) || []).length;
    
    // Extract entities (simplified - in production use NER)
    const capitalizedWords = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    analysis.factualDensity.entities = [...new Set(capitalizedWords)].slice(0, 20);
    
    // Calculate readability
    analysis.readability.avgSentenceLength = analysis.structure.words / Math.max(1, analysis.structure.sentences);
    analysis.readability.complexWords = (content.match(/\w{10,}/g) || []).length;
    analysis.readability.passiveVoice = (content.match(/\b(was|were|been|being|is|are|am)\s+\w+ed\b/gi) || []).length;
    analysis.readability.readabilityScore = Math.max(0, 100 - (analysis.readability.avgSentenceLength * 2) - (analysis.readability.complexWords * 0.5));
    
    // Detect AI-friendly features
    analysis.aiFeatures.directAnswers = (content.match(/^(What|How|Why|When|Where|Who).*?\?[\s\S]{0,200}/gm) || []).length;
    analysis.aiFeatures.definitions = (content.match(/\bis\s+(a|an|the)\s+/gi) || []).length;
    analysis.aiFeatures.examples = (content.match(/for example|such as|like|including/gi) || []).length;
    analysis.aiFeatures.comparisons = (content.match(/compared to|versus|vs\.|better than|worse than/gi) || []).length;
    analysis.aiFeatures.summaries = (content.match(/in summary|to conclude|in conclusion|overall/gi) || []).length;
    
    return analysis;
  }

  private async generateOptimizations(
    content: string,
    analysis: any,
    targetSystems: string[],
    goals: string[]
  ) {
    const optimizations = {
      contentStructure: {
        currentScore: 0,
        improvements: [] as any[]
      },
      factualDensity: {
        factsPerParagraph: analysis.factualDensity.factsPerParagraph,
        citationOpportunities: [] as any[]
      },
      answerOptimization: {
        directAnswers: [] as any[],
        summaryQuality: 0,
        scanabilityScore: 0
      },
      entityCoverage: {
        mentionedEntities: analysis.factualDensity.entities,
        missingEntities: [] as string[],
        relationshipGaps: [] as any[]
      }
    };

    // Calculate content structure score
    optimizations.contentStructure.currentScore = this.calculateStructureScore(analysis);
    
    // Generate structure improvements
    if (analysis.structure.headings.length < 3) {
      optimizations.contentStructure.improvements.push({
        type: 'heading',
        suggestion: 'Add more descriptive headings to improve content structure',
        impact: 15
      });
    }
    
    if (analysis.structure.lists === 0) {
      optimizations.contentStructure.improvements.push({
        type: 'list',
        suggestion: 'Convert key points to bulleted lists for better AI parsing',
        impact: 10
      });
    }
    
    if (analysis.readability.avgSentenceLength > 20) {
      optimizations.contentStructure.improvements.push({
        type: 'paragraph',
        suggestion: 'Break down long sentences for clearer comprehension',
        impact: 20
      });
    }
    
    // Identify citation opportunities
    const statements = content.split(/[.!?]+/);
    statements.forEach(statement => {
      if (statement.match(/\d+%|\d+\.\d+/) && !statement.match(/\[[\d\w]+\]/)) {
        optimizations.factualDensity.citationOpportunities.push({
          statement: statement.trim(),
          suggestedSource: 'Add authoritative source for this statistic'
        });
      }
    });
    
    // Generate direct answers for common questions
    const commonQuestions = [
      'What is', 'How does', 'Why is', 'When should', 'Where can'
    ];
    
    commonQuestions.forEach(questionStart => {
      const regex = new RegExp(`${questionStart}[^.?!]*\\?`, 'gi');
      const matches = content.match(regex) || [];
      matches.forEach(question => {
        optimizations.answerOptimization.directAnswers.push({
          question: question,
          currentAnswer: this.extractAnswer(content, question),
          optimizedAnswer: this.generateOptimizedAnswer(question, content)
        });
      });
    });
    
    // Calculate summary quality
    optimizations.answerOptimization.summaryQuality = 
      analysis.aiFeatures.summaries > 0 ? 80 : 40;
    
    // Calculate scanability score
    optimizations.answerOptimization.scanabilityScore = 
      (analysis.structure.headings.length * 10) +
      (analysis.structure.lists * 5) +
      (analysis.aiFeatures.directAnswers * 15);
    
    // Identify missing entities based on topic
    const topicEntities = this.getTopicEntities(content);
    optimizations.entityCoverage.missingEntities = topicEntities.filter(
      entity => !analysis.factualDensity.entities.includes(entity)
    );
    
    // Identify relationship gaps
    if (analysis.factualDensity.entities.length > 1) {
      for (let i = 0; i < Math.min(3, analysis.factualDensity.entities.length - 1); i++) {
        optimizations.entityCoverage.relationshipGaps.push({
          entity1: analysis.factualDensity.entities[i],
          entity2: analysis.factualDensity.entities[i + 1],
          suggestedRelationship: 'Explain how these entities relate to each other'
        });
      }
    }
    
    return optimizations;
  }

  private createAIFriendlyVersion(content: string, optimizations: any): string {
    let optimized = content;
    
    // Add structure improvements
    if (optimizations.contentStructure.improvements.length > 0) {
      // Add a summary at the beginning
      const summary = this.generateSummary(content);
      optimized = `## Summary\n${summary}\n\n${optimized}`;
    }
    
    // Add Q&A section if direct answers exist
    if (optimizations.answerOptimization.directAnswers.length > 0) {
      let qaSection = '\n\n## Frequently Asked Questions\n\n';
      optimizations.answerOptimization.directAnswers.forEach((qa: any) => {
        qaSection += `**${qa.question}**\n${qa.optimizedAnswer}\n\n`;
      });
      optimized += qaSection;
    }
    
    // Add entity relationships section
    if (optimizations.entityCoverage.relationshipGaps.length > 0) {
      let relationshipsSection = '\n\n## Key Relationships\n\n';
      optimizations.entityCoverage.relationshipGaps.forEach((gap: any) => {
        relationshipsSection += `- ${gap.entity1} and ${gap.entity2}: ${gap.suggestedRelationship}\n`;
      });
      optimized += relationshipsSection;
    }
    
    // Add structured data hints
    optimized += '\n\n<!-- AI-Optimization-Metadata\n';
    optimized += `Topics: ${optimizations.entityCoverage.mentionedEntities.join(', ')}\n`;
    optimized += `Content-Type: Educational/Informational\n`;
    optimized += `Last-Updated: ${new Date().toISOString()}\n`;
    optimized += '-->\n';
    
    return optimized;
  }

  private extractQAPairs(content: string, analysis: any) {
    const pairs = [];
    
    // Extract existing Q&A pairs
    const qaRegex = /(?:Q:|Question:)\s*([^?\n]+\?)\s*(?:A:|Answer:)?\s*([^Q\n]+)/gi;
    let match;
    while ((match = qaRegex.exec(content)) !== null) {
      pairs.push({
        q: match[1].trim(),
        a: match[2].trim()
      });
    }
    
    // Generate Q&A pairs from headings
    analysis.structure.headings.forEach((heading: string) => {
      const answer = this.extractSectionContent(content, heading);
      if (answer) {
        pairs.push({
          q: `What is ${heading.toLowerCase()}?`,
          a: answer.substring(0, 200)
        });
      }
    });
    
    // Generate Q&A from key facts
    if (analysis.factualDensity.statistics > 0) {
      const stats = content.match(/\d+%|\d+\.\d+/g) || [];
      stats.slice(0, 3).forEach(stat => {
        const context = this.extractContext(content, stat);
        pairs.push({
          q: `What does the ${stat} statistic represent?`,
          a: context
        });
      });
    }
    
    return pairs;
  }

  private calculateOptimizationScores(
    original: string,
    optimized: string,
    targetSystems: string[]
  ) {
    const scores: any = {};
    
    targetSystems.forEach(system => {
      scores[system] = {
        before: this.calculateSystemScore(original, system),
        after: this.calculateSystemScore(optimized, system),
        improvement: 0
      };
      scores[system].improvement = scores[system].after - scores[system].before;
    });
    
    return scores;
  }

  private calculateSystemScore(content: string, system: string): number {
    let score = 50; // Base score
    
    // System-specific scoring
    switch (system) {
      case 'chatgpt':
        // ChatGPT favors well-structured, comprehensive content
        if (content.includes('##')) score += 10; // Has headings
        if (content.match(/\d+\./g)) score += 5; // Has numbered lists
        if (content.length > 1000) score += 10; // Comprehensive
        if (content.match(/```/g)) score += 5; // Has code blocks
        break;
        
      case 'perplexity':
        // Perplexity favors factual, cited content
        if (content.match(/\[[\d\w]+\]/g)) score += 15; // Has citations
        if (content.match(/\d+%/g)) score += 10; // Has statistics
        if (content.match(/https?:\/\//g)) score += 10; // Has links
        break;
        
      case 'claude':
        // Claude appreciates nuanced, balanced content
        if (content.match(/however|although|while/gi)) score += 10; // Nuanced
        if (content.match(/pros and cons|advantages and disadvantages/gi)) score += 10;
        if (content.includes('ethical')) score += 5;
        break;
        
      case 'bard':
        // Bard/Gemini likes current, comprehensive content
        if (content.match(/202[3-5]/g)) score += 15; // Recent dates
        if (content.match(/Google|Android|Chrome/g)) score += 5; // Google products
        if (content.includes('latest')) score += 5;
        break;
        
      case 'bing-chat':
        // Bing Chat prefers actionable, step-by-step content
        if (content.match(/step \d+/gi)) score += 10; // Step-by-step
        if (content.match(/how to/gi)) score += 10; // How-to content
        if (content.includes('Microsoft')) score += 5;
        break;
    }
    
    return Math.min(100, score);
  }

  private generateRecommendations(optimizations: any, scores: any): string[] {
    const recommendations = [];
    
    // Structure recommendations
    if (optimizations.contentStructure.currentScore < 70) {
      recommendations.push('Improve content structure with clear headings and sections');
    }
    
    // Citation recommendations
    if (optimizations.factualDensity.citationOpportunities.length > 0) {
      recommendations.push(`Add ${optimizations.factualDensity.citationOpportunities.length} citations to improve credibility`);
    }
    
    // Answer optimization recommendations
    if (optimizations.answerOptimization.summaryQuality < 60) {
      recommendations.push('Add a comprehensive summary section');
    }
    
    if (optimizations.answerOptimization.directAnswers.length === 0) {
      recommendations.push('Include direct answers to common questions');
    }
    
    // Entity recommendations
    if (optimizations.entityCoverage.missingEntities.length > 0) {
      recommendations.push(`Consider mentioning: ${optimizations.entityCoverage.missingEntities.slice(0, 3).join(', ')}`);
    }
    
    // System-specific recommendations
    Object.entries(scores).forEach(([system, score]: [string, any]) => {
      if (score.after < 70) {
        recommendations.push(`Optimize specifically for ${system} by adding ${this.getSystemSpecificTip(system)}`);
      }
    });
    
    return recommendations;
  }

  private getSystemSpecificTip(system: string): string {
    const tips: Record<string, string> = {
      'chatgpt': 'comprehensive explanations and examples',
      'perplexity': 'more citations and factual references',
      'claude': 'balanced perspectives and ethical considerations',
      'bard': 'current information and Google ecosystem references',
      'bing-chat': 'actionable steps and Microsoft product integration'
    };
    return tips[system] || 'relevant optimizations';
  }

  // Helper methods
  private calculateStructureScore(analysis: any): number {
    let score = 50;
    score += Math.min(20, analysis.structure.headings.length * 5);
    score += Math.min(10, analysis.structure.lists * 2);
    score += analysis.structure.tables > 0 ? 5 : 0;
    score -= analysis.readability.avgSentenceLength > 25 ? 10 : 0;
    return Math.max(0, Math.min(100, score));
  }

  private extractAnswer(content: string, question: string): string {
    const questionIndex = content.indexOf(question);
    if (questionIndex === -1) return '';
    const answer = content.substring(questionIndex + question.length, questionIndex + question.length + 200);
    return answer.split(/[.!?]/)[0] + '.';
  }

  private generateOptimizedAnswer(question: string, content: string): string {
    // Simplified answer generation - in production, use AI
    const answer = this.extractAnswer(content, question);
    return answer || `This topic requires a comprehensive answer based on the content provided.`;
  }

  private generateSummary(content: string): string {
    // Simplified summary - in production, use AI
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private getTopicEntities(content: string): string[] {
    // Simplified entity extraction - in production, use NER
    const commonEntities = ['Google', 'Microsoft', 'OpenAI', 'SEO', 'AI', 'Machine Learning'];
    return commonEntities.filter(entity => 
      content.toLowerCase().includes(entity.toLowerCase())
    );
  }

  private extractSectionContent(content: string, heading: string): string {
    const headingIndex = content.indexOf(heading);
    if (headingIndex === -1) return '';
    const nextHeadingMatch = content.substring(headingIndex + heading.length).match(/^#{1,6}\s+/m);
    const endIndex = nextHeadingMatch ? 
      headingIndex + heading.length + nextHeadingMatch.index! : 
      content.length;
    return content.substring(headingIndex + heading.length, endIndex).trim();
  }

  private extractContext(content: string, target: string): string {
    const index = content.indexOf(target);
    if (index === -1) return '';
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + target.length + 100);
    return content.substring(start, end).trim();
  }

  validate(params: any): boolean {
    return !!params.content;
  }

  getConfig() {
    return {
      targetSystems: ['chatgpt', 'perplexity', 'claude', 'bard', 'bing-chat'],
      optimizationGoals: ['citations', 'featured', 'authoritative'],
      maxContentLength: 50000,
      supportedFormats: ['text', 'markdown', 'html']
    };
  }

  private error(message: string): SkillResult {
    return {
      success: false,
      error: message,
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date()
      }
    };
  }
}