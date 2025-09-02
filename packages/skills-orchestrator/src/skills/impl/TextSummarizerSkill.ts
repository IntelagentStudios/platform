/**
 * Text Summarizer Skill
 * Summarizes long text into concise versions
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class TextSummarizerSkill extends BaseSkill {
  metadata = {
    id: 'text_summarizer',
    name: 'Text Summarizer',
    description: 'Summarize long text into concise versions',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['text', 'summary', 'nlp', 'compression']
  };

  validate(params: SkillParams): boolean {
    return !!(params.text && typeof params.text === 'string');
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        text, 
        maxLength = 200, 
        summaryType = 'extractive',
        preserveKeywords = true 
      } = params;

      let summary = '';
      const sentences = this.extractSentences(text);
      const keywords = this.extractKeywords(text);

      switch (summaryType) {
        case 'extractive':
          summary = this.extractiveSummarize(sentences, maxLength, keywords);
          break;
        case 'abstractive':
          summary = this.abstractiveSummarize(text, maxLength, keywords);
          break;
        case 'bullets':
          summary = this.bulletPointSummarize(sentences, keywords);
          break;
        case 'headline':
          summary = this.headlineSummarize(text, keywords);
          break;
        default:
          summary = this.extractiveSummarize(sentences, maxLength, keywords);
      }

      const metrics = this.calculateMetrics(text, summary);

      return {
        success: true,
        data: {
          original: {
            text,
            length: text.length,
            wordCount: text.split(/\s+/).length,
            sentenceCount: sentences.length
          },
          summary: {
            text: summary,
            length: summary.length,
            wordCount: summary.split(/\s+/).length,
            type: summaryType
          },
          keywords,
          metrics,
          compressionRatio: metrics.compressionRatio
        },
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

  private extractSentences(text: string): string[] {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map(s => s.trim()).filter(s => s.length > 10);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was',
      'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to',
      'of', 'in', 'for', 'with', 'by', 'from', 'up', 'about', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'between'
    ]);

    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};

    words.forEach(word => {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractiveSummarize(sentences: string[], maxLength: number, keywords: string[]): string {
    // Score sentences based on keyword presence
    const scoredSentences = sentences.map(sentence => {
      const lower = sentence.toLowerCase();
      let score = 0;
      
      // Score based on keyword presence
      keywords.forEach(keyword => {
        if (lower.includes(keyword)) {
          score += 2;
        }
      });

      // Bonus for position (first and last sentences are often important)
      const position = sentences.indexOf(sentence);
      if (position === 0) score += 3;
      if (position === sentences.length - 1) score += 2;

      // Penalty for very long sentences
      if (sentence.length > 150) score -= 1;

      return { sentence, score };
    });

    // Sort by score and select top sentences
    scoredSentences.sort((a, b) => b.score - a.score);

    let summary = '';
    let currentLength = 0;

    for (const { sentence } of scoredSentences) {
      if (currentLength + sentence.length <= maxLength) {
        summary += sentence + ' ';
        currentLength += sentence.length;
      } else if (currentLength === 0) {
        // If no sentences fit, truncate the first one
        summary = sentence.substring(0, maxLength - 3) + '...';
        break;
      } else {
        break;
      }
    }

    return summary.trim();
  }

  private abstractiveSummarize(text: string, maxLength: number, keywords: string[]): string {
    // Simplified abstractive summarization
    const sentences = this.extractSentences(text);
    
    // Extract main concepts
    const mainConcepts = keywords.slice(0, 5);
    
    // Generate summary focusing on main concepts
    let summary = 'This text discusses ';
    
    if (mainConcepts.length > 0) {
      summary += mainConcepts.slice(0, 3).join(', ');
      summary += '. ';
    }

    // Add key information from first and last sentences
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      const keyPart = this.extractKeyPart(firstSentence, maxLength / 2);
      summary += keyPart;
    }

    // Ensure we don't exceed maxLength
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    return summary;
  }

  private bulletPointSummarize(sentences: string[], keywords: string[]): string {
    // Create bullet points from key sentences
    const keyPoints: string[] = [];
    
    // Score and select sentences
    const scoredSentences = sentences.map(sentence => {
      const lower = sentence.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        if (lower.includes(keyword)) score++;
      });
      
      return { sentence, score };
    });

    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Take top 5 sentences and convert to bullet points
    const topSentences = scoredSentences.slice(0, 5);
    
    topSentences.forEach(({ sentence }) => {
      // Simplify sentence for bullet point
      const simplified = this.simplifySentence(sentence);
      keyPoints.push(`• ${simplified}`);
    });

    return keyPoints.join('\n');
  }

  private headlineSummarize(text: string, keywords: string[]): string {
    // Generate a headline-style summary
    const mainKeywords = keywords.slice(0, 3);
    
    // Find the most important sentence
    const sentences = this.extractSentences(text);
    if (sentences.length === 0) return 'No content to summarize';
    
    // Look for sentences containing multiple keywords
    let bestSentence = sentences[0];
    let maxKeywordCount = 0;
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      let keywordCount = 0;
      
      mainKeywords.forEach(keyword => {
        if (lower.includes(keyword)) keywordCount++;
      });
      
      if (keywordCount > maxKeywordCount) {
        maxKeywordCount = keywordCount;
        bestSentence = sentence;
      }
    });

    // Extract the core message
    const headline = this.extractKeyPart(bestSentence, 100);
    
    // Capitalize first letter of each major word for headline style
    return headline.split(' ')
      .map(word => word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
      .join(' ');
  }

  private extractKeyPart(sentence: string, maxLength: number): string {
    // Remove less important parts of sentence
    let simplified = sentence
      .replace(/\s+/g, ' ')
      .replace(/,\s*which\s+[^,]*/g, '') // Remove non-essential clauses
      .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical content
      .trim();

    if (simplified.length > maxLength) {
      simplified = simplified.substring(0, maxLength - 3) + '...';
    }

    return simplified;
  }

  private simplifySentence(sentence: string): string {
    // Simplify sentence for bullet points
    let simplified = sentence
      .replace(/^(However|Therefore|Moreover|Furthermore|Additionally),?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length for bullet points
    if (simplified.length > 80) {
      simplified = simplified.substring(0, 77) + '...';
    }

    return simplified;
  }

  private calculateMetrics(original: string, summary: string): any {
    const originalWords = original.split(/\s+/).length;
    const summaryWords = summary.split(/\s+/).length;
    
    return {
      compressionRatio: ((originalWords - summaryWords) / originalWords * 100).toFixed(1) + '%',
      retention: (summaryWords / originalWords * 100).toFixed(1) + '%',
      originalWords,
      summaryWords,
      charactersSaved: original.length - summary.length
    };
  }

  getConfig(): Record<string, any> {
    return {
      summaryTypes: ['extractive', 'abstractive', 'bullets', 'headline'],
      defaultMaxLength: 200,
      minTextLength: 50,
      maxTextLength: 50000
    };
  }
}