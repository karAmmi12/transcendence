import { i18n } from '@/services/i18nService';
import type { Language } from '@/types/index.js';

export class LanguageSelector
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private isOpen = false;

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Monte le sélecteur de langue dans l'élément spécifié
   */
  mount(selector: string): void
  {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element as HTMLElement);
    this.bindEvents(element as HTMLElement);

    // Écouter les changements de langue
    window.addEventListener('languageChanged', () =>
    {
      this.render(element as HTMLElement);
    });
  }

  /**
   * Nettoie les ressources du sélecteur
   */
  destroy(): void
  {
    // Nettoyer les écouteurs d'événements si nécessaire
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Rend le sélecteur de langue
   */
  private render(element: HTMLElement): void
  {
    const currentLang = i18n.getCurrentLanguage();
    const languages = i18n.getAvailableLanguages();
    const currentLanguage = languages.find(lang => lang.code === currentLang);

    element.innerHTML = `
      <div class="relative inline-block text-left">
        <button
          id="language-toggle"
          type="button"
          class="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-primary-500 transition-colors duration-200"
          aria-expanded="${this.isOpen}"
          aria-haspopup="true"
        >
          <span class="mr-2">${currentLanguage?.flag || '🌐'}</span>
          <span class="hidden sm:inline">${currentLanguage?.name || 'Language'}</span>
          <span class="sm:hidden">${currentLanguage?.code.toUpperCase() || 'EN'}</span>
          <svg class="w-4 h-4 ml-2 -mr-1 transform transition-transform duration-200 ${this.isOpen ? 'rotate-180' : ''}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>

        <div
          id="language-dropdown"
          class="absolute right-0 z-50 mt-2 origin-top-right bg-gray-800 border border-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ${this.isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-toggle"
        >
          <div class="py-1" role="none">
            ${languages.map(lang => `
              <button
                class="language-option group flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${currentLang === lang.code ? 'bg-gray-700 text-white' : ''}"
                role="menuitem"
                data-lang="${lang.code}"
              >
                <span class="mr-3">${lang.flag}</span>
                <span>${lang.name}</span>
                ${currentLang === lang.code ? '<svg class="w-4 h-4 ml-auto text-primary-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // MÉTHODES PRIVÉES D'ÉVÉNEMENTS
  // ==========================================

  /**
   * Attache les événements au sélecteur
   */
  private bindEvents(element: HTMLElement): void
  {
    const toggleButton = element.querySelector('#language-toggle');
    const dropdown = element.querySelector('#language-dropdown');
    const options = element.querySelectorAll('.language-option');

    // Basculer le dropdown
    toggleButton?.addEventListener('click', (e) =>
    {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
      this.render(element);
    });

    // Fermer le dropdown en cliquant à l'extérieur
    document.addEventListener('click', (e) =>
    {
      if (!element.contains(e.target as Node))
      {
        this.isOpen = false;
        this.render(element);
      }
    });

    // Gérer la sélection de langue
    options.forEach(option =>
    {
      option.addEventListener('click', (e) =>
      {
        const lang = (e.currentTarget as HTMLElement).dataset.lang as Language;
        if (lang)
        {
          i18n.setLanguage(lang);
          this.isOpen = false;
          this.render(element);
        }
      });
    });

    // Fermer le dropdown avec Échap
    document.addEventListener('keydown', (e) =>
    {
      if (e.key === 'Escape' && this.isOpen)
      {
        this.isOpen = false;
        this.render(element);
      }
    });
  }
}