// ==========================================
// PAGE DE JEU - Contrôleur principal de l'interface de jeu
// ==========================================
// Gère la sélection des modes de jeu, les paramètres et le cycle de vie du jeu

import { authService } from '@/services/authService.js';
import { i18n } from '@/services/i18nService.js';
import { GameManager } from '@/components/game/GameManager';
import { RemotePong } from '@/components/game/RemotePong.js';
import type { GameSettings, GameManagerConfig } from '@/types/index.js';
import { Logger } from '@/utils/logger.js'; 

// ==========================================
// 🎯 IMPORTS DES COMPOSANTS
// ==========================================
import { GameModeSelector } from '@/components/game/GameModeSelector.js';
import { GameSettingsUI as GameSettingsComponent } from '@/components/game/GameSettings.js';
import { GameInterface } from '@/components/game/GameInterface.js';
import { MobileControls } from '@/components/game/MobileControls.js';

export class GamePage 
{
  // ==========================================
  // 🔧 PROPRIÉTÉS PRIVÉES
  // ==========================================

  // État du jeu
  private gameMode: 'local' | 'remote' | 'tournament' | null = null;
  private gameManager: GameManager | null = null;
  private remotePong: RemotePong | null = null;
  private userPreferredTheme: string | null = null;

  // Gestionnaires d'événements
  private beforeNavigateHandler: ((event: CustomEvent) => void) | null = null;

  // Instances des composants
  private modeSelector: GameModeSelector | null = null;
  private gameSettingsComponent: GameSettingsComponent | null = null;
  private gameInterface: GameInterface | null = null;
  private mobileControls: MobileControls | null = null;

  // ==========================================
  // CONSTRUCTEUR & INITIALISATION
  // ==========================================

  constructor() 
  {
    this.parseGameMode();
    this.setupThemeChangeListener();
  }

  // ==========================================
  // MÉTHODES DE CYCLE DE VIE
  // ==========================================

  async mount(selector: string): Promise<void> 
  {
    const element = document.querySelector(selector);
    if (!element) return;

    await this.loadUserPreferredTheme();
    this.render(element);
    this.bindEvents();
    this.setupNavigationHandler();
  }

  destroy(): void 
  {
    Logger.log('🧹 Destruction de GamePage et nettoyage des jeux actifs');

    this.cleanupEventListeners();
    this.cleanupGameInstances();
    this.cleanupNavigationHandler();
  }

  // ==========================================
  //  MÉTHODES DE RENDU
  // ==========================================

