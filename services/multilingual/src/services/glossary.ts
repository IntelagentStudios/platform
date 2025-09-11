export class GlossaryProcessor {
  private glossary: Map<string, string>;
  private patterns: Map<string, RegExp>;

  constructor(glossaryTerms: Record<string, string>) {
    this.glossary = new Map(Object.entries(glossaryTerms));
    this.patterns = new Map();
    
    for (const [term, translation] of this.glossary) {
      const pattern = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      this.patterns.set(term, pattern);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  applyGlossary(text: string): string {
    let result = text;
    
    for (const [term, pattern] of this.patterns) {
      const replacement = this.glossary.get(term)!;
      result = result.replace(pattern, replacement);
    }
    
    return result;
  }

  containsGlossaryTerm(text: string): boolean {
    for (const pattern of this.patterns.values()) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  extractAndProtect(text: string): { processed: string; replacements: Map<string, string> } {
    const replacements = new Map<string, string>();
    let processed = text;
    let placeholderIndex = 0;

    for (const [term, pattern] of this.patterns) {
      const matches = processed.match(pattern);
      if (matches) {
        for (const match of matches) {
          const placeholder = `__GLOSSARY_${placeholderIndex}__`;
          replacements.set(placeholder, this.glossary.get(term)!);
          processed = processed.replace(match, placeholder);
          placeholderIndex++;
        }
      }
    }

    return { processed, replacements };
  }

  restoreProtected(text: string, replacements: Map<string, string>): string {
    let result = text;
    
    for (const [placeholder, replacement] of replacements) {
      result = result.replace(placeholder, replacement);
    }
    
    return result;
  }

  updateGlossary(newTerms: Record<string, string>): void {
    for (const [term, translation] of Object.entries(newTerms)) {
      this.glossary.set(term, translation);
      const pattern = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      this.patterns.set(term, pattern);
    }
  }

  getGlossary(): Record<string, string> {
    return Object.fromEntries(this.glossary);
  }
}