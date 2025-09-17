/**
 * Intelligent localization system with UK/US spelling variations and AI translation
 */

// Detect user's locale from browser
export function detectUserLocale(): string {
  if (typeof window === 'undefined') return 'en-US';

  // Check navigator language settings
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en-US';

  // Store in localStorage for persistence
  const storedLocale = localStorage.getItem('userLocale');
  if (storedLocale) return storedLocale;

  localStorage.setItem('userLocale', browserLang);
  return browserLang;
}

// Set user's preferred locale
export function setUserLocale(locale: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userLocale', locale);
    window.location.reload(); // Reload to apply new locale
  }
}

// Common UK/US spelling variations
const spellingVariations: Record<string, { 'en-US': string; 'en-GB': string }> = {
  analyze: { 'en-US': 'analyze', 'en-GB': 'analyse' },
  analyzing: { 'en-US': 'analyzing', 'en-GB': 'analysing' },
  analyzer: { 'en-US': 'analyzer', 'en-GB': 'analyser' },
  analysis: { 'en-US': 'analysis', 'en-GB': 'analysis' }, // Same in both
  organize: { 'en-US': 'organize', 'en-GB': 'organise' },
  organizing: { 'en-US': 'organizing', 'en-GB': 'organising' },
  organization: { 'en-US': 'organization', 'en-GB': 'organisation' },
  personalize: { 'en-US': 'personalize', 'en-GB': 'personalise' },
  personalized: { 'en-US': 'personalized', 'en-GB': 'personalised' },
  personalization: { 'en-US': 'personalization', 'en-GB': 'personalisation' },
  optimize: { 'en-US': 'optimize', 'en-GB': 'optimise' },
  optimized: { 'en-US': 'optimized', 'en-GB': 'optimised' },
  optimization: { 'en-US': 'optimization', 'en-GB': 'optimisation' },
  center: { 'en-US': 'center', 'en-GB': 'centre' },
  color: { 'en-US': 'color', 'en-GB': 'colour' },
  behavior: { 'en-US': 'behavior', 'en-GB': 'behaviour' },
  catalog: { 'en-US': 'catalog', 'en-GB': 'catalogue' },
  defense: { 'en-US': 'defense', 'en-GB': 'defence' },
  favorite: { 'en-US': 'favorite', 'en-GB': 'favourite' },
  honor: { 'en-US': 'honor', 'en-GB': 'honour' },
  labor: { 'en-US': 'labor', 'en-GB': 'labour' },
  license: { 'en-US': 'license', 'en-GB': 'licence' },
  theater: { 'en-US': 'theater', 'en-GB': 'theatre' },
  fulfill: { 'en-US': 'fulfill', 'en-GB': 'fulfil' },
  enrollment: { 'en-US': 'enrollment', 'en-GB': 'enrolment' },
  program: { 'en-US': 'program', 'en-GB': 'programme' },
};

// Get the correct spelling based on locale
export function getLocalizedSpelling(word: string, locale?: string): string {
  const userLocale = locale || detectUserLocale();
  const wordLower = word.toLowerCase();

  // Check if we have a variation for this word
  if (spellingVariations[wordLower]) {
    const variant = userLocale.startsWith('en-GB') || userLocale.startsWith('en-UK')
      ? 'en-GB'
      : 'en-US';
    const localizedWord = spellingVariations[wordLower][variant];

    // Preserve original casing
    if (word[0] === word[0].toUpperCase()) {
      return localizedWord.charAt(0).toUpperCase() + localizedWord.slice(1);
    }
    if (word === word.toUpperCase()) {
      return localizedWord.toUpperCase();
    }
    return localizedWord;
  }

  return word;
}

// Localize a full string (handles multiple words)
export function localizeText(text: string, locale?: string): string {
  const userLocale = locale || detectUserLocale();

  // For non-English locales, we'd call AI translation here
  if (!userLocale.startsWith('en')) {
    // This would be replaced with actual AI translation call
    return text; // For now, return original
  }

  // For English variants, handle spelling differences
  let localizedText = text;

  // Replace each spelling variation
  Object.keys(spellingVariations).forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    localizedText = localizedText.replace(regex, (match) => {
      return getLocalizedSpelling(match, userLocale);
    });
  });

  return localizedText;
}

