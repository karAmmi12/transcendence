import { i18n } from '@/services/i18nService.js';
import { authService } from '@services/authService';
import { globalStatsService } from '@services/globalStatsService';
import { HeroSection } from '@components/home/HeroSection';
import { GlobalStatsCard } from '@components/home/GlobalStatsCard';
import { UserStatsCard } from '@components/home/UserStatsCard';
import { GameModeButtons } from '@components/home/GameModeButtons';
import type { User, GlobalStats } from '../types/index.js';

export interface GameModeCallbacks {
  onLocalGame: () => void;
  onRemoteGame: () => void;
  onTournament: () => void;
  onLogin: () => void;
}

export class HomePage {
  private languageListener: (() => void) | null = null;
  private authListener: (() => void) | null = null;
  private globalStats: GlobalStats | null = null;

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;
    

    await this.loadGlobalStats();
    this.render(element);
    this.destroy();
    this.setupEventListeners();
  }

  private async loadGlobalStats(): Promise<void> {
    try {
      this.globalStats = await globalStatsService.getGlobalStats();
    } catch (error) {
      console.error('Failed to load global stats:', error);
      this.globalStats = {
        totalPlayers: 0,
        totalGames: 0,
        onlinePlayers: 0,
      };
    }
  }

  private setupEventListeners(): void {
    this.languageListener = () => {
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);

    this.authListener = () => {
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('authStateChanged', this.authListener);
  }

  private render(element: Element): void {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    // Créer les composants
    const heroSection = new HeroSection();
    
    let userStatsCard = null;
    if (isAuthenticated && currentUser) {
      userStatsCard = new UserStatsCard(currentUser);
    }

    let globalStatsCard = null;
    if (this.globalStats) {
      globalStatsCard = new GlobalStatsCard(this.globalStats);
    }

    // Créer les callbacks pour les modes de jeu
    const gameModeCallbacks: GameModeCallbacks = {
      onLocalGame: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/game?mode=local' })),
      onRemoteGame: () => {
        if (isAuthenticated) {
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/game?mode=remote' }));
        } else {
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
        }
      },
      onTournament: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournament' })),
      onLogin: () => window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }))
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

    // Attacher les événements
    gameModeButtons.bindEvents();
  }

  private renderStatsSection(globalStatsCard: any, userStatsCard: any): string {
    // Si aucune stat à afficher
    if (!globalStatsCard && !userStatsCard) {
      return '';
    }

    // Si seulement une carte à afficher, la centrer
    if (globalStatsCard && !userStatsCard) {
      return `
        <div class="flex justify-center mb-12">
          <div class="w-full max-w-md">
            ${globalStatsCard.render()}
          </div>
        </div>
      `;
    }

    if (!globalStatsCard && userStatsCard) {
      return `
        <div class="flex justify-center mb-12">
          <div class="w-full max-w-md">
            ${userStatsCard.render()}
          </div>
        </div>
      `;
    }

    // Si les deux cartes sont présentes, utiliser une grille responsive
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        ${globalStatsCard.render()}
        ${userStatsCard.render()}
      </div>
    `;
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