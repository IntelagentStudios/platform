/**
 * Language Detector Skill
 * Detects the language of text input
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class LanguageDetectorSkill extends BaseSkill {
  metadata = {
    id: 'language_detector',
    name: 'Language Detector',
    description: 'Detect the language of text input',
    category: SkillCategory.AI_POWERED,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['language', 'nlp', 'detection', 'ai']
  };

  // Common words in different languages for detection
  private languagePatterns: Record<string, { 
    commonWords: string[], 
    characters?: RegExp,
    name: string,
    nativeName: string,
    iso639: string 
  }> = {
    english: {
      commonWords: ['the', 'be', 'to', 'of', 'and', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'as', 'you', 'at', 'this', 'but', 'by', 'from'],
      name: 'English',
      nativeName: 'English',
      iso639: 'en'
    },
    spanish: {
      commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo'],
      name: 'Spanish',
      nativeName: 'Español',
      iso639: 'es'
    },
    french: {
      commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui', 'ce', 'dans', 'elle', 'au', 'pour', 'pas'],
      name: 'French',
      nativeName: 'Français',
      iso639: 'fr'
    },
    german: {
      commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als'],
      name: 'German',
      nativeName: 'Deutsch',
      iso639: 'de'
    },
    italian: {
      commonWords: ['di', 'che', 'è', 'e', 'la', 'il', 'un', 'a', 'per', 'in', 'non', 'si', 'da', 'lo', 'io', 'con', 'ma', 'ed', 'anche', 'come'],
      name: 'Italian',
      nativeName: 'Italiano',
      iso639: 'it'
    },
    portuguese: {
      commonWords: ['o', 'de', 'e', 'a', 'que', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais'],
      name: 'Portuguese',
      nativeName: 'Português',
      iso639: 'pt'
    },
    russian: {
      commonWords: ['и', 'в', 'не', 'на', 'я', 'что', 'он', 'с', 'к', 'это', 'по', 'но', 'они', 'мы', 'она', 'как', 'а', 'то', 'все', 'из'],
      characters: /[\u0400-\u04FF]/,
      name: 'Russian',
      nativeName: 'Русский',
      iso639: 'ru'
    },
    chinese: {
      commonWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他'],
      characters: /[\u4E00-\u9FFF]/,
      name: 'Chinese',
      nativeName: '中文',
      iso639: 'zh'
    },
    japanese: {
      commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として'],
      characters: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
      name: 'Japanese',
      nativeName: '日本語',
      iso639: 'ja'
    },
    korean: {
      commonWords: ['의', '이', '은', '을', '에', '가', '와', '는', '로', '를', '과', '도', '나', '다', '하', '고', '서', '한', '그', '자'],
      characters: /[\uAC00-\uD7AF]/,
      name: 'Korean',
      nativeName: '한국어',
      iso639: 'ko'
    },
    arabic: {
      commonWords: ['في', 'من', 'إلى', 'أن', 'على', 'هذا', 'كان', 'الذي', 'مع', 'هو', 'ما', 'لا', 'قد', 'عن', 'بعد', 'أو', 'ذلك', 'التي', 'كل', 'إن'],
      characters: /[\u0600-\u06FF]/,
      name: 'Arabic',
      nativeName: 'العربية',
      iso639: 'ar'
    },
    hindi: {
      commonWords: ['के', 'है', 'में', 'की', 'को', 'का', 'से', 'और', 'पर', 'यह', 'कि', 'एक', 'ने', 'हैं', 'या', 'था', 'जो', 'भी', 'इस', 'हो'],
      characters: /[\u0900-\u097F]/,
      name: 'Hindi',
      nativeName: 'हिन्दी',
      iso639: 'hi'
    },
    dutch: {
      commonWords: ['de', 'het', 'van', 'een', 'in', 'en', 'is', 'dat', 'op', 'te', 'die', 'voor', 'met', 'hij', 'niet', 'zijn', 'aan', 'er', 'als', 'bij'],
      name: 'Dutch',
      nativeName: 'Nederlands',
      iso639: 'nl'
    }
  };

  validate(params: SkillParams): boolean {
    return !!(params.text && typeof params.text === 'string');
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { text, detailed = false } = params;
      
      // Detect language
      const detection = this.detectLanguage(text);
      
      // Calculate confidence scores for all languages if detailed
      let allScores: Record<string, number> = {};
      if (detailed) {
        allScores = this.calculateAllScores(text);
      }

      // Get text statistics
      const statistics = this.analyzeTextStatistics(text);

      // Detect script type
      const script = this.detectScript(text);

      return {
        success: true,
        data: {
          detected: {
            language: detection.language,
            name: detection.name,
            nativeName: detection.nativeName,
            iso639: detection.iso639,
            confidence: detection.confidence,
            script
          },
          detailed: detailed ? {
            scores: allScores,
            topLanguages: this.getTopLanguages(allScores, 5),
            multilingualProbability: this.detectMultilingual(text)
          } : undefined,
          statistics,
          text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
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

  private detectLanguage(text: string): {
    language: string,
    name: string,
    nativeName: string,
    iso639: string,
    confidence: number
  } {
    const scores = this.calculateAllScores(text);
    
    // Find the language with the highest score
    let maxScore = 0;
    let detectedLang = 'unknown';
    
    Object.entries(scores).forEach(([lang, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    });

    if (detectedLang === 'unknown' || maxScore < 10) {
      return {
        language: 'unknown',
        name: 'Unknown',
        nativeName: 'Unknown',
        iso639: 'und',
        confidence: 0
      };
    }

    const langInfo = this.languagePatterns[detectedLang];
    return {
      language: detectedLang,
      name: langInfo.name,
      nativeName: langInfo.nativeName,
      iso639: langInfo.iso639,
      confidence: Math.min(95, maxScore)
    };
  }

  private calculateAllScores(text: string): Record<string, number> {
    const scores: Record<string, number> = {};
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    Object.entries(this.languagePatterns).forEach(([lang, pattern]) => {
      let score = 0;

      // Check for character patterns (for non-Latin scripts)
      if (pattern.characters) {
        const matches = text.match(pattern.characters);
        if (matches) {
          score += matches.length * 5; // Heavy weight for script matches
        }
      }

      // Check for common words
      pattern.commonWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length * 2;
        }
      });

      // Normalize score by text length
      scores[lang] = Math.round((score / words.length) * 100);
    });

    return scores;
  }

  private detectScript(text: string): string {
    // Detect the writing script
    if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'Japanese';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
    if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
    if (/[\u0400-\u04FF]/.test(text)) return 'Cyrillic';
    if (/[\u0900-\u097F]/.test(text)) return 'Devanagari';
    if (/[\u0E00-\u0E7F]/.test(text)) return 'Thai';
    if (/[\u1F00-\u1FFF]/.test(text)) return 'Greek';
    if (/[\u0590-\u05FF]/.test(text)) return 'Hebrew';
    
    // Check for Latin script with diacritics
    if (/[àáäâèéëêìíïîòóöôùúüûñç]/i.test(text)) return 'Latin Extended';
    if (/[a-zA-Z]/.test(text)) return 'Latin';
    
    return 'Unknown';
  }

  private analyzeTextStatistics(text: string): any {
    const words = text.split(/\s+/);
    const characters = text.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate average word length
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = totalWordLength / words.length;

    // Count unique characters
    const uniqueChars = new Set(text).size;

    // Detect special characters
    const hasNumbers = /\d/.test(text);
    const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(text);
    const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text);

    return {
      wordCount: words.length,
      characterCount: characters,
      sentenceCount: sentences.length,
      averageWordLength: avgWordLength.toFixed(2),
      uniqueCharacters: uniqueChars,
      features: {
        hasNumbers,
        hasSpecialChars,
        hasEmojis,
        hasMixedCase: text !== text.toLowerCase() && text !== text.toUpperCase()
      }
    };
  }

  private detectMultilingual(text: string): number {
    // Detect if text contains multiple languages
    const scores = this.calculateAllScores(text);
    const significantScores = Object.values(scores).filter(score => score > 20);
    
    if (significantScores.length > 1) {
      // Calculate probability based on how many languages have significant scores
      return Math.min(95, significantScores.length * 20);
    }
    
    return 0;
  }

  private getTopLanguages(scores: Record<string, number>, count: number): Array<{
    language: string,
    name: string,
    score: number
  }> {
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([lang, score]) => ({
        language: lang,
        name: this.languagePatterns[lang]?.name || 'Unknown',
        score
      }));
  }

  getConfig(): Record<string, any> {
    return {
      supportedLanguages: Object.keys(this.languagePatterns),
      minTextLength: 10,
      maxTextLength: 100000,
      detectionMethods: ['common_words', 'character_patterns', 'script_detection']
    };
  }
}