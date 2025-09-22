// ==========================================
// PAGE 404 - Gestion des pages introuvables
// ==========================================
// Affiche une page d'erreur 404 avec navigation vers les pages principales

// ==========================================
// IMPORTS
// ==========================================
import { i18n } from '@/services/i18nService';
import { Logger } from '@/utils/logger.js'; 

// ==========================================
// CLASSE PRINCIPALE
// ==========================================
export class NotFoundPage
{
  // ==========================================
  // 🔧 PROPRIÉTÉS PRIVÉES
  // ==========================================

  // Gestionnaires d'événements
  private languageListener: (() => void) | null = null;

  // ==========================================
  // MÉTHODES DE CYCLE DE VIE
  // ==========================================

  async mount(selector: string): Promise<void>
  {
    const element = document.querySelector(selector);
    if (!element) return;

    // Configurer les écouteurs d'événements
    this.setupEventListeners();

    // Rendre la page
    this.render(element);

    // Attacher les événements
    this.bindEvents();
  }

  destroy(): void
  {
    Logger.log('🧹 Destruction de NotFoundPage et nettoyage des écouteurs');

    if (this.languageListener)
    {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }

  // ==========================================
  // GESTION DES ÉVÉNEMENTS
  // ==========================================

  private setupEventListeners(): void
  {
    Logger.log('🎧 Configuration des écouteurs d\'événements');

    // Écouteur pour les changements de langue
    this.languageListener = () =>
    {
      Logger.log('🌐 Changement de langue détecté, re-rendu de la page 404');
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);
  }

  private bindEvents(): void
  {
    Logger.log('🎯 Configuration des événements de navigation');

    // Navigation vers les pages principales
    document.getElementById('home-link')?.addEventListener('click', (e) =>
    {
      e.preventDefault();
      Logger.log('🏠 Navigation vers l\'accueil depuis 404');
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
    });

    document.getElementById('game-link')?.addEventListener('click', (e) =>
    {
      e.preventDefault();
      Logger.log('🎮 Navigation vers le jeu depuis 404');
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });

    document.getElementById('tournament-link')?.addEventListener('click', (e) =>
    {
      e.preventDefault();
      Logger.log('🏆 Navigation vers la création de tournoi depuis 404');
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournament/create' }));
    });

    // Bouton retour
    document.getElementById('back-button')?.addEventListener('click', () =>
    {
      Logger.log('⬅️ Bouton retour cliqué');
      if (window.history.length > 1)
      {
        window.history.back();
      }
      else
      {
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
      }
    });
  }

  // ==========================================
  // MÉTHODES DE RENDU
  // ==========================================

  private render(element: Element): void
  {
    Logger.log('🎨 Rendu de la page 404');

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

          <!-- Suggestions de navigation -->
          <div class="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-200 mb-4" data-i18n="error.404.suggestions.title">
              ${i18n.t('error.404.suggestions.title')}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/" id="home-link" class="btn-primary text-center block">
                🏠 ${i18n.t('nav.home')}
              </a>
              <a href="/game" id="game-link" class="btn-secondary text-center block">
                🎮 ${i18n.t('nav.play')}
              </a>
              <a href="/tournament/create" id="tournament-link" class="btn-secondary text-center block">
                🏆 ${i18n.t('tournament.create.title')}
              </a>
            </div>
          </div>

          <!-- Bouton retour -->
          <button id="back-button" class="btn-secondary mb-8">
            ⬅️ ${i18n.t('common.back')}
          </button>

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
}