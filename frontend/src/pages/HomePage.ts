import { i18n } from '@/services/i18nService.js';
import { authService } from '@services/authService';
import { globalStatsService } from '@services/globalStatsService';
import { HeroSection } from '@components/home/HeroSection';
import { UserStatsCard } from '@components/home/UserStatsCard';
import { GlobalStatsCard, type GlobalStats } from '@components/home/GlobalStatsCard';
import { FeaturesGrid } from '@components/home/FeaturesGrid';
import { ActionButtons, type ActionCallbacks } from '@components/home/ActionButtons';
import type { User } from '../types/index.js';

export class HomePage {
  private languageListener: (() => void) | null = null;
  private authListener: (() => void) | null = null;
  private globalStats: GlobalStats | null = null;

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    // Charger les statistiques globales
    await this.loadGlobalStats();

    this.render(element);
    this.destroy();
    this.setupEventListeners(element);
    this.bindEvents();
  }

  private async loadGlobalStats(): Promise<void> {
    try {
      this.globalStats = await globalStatsService.getGlobalStats();
    } catch (error) {
      console.error('Failed to load global stats:', error);
      // Utiliser des stats par défaut en cas d'erreur
      this.globalStats = {
        totalPlayers: 0,
        totalGames: 0,
        onlinePlayers: 0,
        activeTournaments: 0
      };
    }
  }

  private setupEventListeners(element: Element): void {
    this.languageListener = () => {
      this.render(element);
      this.bindEvents();
    };
    window.addEventListener('languageChanged', this.languageListener);

    this.authListener = () => {
      this.render(element);
      this.bindEvents();
    };
    window.addEventListener('authStateChanged', this.authListener);
  }

  private render(element: Element): void {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    // Créer les composants
    const heroSection = new HeroSection(isAuthenticated, currentUser);
    const featuresGrid = new FeaturesGrid();
    
    let userStatsCard = null;
    if (isAuthenticated && currentUser) {
      userStatsCard = new UserStatsCard(currentUser);
    }

    let globalStatsCard = null;
    if (this.globalStats) {
      globalStatsCard = new GlobalStatsCard(this.globalStats);
    }

    // Créer les callbacks pour ActionButtons
    const actionCallbacks: ActionCallbacks = {
      onPlay: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' })),
      onProfile: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' })),
      onTournaments: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournaments' })),
      onLogin: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' })),
      onRegister: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/register' }))
    };

    const actionButtons = new ActionButtons(isAuthenticated, actionCallbacks);

    // Assembler le layout
    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div class="container mx-auto px-4 py-8">
          ${heroSection.render()}
          
          ${!isAuthenticated && globalStatsCard ? globalStatsCard.render() : ''}
          ${isAuthenticated && userStatsCard ? userStatsCard.render() : ''}
          
          ${featuresGrid.render()}
          ${actionButtons.render()}
        </div>
      </div>
    `;

    // Attacher les événements
    actionButtons.bindEvents();
  }

  private bindEvents(): void {
    // Les événements sont maintenant gérés par les composants
    // Cette méthode peut être utilisée pour des événements spécifiques à la page
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
    
    if (this.authListener) {
      window.removeEventListener('authStateChanged', this.authListener);
      this.authListener = null;
    }
  }
}