// Common UI translations
export const translations: Record<string, Record<string, string>> = {
  'en-US': {
    'analyze_company': 'Analyze Company',
    'analyzing': 'Analyzing...',
    'analyze_website': 'Analyze Website',
    'company_analyzer': 'Company Analyzer',
    'personalized_campaigns': 'Personalized Campaigns',
    'optimization_settings': 'Optimization Settings',
    'color_scheme': 'Color Scheme',
    'organization_details': 'Organization Details',
    'favorite_templates': 'Favorite Templates',
  },
  'en-GB': {
    'analyze_company': 'Analyse Company',
    'analyzing': 'Analysing...',
    'analyze_website': 'Analyse Website',
    'company_analyzer': 'Company Analyser',
    'personalized_campaigns': 'Personalised Campaigns',
    'optimization_settings': 'Optimisation Settings',
    'color_scheme': 'Colour Scheme',
    'organization_details': 'Organisation Details',
    'favorite_templates': 'Favourite Templates',
  },
  'es': {
    'analyze_company': 'Analizar Empresa',
    'analyzing': 'Analizando...',
    'analyze_website': 'Analizar Sitio Web',
    'company_analyzer': 'Analizador de Empresas',
    'personalized_campaigns': 'Campañas Personalizadas',
    'optimization_settings': 'Configuración de Optimización',
    'color_scheme': 'Esquema de Colores',
    'organization_details': 'Detalles de la Organización',
    'favorite_templates': 'Plantillas Favoritas',
  },
  'fr': {
    'analyze_company': 'Analyser l\'Entreprise',
    'analyzing': 'Analyse en cours...',
    'analyze_website': 'Analyser le Site Web',
    'company_analyzer': 'Analyseur d\'Entreprise',
    'personalized_campaigns': 'Campagnes Personnalisées',
    'optimization_settings': 'Paramètres d\'Optimisation',
    'color_scheme': 'Schéma de Couleurs',
    'organization_details': 'Détails de l\'Organisation',
    'favorite_templates': 'Modèles Favoris',
  },
  'de': {
    'analyze_company': 'Unternehmen Analysieren',
    'analyzing': 'Analysiere...',
    'analyze_website': 'Website Analysieren',
    'company_analyzer': 'Unternehmensanalyse',
    'personalized_campaigns': 'Personalisierte Kampagnen',
    'optimization_settings': 'Optimierungseinstellungen',
    'color_scheme': 'Farbschema',
    'organization_details': 'Organisationsdetails',
    'favorite_templates': 'Lieblingsvorlagen',
  },
  'ja': {
    'analyze_company': '企業分析',
    'analyzing': '分析中...',
    'analyze_website': 'ウェブサイト分析',
    'company_analyzer': '企業アナライザー',
    'personalized_campaigns': 'パーソナライズされたキャンペーン',
    'optimization_settings': '最適化設定',
    'color_scheme': 'カラースキーム',
    'organization_details': '組織の詳細',
    'favorite_templates': 'お気に入りのテンプレート',
  },
  'zh': {
    'analyze_company': '分析公司',
    'analyzing': '分析中...',
    'analyze_website': '分析网站',
    'company_analyzer': '公司分析器',
    'personalized_campaigns': '个性化活动',
    'optimization_settings': '优化设置',
    'color_scheme': '配色方案',
    'organization_details': '组织详情',
    'favorite_templates': '收藏的模板',
  },
};

// Get translated text with fallback
export function t(key: string, locale?: string): string {
  const userLocale = locale || detectUserLocale();
  const lang = userLocale.split('-')[0]; // Get base language

  // Try exact locale match first (e.g., en-GB)
  if (translations[userLocale] && translations[userLocale][key]) {
    return translations[userLocale][key];
  }

  // Try base language (e.g., en)
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }

  // Fallback to en-US
  if (translations['en-US'] && translations['en-US'][key]) {
    return translations['en-US'][key];
  }

  // Return key as fallback
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Hook for React components
export function useLocalization() {
  const locale = detectUserLocale();

  return {
    locale,
    t: (key: string) => t(key, locale),
    localize: (text: string) => localizeText(text, locale),
    setLocale: setUserLocale,
    isUK: locale.startsWith('en-GB') || locale.startsWith('en-UK'),
    isUS: locale.startsWith('en-US'),
  };
}

// AI Translation function (to be integrated with OpenAI)
export async function translateWithAI(text: string, targetLanguage: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLanguage,
        preserveFormatting: true
      })
    });

    if (response.ok) {
      const { translatedText } = await response.json();
      return translatedText;
    }

    return text; // Fallback to original
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}