// ==========================================
// PAGE D'ACCUEIL - Page principale de l'application
// ==========================================
// Affiche les statistiques globales, les statistiques utilisateur et les boutons de modes de jeu

// ==========================================
// IMPORTS
// ==========================================
import { i18n } from '@/services/i18nService.js';
import { authService } from '@services/authService';
import { globalStatsService } from '@services/globalStatsService';

// ==========================================
// IMPORTS DES COMPOSANTS
// ==========================================
import { HeroSection } from '@components/home/HeroSection';
import { GlobalStatsCard } from '@components/home/GlobalStatsCard';
import { UserStatsCard } from '@components/home/UserStatsCard';
import { GameModeButtons } from '@components/home/GameModeButtons';
import type { GlobalStats, GameModeCallbacks } from '@/types/index.js';

// ==========================================
// 🏠 CLASSE PRINCIPALE
// ==========================================
export class HomePage
{
  // ==========================================
  // 🔧 PROPRIÉTÉS PRIVÉES
  // ==========================================

  // Gestionnaires d'événements
  private languageListener: (() => void) | null = null;
  private authListener: (() => void) | null = null;

  // Données de l'application
  private globalStats: GlobalStats | null = null;

  // ==========================================
  //  MÉTHODES DE CYCLE DE VIE
  // ==========================================

  async mount(selector: string): Promise<void>
  {
    const element = document.querySelector(selector);
    if (!element) return;

    // Nettoyer l'état précédent
    this.destroy();

    // Charger les données nécessaires
    await Promise.all([
      this.loadGlobalStats(),
      this.verifyAuthentication()
    ]);

    // Rendre et configurer la page
    this.render(element);
    this.setupEventListeners();
  }

  destroy(): void
  {
    console.log('🧹 Destruction de HomePage et nettoyage des écouteurs');

    if (this.languageListener)
    {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }

    if (this.authListener)
    {
      window.removeEventListener('authStateChanged', this.authListener);
      this.authListener = null;
    }
  }

  // ==========================================
  //  MÉTHODES DE CHARGEMENT DES DONNÉES
  // ==========================================

  private async loadGlobalStats(): Promise<void>
  {
    try
    {
      console.log('📊 Chargement des statistiques globales...');
      this.globalStats = await globalStatsService.getGlobalStats();
      console.log('✅ Statistiques globales chargées:', this.globalStats);
    }
    catch (error)
    {
      console.error('❌ Échec du chargement des statistiques globales:', error);
      // Valeurs par défaut en cas d'erreur
      this.globalStats = {
        totalPlayers: 0,
        totalGames: 0,
        onlinePlayers: 0,
      };
    }
  }

  private async verifyAuthentication(): Promise<void>
  {
    try
    {
      console.log('🔐 Vérification de l\'authentification...');

      // Vérifier si l'utilisateur est connecté et charger ses données si nécessaire
      if (authService.isAuthenticated())
      {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.stats)
        {
          console.log('👤 Rechargement des données utilisateur...');
          // Recharger les données utilisateur si elles sont incomplètes
          await authService.loadCurrentUser();
        }
      }

      console.log('✅ Authentification vérifiée');
    }
    catch (error)
    {
      console.error('❌ Échec de la vérification de l\'authentification:', error);
    }
  }

  // ==========================================
  //  GESTION DES ÉVÉNEMENTS
  // ==========================================

  private setupEventListeners(): void
  {
    console.log('🎧 Configuration des écouteurs d\'événements...');

    // Écouteur pour les changements de langue
    this.languageListener = () =>
    {
      console.log('🌐 Changement de langue détecté, re-rendu de la page');
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);

    // Écouteur pour les changements d'authentification
    this.authListener = () =>
    {
      console.log('🔐 Changement d\'authentification détecté, re-rendu de la page');
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('authStateChanged', this.authListener);
  }

  // ==========================================
  //  MÉTHODES DE RENDU
  // ==========================================

  private render(element: Element): void
  {
    console.log('🎨 Rendu de la page d\'accueil...');

    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    // Créer les composants principaux
    const heroSection = new HeroSection();

    // Créer les cartes de statistiques conditionnellement
    let userStatsCard = null;
    if (isAuthenticated && currentUser)
    {
      userStatsCard = new UserStatsCard(currentUser);
    }

    let globalStatsCard = null;
    if (this.globalStats)
    {
      globalStatsCard = new GlobalStatsCard(this.globalStats);
    }

    // Configurer les callbacks pour les modes de jeu
    const gameModeCallbacks: GameModeCallbacks =
    {
      onLocalGame: () =>
      {
        console.log('🎮 Navigation vers le jeu local');
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game?mode=local' }));
      },
      onRemoteGame: () =>
      {
        if (isAuthenticated)
        {
          console.log('🌐 Navigation vers le jeu distant');
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/game?mode=remote' }));
        }
        else
        {
          console.log('🔐 Redirection vers la connexion pour le jeu distant');
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/login?redirect=/game?mode=remote' }));
        }
      },
      onTournament: () =>
      {
        console.log('🏆 Navigation vers les tournois');
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game?mode=tournament' }));
      },
      onLogin: () =>
      {
        console.log('🔐 Redirection vers la connexion');
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/login?redirect=/game?mode=remote' }));
      }
    };

    const gameModeButtons = new GameModeButtons(isAuthenticated, gameModeCallbacks);

    // Assembler le layout responsive
    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div class="container mx-auto px-4 py-8">
          ${heroSection.render()}

          ${this.renderStatsSection(globalStatsCard, userStatsCard)}

          ${gameModeButtons.render()}
        </div>
      </div>
    `;

    // Attacher les événements des composants
    gameModeButtons.bindEvents();

    console.log('✅ Page d\'accueil rendue avec succès');
  }

  private renderStatsSection(globalStatsCard: any, userStatsCard: any): string
  {
    // Si aucune statistique à afficher
    if (!globalStatsCard && !userStatsCard)
    {
      console.log('📊 Aucune statistique à afficher');
      return '';
    }

    // Si seulement une carte à afficher, la centrer
    if (globalStatsCard && !userStatsCard)
    {
      console.log('📊 Affichage des statistiques globales uniquement');
      return `
        <div class="flex justify-center mb-12">
          <div class="w-full max-w-md">
            ${globalStatsCard.render()}
          </div>
        </div>
      `;
    }

    if (!globalStatsCard && userStatsCard)
    {
      console.log('📊 Affichage des statistiques utilisateur uniquement');
      return `
        <div class="flex justify-center mb-12">
          <div class="w-full max-w-md">
            ${userStatsCard.render()}
          </div>
        </div>
      `;
    }

    // Si les deux cartes sont présentes, utiliser une grille responsive
    console.log('📊 Affichage des statistiques globales et utilisateur');
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        ${globalStatsCard.render()}
        ${userStatsCard.render()}
      </div>
    `;
  }
}