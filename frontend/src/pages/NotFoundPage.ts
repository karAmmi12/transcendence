import { i18n } from '@/services/i18nService';

export class NotFoundPage {
  private languageListener: (() => void) | null = null;

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    this.setupEventListeners();
    this.render(element);
    this.bindEvents();
  }

  private setupEventListeners(): void {
    this.languageListener = () => {
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);
  }

  private render(element: Element): void {
    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div class="text-center max-w-2xl mx-auto px-4">
          <!-- Animation d'erreur 404 -->
          <div class="mb-8 animate-bounce">
            <div class="text-9xl font-bold text-primary-500 mb-4">404</div>
            <div class="text-6xl mb-4">🏓</div>
          </div>
          
          <!-- Message d'erreur -->
          <h1 class="text-4xl font-bold text-white mb-4" data-i18n="error.404.title">
            ${i18n.t('error.404.title')}
          </h1>
          
          <p class="text-xl text-gray-300 mb-8" data-i18n="error.404.message">
            ${i18n.t('error.404.message')}
          </p>
          
          <!-- Suggestions -->
          <div class="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-200 mb-4" data-i18n="error.404.suggestions.title">
              ${i18n.t('error.404.suggestions.title')}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/" id="home-link" class="btn-primary text-center block">
                🏠 ${i18n.t('nav.home')}
              </a>
              <a href="/game" id="game-link" class="btn-secondary text-center block">
                🎮 ${i18n.t('nav.play')}
              </a>
            </div>
          </div>
          
          <!-- Informations utiles -->
          <div class="text-sm text-gray-400">
            <p class="mb-2" data-i18n="error.404.help">
              ${i18n.t('error.404.help')}
            </p>
            <p>URL: <code class="bg-gray-700 px-2 py-1 rounded">${window.location.pathname}</code></p>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Navigation vers les pages
    document.getElementById('home-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
    });

    document.getElementById('game-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });

    document.getElementById('tournament-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournament/create' }));
    });

    // Bouton retour
    document.getElementById('back-button')?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
      }
    });
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}