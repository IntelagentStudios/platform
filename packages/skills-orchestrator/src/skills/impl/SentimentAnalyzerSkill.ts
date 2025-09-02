/**
 * Sentiment Analyzer Skill
 * Analyzes text sentiment and emotional tone
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class SentimentAnalyzerSkill extends BaseSkill {
  metadata = {
    id: 'sentiment_analyzer',
    name: 'Sentiment Analyzer',
    description: 'Analyze text sentiment and emotional tone',
    category: SkillCategory.AI_POWERED,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['sentiment', 'nlp', 'ai', 'analysis']
  };

  // Sentiment keywords for basic analysis
  private positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like',
    'happy', 'pleased', 'satisfied', 'perfect', 'best', 'awesome', 'brilliant', 'outstanding',
    'impressive', 'delighted', 'positive', 'success', 'beautiful', 'enjoyable', 'thank'
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'frustrated',
    'disappointed', 'upset', 'worst', 'poor', 'useless', 'broken', 'failed', 'error',
    'problem', 'issue', 'difficult', 'annoying', 'unacceptable', 'negative', 'sadly'
  ];

  private emotionIndicators = {
    joy: ['happy', 'joy', 'excited', 'delighted', 'pleased', 'cheerful', 'elated'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'rage', 'upset'],
    sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'sorry', 'disappointed'],
    fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous', 'terrified', 'concerned'],
    surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'unexpected', 'wow'],
    disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'awful', 'gross']
  };

  validate(params: SkillParams): boolean {
    return !!(params.text && typeof params.text === 'string');
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { text, detailed = false } = params;
      const lowerText = text.toLowerCase();
      const words = lowerText.split(/\s+/);

      // Calculate sentiment scores
      let positiveScore = 0;
      let negativeScore = 0;
      let neutralScore = 0;

      // Count positive and negative words
      words.forEach((word: string) => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (this.positiveWords.includes(cleanWord)) {
          positiveScore++;
        } else if (this.negativeWords.includes(cleanWord)) {
          negativeScore++;
        } else {
          neutralScore++;
        }
      });

      // Calculate percentages
      const totalWords = words.length;
      const positivePercentage = (positiveScore / totalWords) * 100;
      const negativePercentage = (negativeScore / totalWords) * 100;
      const neutralPercentage = (neutralScore / totalWords) * 100;

      // Determine overall sentiment
      let overallSentiment = 'neutral';
      let confidence = 0;

      if (positiveScore > negativeScore * 1.5) {
        overallSentiment = 'positive';
        confidence = Math.min(95, positivePercentage * 3);
      } else if (negativeScore > positiveScore * 1.5) {
        overallSentiment = 'negative';
        confidence = Math.min(95, negativePercentage * 3);
      } else {
        overallSentiment = 'neutral';
        confidence = Math.min(90, neutralPercentage);
      }

      // Detect emotions if detailed analysis requested
      let emotions = {};
      if (detailed) {
        emotions = this.detectEmotions(lowerText);
      }

      // Calculate subjectivity (opinion vs fact)
      const subjectivityScore = this.calculateSubjectivity(text);

      // Detect key phrases
      const keyPhrases = this.extractKeyPhrases(text);

      return {
        success: true,
        data: {
          sentiment: overallSentiment,
          confidence: Math.round(confidence),
          scores: {
            positive: Math.round(positivePercentage),
            negative: Math.round(negativePercentage),
            neutral: Math.round(neutralPercentage)
          },
          subjectivity: subjectivityScore,
          emotions: detailed ? emotions : undefined,
          keyPhrases,
          statistics: {
            wordCount: totalWords,
            positiveWords: positiveScore,
            negativeWords: negativeScore,
            characterCount: text.length
          }
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

  private detectEmotions(text: string): Record<string, number> {
    const emotions: Record<string, number> = {};
    
    Object.entries(this.emotionIndicators).forEach(([emotion, indicators]) => {
      let score = 0;
      indicators.forEach(indicator => {
        if (text.includes(indicator)) {
          score++;
        }
      });
      if (score > 0) {
        emotions[emotion] = Math.min(100, score * 20);
      }
    });

    return emotions;
  }

  private calculateSubjectivity(text: string): string {
    // Simple subjectivity calculation based on opinion words
    const opinionWords = [
      'think', 'believe', 'feel', 'opinion', 'seems', 'maybe', 'perhaps',
      'probably', 'possibly', 'might', 'could', 'should', 'would'
    ];

    const factWords = [
      'is', 'are', 'was', 'were', 'fact', 'data', 'statistics', 'proven',
      'confirmed', 'verified', 'measured', 'calculated'
    ];

    const lowerText = text.toLowerCase();
    let opinionScore = 0;
    let factScore = 0;

    opinionWords.forEach(word => {
      if (lowerText.includes(word)) opinionScore++;
    });

    factWords.forEach(word => {
      if (lowerText.includes(word)) factScore++;
    });

    if (opinionScore > factScore * 1.5) {
      return 'subjective';
    } else if (factScore > opinionScore * 1.5) {
      return 'objective';
    } else {
      return 'mixed';
    }
  }

  private extractKeyPhrases(text: string): string[] {
    // Simple key phrase extraction
    const sentences = text.split(/[.!?]+/);
    const phrases: string[] = [];

    sentences.forEach(sentence => {
      // Extract noun phrases (simplified)
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        // Look for capitalized words or important phrases
        const importantWords = words.filter(word => 
          word.length > 3 && 
          (word[0] === word[0].toUpperCase() || this.isImportantWord(word))
        );
        
        if (importantWords.length >= 2) {
          phrases.push(importantWords.join(' '));
        }
      }
    });

    return phrases.slice(0, 5); // Return top 5 key phrases
  }

  private isImportantWord(word: string): boolean {
    const important = [
      'important', 'critical', 'essential', 'key', 'main', 'primary',
      'significant', 'major', 'crucial', 'vital', 'core', 'fundamental'
    ];
    return important.includes(word.toLowerCase());
  }

  getConfig(): Record<string, any> {
    return {
      supportedLanguages: ['en'],
      maxTextLength: 10000,
      detailedAnalysis: true
    };
  }
}