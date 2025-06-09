export interface Translations {
  [key: string]: string | Translations;
}

export type Language = 'en' | 'fr' | 'it' | 'kab' | 'ar' | 'sg';

export class I18nService {
  private static instance: I18nService;
  private currentLanguage: Language = 'en';
  private translations: Record<Language, Translations> = {
    en: {},
    fr: {},
    it: {},
    kab: {},
    ar: {},
    sg: {}
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
      const languages: Language[] = ['en', 'fr', 'it', 'kab', 'ar', 'sg'];
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
    document.documentElement.dir = (language === 'ar') ? 'rtl' : 'ltr';
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
  }

  public getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'kab', name: 'Taqbaylit', flag: `
                                              <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                                              <rect fill="#0090DA" width="900" height="200"/>
                                              <rect fill="#78BE20" y="200" width="900" height="200"/>
                                              <rect fill="#FEDD00" y="400" width="900" height="200"/>
                                              <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966"/>
                                              <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893z"/>
                                              <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                                              </svg>
                                              ` },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'sg', name: 'Sango', flag: '🇨🇫' }

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