  private render(element: Element): void 
  {
    const isAuthenticated = authService.isAuthenticated();

    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div class="container mx-auto px-4 py-4 md:py-8">
          ${this.renderHeader()}
          ${this.renderModeSelection()}
          ${this.renderGameSettings()}
          ${this.renderGameContainer()}
        </div>
      </div>
    `;
  }

  private renderHeader(): string 
  {
    return `
      <div class="text-center mb-6 md:mb-8">
        <h1 class="text-2xl md:text-4xl font-bold mb-2">
          ${i18n.t('game.title')} - ${this.getGameModeTitle()}
        </h1>
        <p class="text-gray-400 text-sm md:text-base">
          ${this.getGameModeDescription()}
        </p>
      </div>
    `;
  }

  private renderModeSelection(): string 
  {
    this.modeSelector = new GameModeSelector({
      onLocalMode: () => this.selectMode('local'),
      onRemoteMode: () => this.selectMode('remote'),
      onTournamentMode: () => this.selectMode('tournament')
    });

    return `
      <div id="mode-selection" class="${this.gameMode ? 'hidden' : ''}">
        ${this.modeSelector.render()}
      </div>
    `;
  }

  private renderGameSettings(): string 
  {
    if (!this.gameMode)
      return '';

    this.gameSettingsComponent = new GameSettingsComponent(
      this.gameMode,
      this.userPreferredTheme,
      {
        onStartLocal: () => this.startLocalGame(),
        onStartRemote: () => this.startRemoteGame(),
        onCreateTournament: () => this.createTournament(),
        onBackToModes: () => this.showModeSelection(),
        onChangeTheme: () => {
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
        }
      }
    );

    return `
      <div id="game-settings" class="${!this.gameMode ? 'hidden' : ''}">
        ${this.gameSettingsComponent.render()}
      </div>
    `;
  }

  private renderGameContainer(): string 
  {
    if (!this.gameMode) 
      return '';

    this.gameInterface = new GameInterface(
      this.gameMode,
      {
        onPause: () => {
          if (this.gameManager) {
            this.gameManager.pauseGame();
            this.updatePauseButton();
          }
        },
        onQuit: () => this.quitGame()
      }
    );

    return `
      <div id="game-container" class="hidden">
        ${this.gameInterface.render()}
      </div>
    `;
  }

  // ==========================================
  // GESTION DES ÉVÉNEMENTS
  // ==========================================

  private bindEvents(): void 
  {
    this.bindComponentEvents();
    this.bindGlobalEvents();
  }

  private bindComponentEvents(): void 
  {
    this.modeSelector?.bindEvents();
    this.gameSettingsComponent?.bindEvents();
    this.gameInterface?.bindEvents();
    this.setupMobileControls();
  }

  private bindGlobalEvents(): void 
  {
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('startRemoteGame', () => {
      this.startRemoteGame();
    }, { once: true });
  }

  private setupNavigationHandler(): void 
  {
    this.beforeNavigateHandler = (event: CustomEvent) => 
      {
      const targetRoute = event.detail;

      if (targetRoute !== '/game' && this.remotePong && this.isRemoteGameInProgress()) 
      {
        Logger.log('🚶 Sortie de la page de jeu pendant un match distant, nettoyage...');
        this.destroy();
      }
    };

    window.addEventListener('beforeNavigate', this.beforeNavigateHandler as EventListener);
  }

  private setupThemeChangeListener(): void {
    window.addEventListener('themeChanged', this.handleThemeChanged.bind(this));
  }

  // ==========================================
  // GESTION DES MODES DE JEU
  // ==========================================

  private async selectMode(mode: 'local' | 'remote' | 'tournament'): Promise<void> 
  {
    this.gameMode = mode;
    this.updateUrlWithMode(mode);

    const element = document.querySelector('#page-content');
    if (element) 
    {
      this.render(element);
      this.bindEvents();
    }

    await this.handleAutoStartRemoteGame(mode);
  }

  private showModeSelection(): void 
  {
    this.gameMode = null;
    this.updateUrlWithMode(null);

    const element = document.querySelector('#page-content');
    if (element) 
    {
      this.render(element);
      this.bindEvents();
    }
  }

  private updateUrlWithMode(mode: string | null): void 
  {
    const url = new URL(window.location.href);

    if (mode)
    {
      url.searchParams.set('mode', mode);
    } else 
    {
      url.searchParams.delete('mode');
    }

    window.history.replaceState({}, '', url.toString());
  }

  // ==========================================
  // MÉTHODES DE DÉMARRAGE DES JEUX
  // ==========================================

  private async startLocalGame(): Promise<void> 
  {
    try 
    {
      Logger.log('🎮 Démarrage du jeu local...');

      const gameSettings = this.gameSettingsComponent?.getGameSettings();
      if (!gameSettings) return;

      const gameConfig: GameManagerConfig = 
      {
        mode: 'local',
        canvasId: 'game-canvas',
        settings: gameSettings,
        onGameStart: () => {
          Logger.log('✅ Jeu local démarré');
          this.updateGameInterface(gameSettings);
        },
        onGameEnd: async (winner: string, scores: any, duration: number) => {
          Logger.log('🏁 Jeu local terminé (callback) :', { winner, scores, duration });
          await this.handleGameEnd(winner, scores, duration, gameSettings);
        }
      };

      this.gameManager = new GameManager(gameConfig);
      this.showGameInterface();
      await this.gameManager.startGame();

    } catch (error) 
    {
      Logger.error('❌ Échec du démarrage du jeu local :', error);
      this.showError(i18n.t('common.error'));
    }
  }

  private async startRemoteGame(): Promise<void> 
  {
    try 
    {
      Logger.log('🌐 Démarrage du jeu distant...');

      const gameSettings = this.gameSettingsComponent?.getGameSettings();
      if (!gameSettings) 
        return;

      this.showGameInterface();

      Logger.log(' Création d\'une nouvelle instance RemotePong');
      this.remotePong = new RemotePong('game-canvas', gameSettings);

      await this.remotePong.startRemoteGame();

    } catch (error) 
    {
      Logger.error('❌ Échec du démarrage du jeu distant :', error);
      this.showError('Impossible de démarrer la partie en ligne');
    }
  }

  // ==========================================
  // GESTION DE L'ÉTAT DE L'INTERFACE
  // ==========================================

  private showGameInterface(): void 
  {
    this.toggleInterfaceVisibility('game-settings', 'game-container');
  }

  private updateGameInterface(settings: GameSettings): void 
  {
    if (!this.gameInterface) 
      return;

    this.gameInterface.updatePlayerNames(settings.player1Name, settings.player2Name);
    this.gameInterface.updateGameStatus(i18n.t('game.status.playing'), '0 - 0', '00:00');
  }

  private updatePauseButton(): void 
  {
    if (!this.gameManager || !this.gameInterface) 
      return;

    const status = this.gameManager.getGameStatus();
    const isPaused = status === 'paused';

    this.gameInterface.updatePauseButton(isPaused);
  }

  private toggleInterfaceVisibility(hideId: string, showId: string): void 
  {
    const hideElement = document.getElementById(hideId);
    const showElement = document.getElementById(showId);

    if (hideElement && showElement) 
    {
      hideElement.classList.add('hidden');
      showElement.classList.remove('hidden');
    }
  }

  // ==========================================
  // GESTION DE LA FIN DE PARTIE
  // ==========================================

  private async handleGameEnd(winner: string, scores: any, duration: number, settings: GameSettings): Promise<void> 
  {
    try 
    {
      Logger.log('🎮 Partie terminée, données déjà sauvegardées par Pong3D');
    } catch (error) 
    {
      Logger.error('❌ Échec de la sauvegarde des données du match :', error);
    }
  }

  private quitGame(): void 
  {
    this.cleanupGameInstances();
    this.toggleInterfaceVisibility('game-container', 'game-settings');
  }

  private showError(message: string): void 
  {
    if (!this.gameInterface) 
      return;
    this.gameInterface.updateGameStatus(message, '0 - 0', '00:00');
  }

  // ==========================================
  // FONCTIONNALITÉS SPÉCIALES
  // ==========================================

  private createTournament(): void 
  {
    const gameSettings = this.gameSettingsComponent?.getGameSettings();
    if (!gameSettings) 
      return;

    const isAuthenticated = authService.isAuthenticated();

    const params = new URLSearchParams({
      participants: '8',
      mode: isAuthenticated ? 'authenticated' : 'guest',
      ballSpeed: gameSettings.ballSpeed,
      winScore: gameSettings.winScore.toString(),
      theme: gameSettings.theme,
      powerUps: gameSettings.powerUps.toString()
    });

    window.dispatchEvent(new CustomEvent('navigate', {
      detail: `/tournament/create?${params.toString()}`
    }));
  }

  private setupMobileControls(): void 
  {
    this.mobileControls = new MobileControls({
      onPlayer1Up: (pressed: boolean) => {
        if (this.gameManager) {
          this.gameManager.handleMobileInput('player1', 'up', pressed);
        }
      },
      onPlayer1Down: (pressed: boolean) => {
        if (this.gameManager) {
          this.gameManager.handleMobileInput('player1', 'down', pressed);
        }
      },
      onPlayer2Up: (pressed: boolean) => {
        if (this.gameManager) {
          this.gameManager.handleMobileInput('player2', 'up', pressed);
        }
      },
      onPlayer2Down: (pressed: boolean) => {
        if (this.gameManager) {
          this.gameManager.handleMobileInput('player2', 'down', pressed);
        }
      }
    });

    this.mobileControls.bindEvents();
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  private parseGameMode(): void 
  {
    const urlParams = new URLSearchParams(window.location.search);
    this.gameMode = urlParams.get('mode') as 'local' | 'remote' | 'tournament' || null;
  }

  private async loadUserPreferredTheme(): Promise<void> 
  {
    const isAuthenticated = authService.isAuthenticated();

    if (isAuthenticated) {
      try {
        const currentUser = authService.getCurrentUser();
        this.userPreferredTheme = currentUser?.theme || null;
        Logger.log('🎨 Thème préféré de l\'utilisateur chargé :', this.userPreferredTheme);
      } catch (error) {
        Logger.error('❌ Échec du chargement du thème utilisateur :', error);
        this.userPreferredTheme = null;
      }
    } else {
      this.userPreferredTheme = null;
    }
  }

  private handleResize(): void 
  {
    if (this.gameManager) {
      this.gameManager.handleResize();
    }
  }

  private isRemoteGameInProgress(): boolean 
  {
    return this.remotePong !== null;
  }

  private async handleAutoStartRemoteGame(mode: string): Promise<void> 
  {
    const wasInGame = sessionStorage.getItem('remote_game_active');
    if (mode === 'remote' && authService.isAuthenticated() && wasInGame !== 'true') {
      Logger.log('🎮 Démarrage automatique du matchmaking distant');
    } else if (mode === 'remote' && wasInGame === 'true') {
      Logger.log('🚫 Pas de démarrage automatique en raison d\'une interruption de jeu - affichage du modal de défaite');
    }
  }

  // ==========================================
  // 🎨 GESTION DU THÈME
  // ==========================================

  private handleThemeChanged = async (event: CustomEvent) => {
    const newTheme = event.detail.theme;
    Logger.log('🎨 Événement de changement de thème reçu :', newTheme);

    const currentUser = authService.getCurrentUser();
    if (currentUser) 
    {
      currentUser.theme = newTheme;
      authService.updateCurrentUser(currentUser);
    }

    await this.loadUserPreferredTheme();

    const element = document.querySelector('#page-content');
    if (element) 
    {
      this.render(element);
      this.bindEvents();
    }
  };

  // ==========================================
  // MÉTHODES DE NETTOYAGE
  // ==========================================

  private cleanupEventListeners(): void 
  {
    window.removeEventListener('resize', () => this.handleResize());
    window.removeEventListener('themeChanged', this.handleThemeChanged);
  }

  private cleanupGameInstances(): void 
  {
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }

    if (this.remotePong) {
      this.remotePong.destroy();
      this.remotePong = null;
    }
  }

  private cleanupNavigationHandler(): void 
  {
    if (this.beforeNavigateHandler) {
      window.removeEventListener('beforeNavigate', this.beforeNavigateHandler as EventListener);
      this.beforeNavigateHandler = null;
    }
  }

  // ==========================================
  // MÉTHODES HELPER
  // ==========================================

  private getGameModeTitle(): string 
  {
    switch (this.gameMode) 
    {
      case 'local': return i18n.t('game.modes.local');
      case 'remote': return i18n.t('game.modes.remote');
      case 'tournament': return i18n.t('game.modes.tournament');
      default: return i18n.t('common.modeSelection');
    }
  }

  private getGameModeDescription(): string 
  {
    switch (this.gameMode) 
    {
      case 'local': return i18n.t('home.gameModes.local.description');
      case 'remote': return i18n.t('home.gameModes.remote.description');
      case 'tournament': return i18n.t('home.gameModes.tournament.description');
      default: return i18n.t('common.chooseModeDescription');
    }
  }
}