import { Config } from '../types';

export class LanguageSwitcher {
  private config: Config;
  private currentLocale: string;
  private currentPath: string;

  constructor(config: Config, currentLocale: string, currentPath: string) {
    this.config = config;
    this.currentLocale = currentLocale;
    this.currentPath = currentPath;
  }

  generateHTML(): string {
    const locales = Object.entries(this.config.locales);
    
    return `
<div id="intelaglot-language-switcher" class="language-switcher">
  <style>
    .language-switcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 8px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .language-switcher-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      min-width: 120px;
    }
    .language-switcher-toggle:hover {
      background: #f5f5f5;
      border-radius: 4px;
    }
    .language-switcher-dropdown {
      display: none;
      position: absolute;
      bottom: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 8px;
      overflow: hidden;
      min-width: 160px;
    }
    .language-switcher-dropdown.active {
      display: block;
    }
    .language-switcher-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      text-decoration: none;
      color: #333;
      transition: background 0.2s;
      font-size: 14px;
    }
    .language-switcher-option:hover {
      background: #f5f5f5;
    }
    .language-switcher-option.current {
      background: #e3f2fd;
      font-weight: 500;
    }
    .language-flag {
      font-size: 20px;
      line-height: 1;
    }
    @media (max-width: 768px) {
      .language-switcher {
        bottom: 10px;
        right: 10px;
      }
    }
  </style>
  
  <button class="language-switcher-toggle" onclick="toggleLanguageDropdown(event)">
    <span class="language-flag">${this.config.locales[this.currentLocale].flag}</span>
    <span>${this.config.locales[this.currentLocale].name}</span>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M3 5L6 8L9 5H3Z"/>
    </svg>
  </button>
  
  <div class="language-switcher-dropdown" id="language-dropdown">
    ${locales.map(([locale, config]) => `
      <a href="${this.getLocalizedUrl(locale)}" 
         class="language-switcher-option ${locale === this.currentLocale ? 'current' : ''}"
         onclick="setLanguagePreference('${locale}')">
        <span class="language-flag">${config.flag}</span>
        <span>${config.name}</span>
      </a>
    `).join('')}
  </div>
</div>

<script>
  function toggleLanguageDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('language-dropdown');
    dropdown.classList.toggle('active');
    
    document.addEventListener('click', function closeDropdown(e) {
      if (!e.target.closest('#intelaglot-language-switcher')) {
        dropdown.classList.remove('active');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }
  
  function setLanguagePreference(locale) {
    document.cookie = \`intelaglot_locale=\${locale}; path=/; max-age=31536000; SameSite=Lax\`;
  }
  
  const savedLocale = document.cookie
    .split('; ')
    .find(row => row.startsWith('intelaglot_locale='))
    ?.split('=')[1];
    
  if (savedLocale && savedLocale !== '${this.currentLocale}') {
    const localeUrls = ${JSON.stringify(this.getAllLocalizedUrls())};
    if (localeUrls[savedLocale]) {
      window.location.href = localeUrls[savedLocale];
    }
  }
</script>`;
  }

  generateSimpleHTML(): string {
    const locales = Object.entries(this.config.locales);
    
    return `
<div class="intelaglot-lang-switcher">
  <select onchange="window.location.href=this.value" aria-label="Language">
    ${locales.map(([locale, config]) => `
      <option value="${this.getLocalizedUrl(locale)}" ${locale === this.currentLocale ? 'selected' : ''}>
        ${config.flag} ${config.name}
      </option>
    `).join('')}
  </select>
</div>`;
  }

  private getLocalizedUrl(locale: string): string {
    let cleanPath = this.currentPath.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    
    if (locale === this.config.defaultLocale) {
      return cleanPath || '/';
    }
    
    return `/${locale}${cleanPath}`;
  }

  private getAllLocalizedUrls(): Record<string, string> {
    const urls: Record<string, string> = {};
    
    for (const locale of Object.keys(this.config.locales)) {
      urls[locale] = this.getLocalizedUrl(locale);
    }
    
    return urls;
  }

  injectIntoHTML(html: string): string {
    const switcher = this.generateHTML();
    const bodyEndIndex = html.indexOf('</body>');
    
    if (bodyEndIndex !== -1) {
      return html.slice(0, bodyEndIndex) + switcher + html.slice(bodyEndIndex);
    }
    
    return html + switcher;
  }
}