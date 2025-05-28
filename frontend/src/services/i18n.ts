export interface Translations {
  [key: string]: string | Translations;
}

export type Language = 'en' | 'fr' | 'it';

export class I18nService {
  private static instance: I18nService;
  private currentLanguage: Language = 'en';
  private translations: Record<Language, Translations> = {
    en: {},
    fr: {},
    it: {}
  };
  private fallbackLanguage: Language = 'en';
  public translationsLoaded: Promise<void>; // <-- Ajouté

  private constructor() {
    this.translationsLoaded = this.loadTranslations(); // <-- Ajouté
    this.setLanguageFromStorage();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  private async loadTranslations(): Promise<void> {
    try {
      const languages: Language[] = ['en', 'fr', 'it'];
      for (const lang of languages) {
        const response = await fetch(`/src/locales/${lang}.json`);
        if (response.ok) {
          this.translations[lang] = await response.json();
        }
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  private setLanguageFromStorage(): void {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'fr', 'it'].includes(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['en', 'fr', 'it'].includes(browserLang)) {
        this.currentLanguage = browserLang;
      }
    }
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
  }

  public getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' }
    ];
  }

  public t(key: string, params?: Record<string, string>): string {
    const translation = this.getNestedTranslation(key, this.currentLanguage) ||
      this.getNestedTranslation(key, this.fallbackLanguage) ||
      key;

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  private getNestedTranslation(key: string, language: Language): string {
    const keys = key.split('.');
    let current: any = this.translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return '';
      }
    }

    return typeof current === 'string' ? current : '';
  }

  private interpolate(text: string, params: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] || match;
    });
  }

  public tp(key: string, count: number, params?: Record<string, string>): string {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    const translation = this.t(pluralKey, { ...params, count: count.toString() });
    return translation !== pluralKey ? translation : this.t(key, params);
  }
}

export const i18n = I18nService.getInstance();