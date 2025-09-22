import type { Translations, Language } from '@/types/index.js';

export class I18nService {
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private static instance: I18nService;
  private currentLanguage: Language = 'en';
  private translations: Record<Language, Translations> = {
    en: {},
    fr: {},
    it: {},
    es: {},
    kab: {},
    'kab-tfng': {}, 
    ar: {},
    sg: {}
  };
  private fallbackLanguage: Language = 'en';
  public translationsLoaded: Promise<void>;

  // ==========================================
  // INITIALISATION ET CONFIGURATION
  // ==========================================

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor() {
    this.translationsLoaded = this.loadTranslations();
    this.setLanguageFromStorage();
  }

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  // ==========================================
  // CHARGEMENT DES TRADUCTIONS
  // ==========================================

  /**
   * Charge les traductions pour toutes les langues supportées
   */
  private async loadTranslations(): Promise<void> {
    try {
      const languages: Language[] = ['en', 'fr', 'it', 'es', 'kab', 'kab-tfng', 'ar', 'sg'];
      for (const lang of languages) {
        const response = await fetch(`/src/locales/${lang}.json`);
        console.log(`✅ Successfully loaded ${lang} translations`);
        if (response.ok) {
          this.translations[lang] = await response.json();
        }
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  // ==========================================
  // GESTION DE LA LANGUE
  // ==========================================

  /**
   * Définit la langue à partir du stockage local
   */
  private setLanguageFromStorage(): void {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    }
  }

  /**
   * Obtient la langue actuelle
   */
  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Définit la langue actuelle
   */
  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    
    // Add Tifinagh class for specific styling
    if (language === 'kab-tfng') {
      document.documentElement.classList.add('tifinagh');
    } else {
      document.documentElement.classList.remove('tifinagh');
    }
    
    window.dispatchEvent(new CustomEvent('languageChanged'));
  }

  /**
   * Obtient la liste des langues disponibles
   */
  public getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'kab', name: 'Taqbaylit', flag: `
                                              <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                                              <rect fill="#0090DA" width="900" height="200"/>
                                              <rect fill="#78BE20" y="200" width="900" height="200"/>
                                              <rect fill="#CC0033" y="400" width="900" height="200"/>
                                              <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                                              </svg>
                                              ` },
      { code: 'kab-tfng', name: 'ⵜⴰⵇⴱⴰⵢⵍⵉⵜ', flag: `
                                              <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                                              <rect fill="#0090DA" width="900" height="200"/>
                                              <rect fill="#78BE20" y="200" width="900" height="200"/>
                                              <rect fill="#CC0033" y="400" width="900" height="200"/>
                                              <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                                              </svg>
                                              ` },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'sg', name: 'Sängö', flag: '🇨🇫' }
    ];
  }

  // ==========================================
  // TRADUCTION
  // ==========================================

  /**
   * Traduit une clé donnée avec des paramètres optionnels
   */
  public t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (!value) {
      // Fallback to English
      value = this.translations[this.fallbackLanguage];
      for (const k of keys) {
        
        value = value?.[k];
      }
    }
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters
    if (params) {
      console.log('🔄 Replacing placeholders in:', value, 'with:', params);
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        const replacement = params[param] || match;
        console.log(`  ${match} -> ${replacement}`);
        return replacement;
      });
    }
    
    return value;
  }
}

export const i18n = I18nService.getInstance();