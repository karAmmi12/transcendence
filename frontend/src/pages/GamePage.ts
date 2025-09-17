import { authService } from '@/services/authService.js';
import { userService } from '@/services/userService.js';
import { i18n } from '@/services/i18nService.js';
import { GameManager, GameManagerConfig } from '@/components/game/GameManager';
import { matchService } from '@/services/matchService';
import type { GameSettings } from '@/components/game/Pong3D/Pong3D.js';
import { RemotePong } from '@/components/game/RemotePong.js';

// Nouveaux imports des composants
import { GameModeSelector } from '@/components/game/GameModeSelector.js';
import { GameSettings as GameSettingsComponent } from '@/components/game/GameSettings.js';
import { GameInterface } from '@/components/game/GameInterface.js';
import { MobileControls } from '@/components/game/MobileControls.js';

export class GamePage {
  private gameMode: 'local' | 'remote' | 'tournament' | null = null;
  private gameManager: GameManager | null = null;
  private remotePong: RemotePong | null = null;
  private settings: GameSettings | null = null;
  private userPreferredTheme: string | null = null;

  private beforeNavigateHandler: ((event: CustomEvent) => void) | null = null;

  // Nouvelles instances des composants
  private modeSelector: GameModeSelector | null = null;
  private gameSettingsComponent: GameSettingsComponent | null = null;
  private gameInterface: GameInterface | null = null;
  private mobileControls: MobileControls | null = null;

  constructor() {
    this.parseGameMode();

    window.addEventListener('themeChanged', this.handleThemeChanged.bind(this));
  }

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    await this.loadUserPreferredTheme();

    this.render(element);
    this.bindEvents();
    this.setupNavigationHandler();
  }

  private setupNavigationHandler(): void {
    this.beforeNavigateHandler = (event: CustomEvent) => {
      const targetRoute = event.detail;
      
      // Si on quitte la page de jeu et qu'une partie remote est en cours
      if (targetRoute !== '/game' && this.remotePong && 
          this.isRemoteGameInProgress()) {
        console.log('🚶 Leaving game page during remote match, cleaning up...');
        this.destroy();
      }
    };
    
    window.addEventListener('beforeNavigate', this.beforeNavigateHandler as EventListener);
  }

  private isRemoteGameInProgress(): boolean {
    return this.remotePong !== null;
  }

  private async loadUserPreferredTheme(): Promise<void> {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        const currentUser = authService.getCurrentUser();
        this.userPreferredTheme = currentUser?.theme || null;
        console.log('🎨 User preferred theme loaded:', this.userPreferredTheme);
      } catch (error) {
        console.error('❌ Failed to load user theme:', error);
        this.userPreferredTheme = null;
      }
    } else {
      this.userPreferredTheme = null;
    }
  }

  private handleThemeChanged = async (event: CustomEvent) => {
    const newTheme = event.detail.theme;
    console.log('🎨 Theme changed event received:', newTheme);

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentUser.theme = newTheme;
      authService.updateCurrentUser(currentUser);
    }
    
    await this.loadUserPreferredTheme();
    
    const element = document.querySelector('#page-content');
    if (element) {
      this.render(element);
      this.bindEvents();
    }
  };

  private parseGameMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.gameMode = urlParams.get('mode') as 'local' | 'remote' | 'tournament' || null;
  }

  private render(element: Element): void {
    const isAuthenticated = authService.isAuthenticated();
    
    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div class="container mx-auto px-4 py-4 md:py-8">
          <!-- Header -->
          <div class="text-center mb-6 md:mb-8">
            <h1 class="text-2xl md:text-4xl font-bold mb-2">
              ${i18n.t('game.title')} - ${this.getGameModeTitle()}
            </h1>
            <p class="text-gray-400 text-sm md:text-base">
              ${this.getGameModeDescription()}
            </p>
          </div>
          
          <!-- Mode Selection -->
          <div id="mode-selection" class="${this.gameMode ? 'hidden' : ''}">
            ${this.renderModeSelection()}
          </div>

          <!-- Game Settings -->
          <div id="game-settings" class="${!this.gameMode ? 'hidden' : ''}">
            ${this.renderGameSettings()}
          </div>

          <!-- Game Container -->
          <div id="game-container" class="hidden">
            ${this.renderGameContainer()}
          </div>
        </div>
      </div>
    `;
  }

  private renderModeSelection(): string {
    this.modeSelector = new GameModeSelector({
      onLocalMode: () => this.selectMode('local'),
      onRemoteMode: () => this.selectMode('remote'),
      onTournamentMode: () => this.selectMode('tournament')
    });
    
    return this.modeSelector.render();
  }

  private renderGameSettings(): string {
    if (!this.gameMode) return '';
    
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
    
    return this.gameSettingsComponent.render();
  }

  private renderGameContainer(): string {
    if (!this.gameMode) return '';
    
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
    
    return this.gameInterface.render();
  }

  private bindEvents(): void {
    // Bind mode selector events
    this.modeSelector?.bindEvents();
    
    // Bind game settings events
    this.gameSettingsComponent?.bindEvents();
    
    // Bind game interface events
    this.gameInterface?.bindEvents();
    
    // Setup mobile controls
    this.setupMobileControls();

    // Responsive resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Écouter l'événement de redémarrage remote
    window.addEventListener('startRemoteGame', () => {
      this.startRemoteGame();
    }, { once: true });
  }
  
  private createTournament(): void {
    const gameSettings = this.gameSettingsComponent?.getGameSettings();
    if (!gameSettings) return;
    
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

  private updatePauseButton(): void {
    if (!this.gameManager || !this.gameInterface) return;

    const status = this.gameManager.getGameStatus();
    const isPaused = status === 'paused';
    
    this.gameInterface.updatePauseButton(isPaused);
  }

  private async selectMode(mode: 'local' | 'remote' | 'tournament'): Promise<void> {
    this.gameMode = mode;
    
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url.toString());
    
    const element = document.querySelector('#page-content');
    if (element) this.render(element);
    this.bindEvents();

    const wasInGame = sessionStorage.getItem('remote_game_active');
    if (mode === 'remote' && authService.isAuthenticated() && wasInGame !== 'true') {
      console.log('🎮 Auto-starting remote matchmaking');
    } else if (mode === 'remote' && wasInGame === 'true') {
      console.log('🚫 Not auto-starting due to game interruption - showing forfeit modal');
    }
  }

  private showModeSelection(): void {
    this.gameMode = null;
    
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.toString());
    
    const element = document.querySelector('#page-content');
    if (element) this.render(element);
    this.bindEvents();
  }

  private async startLocalGame(): Promise<void> {
    try {
      console.log('🎮 Starting local game...');
      
      const gameSettings = this.gameSettingsComponent?.getGameSettings();
      if (!gameSettings) return;
      
      const gameConfig: GameManagerConfig = {
        mode: 'local',
        canvasId: 'game-canvas',
        settings: gameSettings,
        onGameStart: () => {
          console.log('✅ Local game started');
          this.updateGameInterface(gameSettings);
        },
        onGameEnd: async (winner: string, scores: any, duration: number) => {
          console.log('🏁 Local game ended (callback):', { winner, scores, duration });
          await this.handleGameEnd(winner, scores, duration, gameSettings);
        }
      };

      this.gameManager = new GameManager(gameConfig);
      this.showGameInterface();
      await this.gameManager.startGame();

    } catch (error) {
      console.error('❌ Failed to start local game:', error);
      this.showError(i18n.t('common.error'));
    }
  }

  private async startRemoteGame(): Promise<void> {
    try {
      console.log('🌐 Starting remote game...');
      
      const gameSettings = this.gameSettingsComponent?.getGameSettings();
      if (!gameSettings) return;
      
      this.showGameInterface();
      
      console.log('🆕 Creating new RemotePong instance');
      this.remotePong = new RemotePong('game-canvas', gameSettings);
      
      window.addEventListener('startRemoteGame', () => {
        this.startRemoteGame();
      }, { once: true });
      
      await this.remotePong.startRemoteGame();

    } catch (error) {
      console.error('❌ Failed to start remote game:', error);
      this.showError('Impossible de démarrer la partie en ligne');
    }
  }

  private cancelMatchmaking(): void {
    console.log('❌ Canceling matchmaking...');
    
    if (this.remotePong) {
      this.remotePong.destroy();
      this.remotePong = null;
    }
    
    this.showModeSelection();
  }

  private showGameInterface(): void {
    const settings = document.getElementById('game-settings');
    const container = document.getElementById('game-container');
    
    if (settings && container) {
      settings.classList.add('hidden');
      container.classList.remove('hidden');
    }
  }

  private updateGameInterface(settings: GameSettings): void {
    if (!this.gameInterface) return;
    
    this.gameInterface.updatePlayerNames(settings.player1Name, settings.player2Name);
    this.gameInterface.updateGameStatus(i18n.t('game.status.playing'), '0 - 0', '00:00');
  }

  private async handleGameEnd(winner: string, scores: any, duration: number, settings: GameSettings): Promise<void> {
    try {
      console.log('🎮 Game ended, data already saved by Pong3D');
    } catch (error) {
      console.error('❌ Failed to save match data:', error);
    }
  }

  private quitGame(): void {
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }

    if (this.remotePong) {
      this.remotePong.destroy();
      this.remotePong = null;
    }
    
    const settings = document.getElementById('game-settings');
    const container = document.getElementById('game-container');
    
    if (settings && container) {
      container.classList.add('hidden');
      settings.classList.remove('hidden');
    }
  }

  private showError(message: string): void {
    if (!this.gameInterface) return;
    
    this.gameInterface.updateGameStatus(message, '0 - 0', '00:00');
  }

  private setupMobileControls(): void {
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

  private handleResize(): void {
    if (this.gameManager) {
      this.gameManager.handleResize();
    }
  }

  private getGameModeTitle(): string {
    switch (this.gameMode) {
      case 'local': return i18n.t('game.modes.local');
      case 'remote': return i18n.t('game.modes.remote');
      case 'tournament': return i18n.t('game.modes.tournament');
      default: return i18n.t('common.modeSelection');
    }
  }

  private getGameModeDescription(): string {
    switch (this.gameMode) {
      case 'local': return i18n.t('home.gameModes.local.description');
      case 'remote': return i18n.t('home.gameModes.remote.description');
      case 'tournament': return i18n.t('home.gameModes.tournament.description');
      default: return i18n.t('common.chooseModeDescription');
    }
  }

  destroy(): void {
    console.log('🧹 Destroying GamePage and cleaning up active games');
    
    window.removeEventListener('resize', () => this.handleResize());
    window.removeEventListener('themeChanged', this.handleThemeChanged);
    
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }

    if (this.remotePong) {
      this.remotePong.destroy();
      this.remotePong = null;
    }

    if (this.beforeNavigateHandler) {
      window.removeEventListener('beforeNavigate', this.beforeNavigateHandler as EventListener);
      this.beforeNavigateHandler = null;
    }
  }
}