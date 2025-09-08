import { authService } from '@/services/authService.js';
import { i18n } from '@/services/i18nService.js';
import { GameManager, GameManagerConfig } from '@/components/game/GameManager';
import { matchService } from '@/services/matchService';
import type { GameSettings } from '@/components/game/Pong3D/Pong3D.js';

export class GamePage {
  private gameMode: 'local' | 'remote' | 'tournament' | null = null;
  private gameManager: GameManager | null = null;
  private isLandscape: boolean = false;

  constructor() {
    this.parseGameMode();
    // Gestion de l'orientation
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.addEventListener('resize', this.handleOrientationChange);
  }

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element);
    this.bindEvents();
  }

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
    return `
      <div class="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 class="text-xl mb-4">${i18n.t('home.gameModes.title')}</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button id="mode-local" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">${i18n.t('home.gameModes.local.title')}</h4>
            <p class="text-sm text-gray-300">${i18n.t('home.gameModes.local.description')}</p>
          </button>
          <button id="mode-remote" class="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">${i18n.t('home.gameModes.remote.title')}</h4>
            <p class="text-sm text-gray-300">${i18n.t('home.gameModes.remote.description')}</p>
          </button>
          <button id="mode-tournament" class="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">${i18n.t('home.gameModes.tournament.title')}</h4>
            <p class="text-sm text-gray-300">${i18n.t('home.gameModes.tournament.description')}</p>
          </button>
        </div>
      </div>
    `;
  }

  private renderGameSettings(): string {
    switch (this.gameMode) {
      case 'local':
        return this.renderLocalSettings();
      case 'remote':
        return this.renderRemoteSettings();
      case 'tournament':
        return this.renderTournamentSettings();
      default:
        return '';
    }
  }

  private renderLocalSettings(): string {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl mb-4">${i18n.t('game.customization.title')} - ${i18n.t('game.modes.local')}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block mb-2">${i18n.t('forms.placeholders.username')} 1:</label>
            ${isAuthenticated && currentUser ? `
              <input type="text" id="player1-name-input" value="${currentUser.username}" 
                    readonly
                    class="bg-gray-600 rounded px-3 py-2 w-full cursor-not-allowed opacity-75 border border-blue-500/50">
              <div class="text-xs text-blue-400 mt-1">✓ ${i18n.t('auth.login.username')}</div>
            ` : `
              <input type="text" id="player1-name-input" value="${i18n.t('game.placeholder.player')} 1" 
                    class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
            `}
          </div>
          <div>
            <label class="block mb-2">${i18n.t('forms.placeholders.username')} 2:</label>
            <input type="text" id="player2-name-input" value="${i18n.t('game.placeholder.player')} 2" 
                  class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2">${i18n.t('game.customization.ballSpeed')}:</label>
            <select id="ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="slow">${i18n.t('common.slow')}</option>
              <option value="medium" selected>${i18n.t('common.medium')}</option>
              <option value="fast">${i18n.t('common.fast')}</option>
            </select>
          </div>
          <div>
            <label class="block mb-2">${i18n.t('common.score')} ${i18n.t('common.toWin')}:</label>
            <select id="win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="3">3 ${i18n.t('common.points')}</option>
              <option value="5" selected>5 ${i18n.t('common.points')}</option>
              <option value="10">10 ${i18n.t('common.points')}</option>
            </select>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="start-local-game" 
                  class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1">
            ${i18n.t('game.lobby.startGame')}
          </button>
          <button id="back-to-modes" 
                  class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.changeMode')}
          </button>
        </div>
      </div>
    `;
  }

  private renderRemoteSettings(): string {
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      return `
        <div class="bg-gray-800 rounded-lg p-6 text-center">
          <h3 class="text-xl mb-4 text-yellow-400">${i18n.t('home.gameModes.remote.loginRequired')}</h3>
          <p class="text-gray-300 mb-6">${i18n.t('auth.errors.loginRequired')}</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '/login?redirect=/game?mode=remote' }))"
                    class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
              ${i18n.t('auth.login.loginButton')}
            </button>
            <button id="back-to-modes" 
                    class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              ${i18n.t('common.changeMode')}
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-gray-800 rounded-lg p-6 text-center">
        <h3 class="text-xl mb-4">${i18n.t('game.modes.remote')}</h3>
        <div id="matchmaking-status">
          <div class="mb-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-300">${i18n.t('game.lobby.waitingForPlayer')}</p>
          </div>
          <button id="cancel-matchmaking" 
                  class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.cancel')}
          </button>
        </div>
      </div>
    `;
  }

  private renderTournamentSettings(): string {
    const isAuthenticated = authService.isAuthenticated();
    return `
      <div class="bg-gray-800 rounded-lg p-6 text-center">
        <h3 class="text-xl mb-4">${i18n.t('game.modes.tournament')}</h3>
        <p class="text-gray-300 mb-6">${i18n.t('home.gameModes.tournament.description')}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '${isAuthenticated
            ? '/tournament/create?participants=8&mode=authenticated'
            : '/tournament/create?participants=8&mode=guest'}' }))"
                  class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('tournament.create.title')}
          </button>
          <button id="back-to-modes" 
                  class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.changeMode')}
          </button>
        </div>
      </div>
    `;
  }



  private renderGameContainer(): string {
    return `
      <!-- Header du jeu -->
      <div class="bg-gray-800/50 backdrop-blur-sm rounded-t-lg p-3 md:p-4 flex justify-between items-center border-b border-gray-700/50">
        <h2 class="text-lg md:text-xl font-bold">${this.getGameModeTitle()}</h2>
        <div class="flex gap-2 md:gap-3">
          <button id="pause-game" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors">
            ⏸️ <span class="hidden sm:inline">${i18n.t('common.pause')}</span>
          </button>
          <button id="quit-game" class="bg-red-600 hover:bg-red-700 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors">
            <span class="hidden sm:inline">${i18n.t('game.lobby.leaveGame')}</span><span class="sm:hidden">✕</span>
          </button>
        </div>
      </div>

      <!-- Zone de jeu responsive -->
      <div class="relative bg-gray-800 rounded-b-lg overflow-hidden orientation-transition">
        <!-- Canvas Container avec aspect ratio préservé -->
        <div id="canvas-container" class="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
          <canvas id="game-canvas" 
                  class="absolute top-0 left-0 w-full h-full orientation-transition"
                  style="background: linear-gradient(45deg, #1a1a2e, #16213e); border-radius: 0 0 0.5rem 0.5rem;">
            ${i18n.t('common.canvasNotSupported')}
          </canvas>
          
          <!-- Game Overlay responsive -->
          ${this.renderGameOverlay()}
        </div>
        
        <!-- Game Controls -->
        ${this.renderGameControls()}
      </div>
    `;
  }

  private renderMobileControls(): string {
    return `
      <div class="bg-gray-700/50 rounded-lg p-4 orientation-transition">
        <h4 class="text-lg mb-3 text-center hidden-landscape">${i18n.t('game.controls.touch')}</h4>
        <div class="flex justify-between items-center">
          <div class="text-center player-controls">
            <div class="text-xs mb-2 text-blue-300 font-semibold hidden-landscape">${i18n.t('game.score.you')} 1</div>
            <div class="flex gap-3 landscape:flex-row portrait:flex-col">
              <button id="p1-up" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation orientation-transition" 
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p1-down" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation orientation-transition"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
          
          <div class="text-center px-4 flex-1 hidden-landscape">
            <div class="text-xs text-gray-400 mb-2">${i18n.t('game.controls.instructions')}</div>
          </div>
          
          <div class="text-center player-controls">
            <div class="text-xs mb-2 text-red-300 font-semibold hidden-landscape">${i18n.t('game.score.you')} 2</div>
            <div class="flex gap-3 landscape:flex-row portrait:flex-col">
              <button id="p2-up" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation orientation-transition"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p2-down" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation orientation-transition"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderGameOverlay(): string {
    return `
      <div id="game-overlay" class="absolute inset-0 pointer-events-none orientation-transition">
        <!-- Overlay responsive pour les scores -->
        <div class="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex justify-between items-start">
          <!-- Score Joueur 1 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-blue-500/30 min-w-0 flex-shrink-0">
            <div id="player1-info" class="text-white">
              <div class="font-bold text-blue-400 text-xs md:text-sm truncate" id="player1-name">${i18n.t('game.score.you')} 1</div>
              <div class="text-xl md:text-3xl score-display font-mono font-bold" id="player1-score">0</div>
            </div>
          </div>
          
          <!-- Timer central -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-gray-500/30 mx-2 min-w-0 flex-shrink-0">
            <div id="game-timer" class="text-white text-center">
              <div class="text-xs md:text-sm opacity-75 uppercase tracking-wide hidden-landscape">${i18n.t('common.time')}</div>
              <div class="text-lg md:text-2xl font-mono font-bold">00:00</div>
            </div>
            <div class="text-xs text-center mt-1 text-gray-400 hidden md:block hidden-landscape">
              ${this.getGameModeTitle()}
            </div>
          </div>
          
          <!-- Score Joueur 2 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-red-500/30 min-w-0 flex-shrink-0">
            <div id="player2-info" class="text-white text-right">
              <div class="font-bold text-red-400 text-xs md:text-sm truncate" id="player2-name">${i18n.t('game.score.you')} 2</div>
              <div class="text-xl md:text-3xl score-display font-mono font-bold" id="player2-score">0</div>
            </div>
          </div>
        </div>
        
        <!-- Status mobile en bas (visible uniquement en portrait) -->
        <div class="absolute bottom-2 left-2 right-2 md:hidden hidden-landscape">
          <div class="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-500/30">
            <div id="game-status-mobile" class="text-green-400 text-xs">
              ${i18n.t('game.status.waiting')}...
            </div>
            <div class="text-xs text-gray-400 mt-1">
              ${this.getGameModeTitle()}
            </div>
          </div>
        </div>
      </div>
    `;
  }


  private renderGameControls(): string {
    return `
      <div class="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 landscape-hidden">
        <!-- Desktop Controls -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:p-4 hidden md:block">
          <h4 class="text-base md:text-lg mb-3">${i18n.t('game.controls.title')}</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>${i18n.t('game.score.you')} 1:</strong> W/S ${i18n.t('common.or')} ↑/↓</div>
            <div><strong>${i18n.t('game.score.you')} 2:</strong> I/K</div>
          </div>
          <div class="mt-2 text-xs text-gray-400">
            ${i18n.t('game.controls.pause')}
          </div>
        </div>
        
        <!-- Game Status (visible sur desktop) -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:p-4 hidden md:block">
          <h4 class="text-base md:text-lg mb-3">${i18n.t('common.status')}</h4>
          <div id="game-status" class="text-green-400 text-sm">
            ${i18n.t('game.status.waiting')}...
          </div>
          <div id="game-scores" class="text-lg mt-2">0 - 0</div>
          <div id="game-timer-display" class="text-sm text-gray-300 mt-1">00:00</div>
        </div>

        <!-- Mobile Game Info (visible sur mobile portrait uniquement) -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:hidden hidden-landscape">
          <h4 class="text-base mb-2">${i18n.t('common.gameInfo')}</h4>
          <div class="flex justify-between items-center text-sm">
            <div id="game-scores-mobile" class="font-mono">0 - 0</div>
            <div id="game-timer-mobile" class="text-gray-300">00:00</div>
          </div>
        </div>
      </div>

      <!-- Mobile Touch Controls -->
      <div id="mobile-controls" class="p-3 md:hidden">
        ${this.renderMobileControls()}
      </div>
    `;
  }


  private bindEvents(): void {
    // Mode selection
    document.getElementById('mode-local')?.addEventListener('click', () => this.selectMode('local'));
    document.getElementById('mode-remote')?.addEventListener('click', () => this.selectMode('remote'));
    document.getElementById('mode-tournament')?.addEventListener('click', () => this.selectMode('tournament'));

    // Back to modes
    document.querySelectorAll('#back-to-modes').forEach(btn => {
      btn.addEventListener('click', () => this.showModeSelection());
    });

    // Start local game
    document.getElementById('start-local-game')?.addEventListener('click', () => this.startLocalGame());

    // Game interface controls
    this.bindGameInterfaceEvents();

    // Mobile controls
    this.setupMobileControls();

    // Responsive resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private bindGameInterfaceEvents(): void {
    const pauseBtn = document.getElementById('pause-game');
    const quitBtn = document.getElementById('quit-game');

    pauseBtn?.addEventListener('click', () => {
      if (this.gameManager) {
        this.gameManager.pauseGame();
        this.updatePauseButton();
      }
    });

    quitBtn?.addEventListener('click', () => {
      if (confirm(i18n.t('common.confirmQuitGame'))) {
        this.quitGame();
      }
    });
  }

  private updatePauseButton(): void {
    const pauseBtn = document.getElementById('pause-game');
    if (!pauseBtn || !this.gameManager) return;

    const status = this.gameManager.getGameStatus();
    
    if (status === 'playing') {
      pauseBtn.innerHTML = `⏸️ ${i18n.t('common.pause')}`;
      pauseBtn.className = 'bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-colors';
    } else if (status === 'paused') {
      pauseBtn.innerHTML = `▶️ ${i18n.t('common.resume')}`;
      pauseBtn.className = 'bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors';
    }
  }

  private selectMode(mode: 'local' | 'remote' | 'tournament'): void {
    this.gameMode = mode;
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url.toString());
    
    // Re-render
    const element = document.querySelector('#page-content');
    if (element) this.render(element);
    this.bindEvents();
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
      
      // Récupérer les paramètres de jeu
      const gameSettings = this.getGameSettings();
      
      // Configuration du GameManager pour le mode local
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
          // ✅ En mode local, on laisse Pong3D gérer le modal
          // Ici on gère seulement la sauvegarde des données
          await this.handleGameEnd(winner, scores, duration, gameSettings);
        }
      };

      // Créer le gestionnaire de jeu
      this.gameManager = new GameManager(gameConfig);
      
      // Afficher l'interface de jeu
      this.showGameInterface();
      
      // Démarrer le jeu
      await this.gameManager.startGame();

    } catch (error) {
      console.error('❌ Failed to start local game:', error);
      this.showError(i18n.t('common.error'));
    }
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
    // Mettre à jour les noms des joueurs
    const p1Name = document.getElementById('player1-name');
    const p2Name = document.getElementById('player2-name');
    if (p1Name) p1Name.textContent = settings.player1Name;
    if (p2Name) p2Name.textContent = settings.player2Name;

    // Mettre à jour le statut
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
      statusEl.textContent = i18n.t('game.status.playing');
      statusEl.className = 'text-green-400 text-sm';
    }
  }

  private async handleGameEnd(winner: string, scores: any, duration: number, settings: GameSettings): Promise<void> {
    try {
      // Envoyer les données du match au backend si utilisateur connecté
      if (authService.isAuthenticated()) {
        await matchService.sendLocalMatchData(
          settings.player1Name,
          settings.player2Name,
          scores.player1,
          scores.player2,
          Math.floor(duration)
        );
        console.log('✅ Match data saved to backend');
      }

    } catch (error) {
      console.error('❌ Failed to save match data:', error);
    }
  }

  private getGameSettings(): GameSettings {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    // Si l'utilisateur est connecté, utiliser son username pour le joueur 1
    const player1Name = isAuthenticated && currentUser 
      ? currentUser.username 
      : (document.getElementById('player1-name-input') as HTMLInputElement)?.value || i18n.t('game.score.you') + ' 1';
    
    return {
      player1Name,
      player2Name: (document.getElementById('player2-name-input') as HTMLInputElement)?.value || i18n.t('game.score.you') + ' 2',
      ballSpeed: (document.getElementById('ball-speed') as HTMLSelectElement)?.value as 'slow' | 'medium' | 'fast' || 'medium',
      winScore: parseInt((document.getElementById('win-score') as HTMLSelectElement)?.value || '5'),
      enableEffects: false // Pour l'instant, désactivés
    };
  }

  private quitGame(): void {
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }
    
    // Retourner à la sélection des paramètres
    const settings = document.getElementById('game-settings');
    const container = document.getElementById('game-container');
    
    if (settings && container) {
      container.classList.add('hidden');
      settings.classList.remove('hidden');
    }
  }

  private showError(message: string): void {
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'text-red-400 text-sm';
    }
  }

  private setupMobileControls(): void {
    const controls = ['p1-up', 'p1-down', 'p2-up', 'p2-down'];
    
    controls.forEach(controlId => {
      const btn = document.getElementById(controlId);
      if (btn) {
        // Touch events
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleMobileControlStart(controlId);
        });
        
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleMobileControlEnd(controlId);
        });

        // Mouse events for desktop testing
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.handleMobileControlStart(controlId);
        });

        btn.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.handleMobileControlEnd(controlId);
        });
      }
    });
  }

  private handleMobileControlStart(controlId: string): void {
    if (this.gameManager) {
      const isUp = controlId.includes('up');
      const player = controlId.includes('p1') ? 'player1' : 'player2';
      this.gameManager.handleMobileInput(player, isUp ? 'up' : 'down', true);
    }
  }

  private handleMobileControlEnd(controlId: string): void {
    if (this.gameManager) {
      const isUp = controlId.includes('up');
      const player = controlId.includes('p1') ? 'player1' : 'player2';
      this.gameManager.handleMobileInput(player, isUp ? 'up' : 'down', false);
    }
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


  //Gestion de l'orientation

  private handleOrientationChange(): void {
    setTimeout(() => {
      const wasLandscape = this.isLandscape;
      this.isLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 768;
      
      if (wasLandscape !== this.isLandscape && this.gameManager) {
        this.updateGameInterfaceForOrientation();
      }
    }, 100); // Délai pour que l'orientation soit appliquée
  }

  private updateGameInterfaceForOrientation(): void {
    const gameContainer = document.getElementById('game-container');
    const mobileControls = document.getElementById('mobile-controls');
    const gameOverlay = document.getElementById('game-overlay');
    const canvasContainer = document.getElementById('canvas-container');
    
    if (this.isLandscape) {
      // Mode paysage
      gameContainer?.classList.add('landscape-game-interface');
      mobileControls?.classList.add('landscape-mobile-controls');
      gameOverlay?.classList.add('landscape-game-overlay');
      canvasContainer?.classList.add('landscape-game-canvas');
      
      // Masquer certains éléments en paysage
      const hiddenElements = document.querySelectorAll('.hidden-landscape');
      hiddenElements.forEach(el => el.classList.add('hidden'));
    } else {
      // Mode portrait
      gameContainer?.classList.remove('landscape-game-interface');
      mobileControls?.classList.remove('landscape-mobile-controls');
      gameOverlay?.classList.remove('landscape-game-overlay');
      canvasContainer?.classList.remove('landscape-game-canvas');
      
      // Réafficher les éléments
      const hiddenElements = document.querySelectorAll('.hidden-landscape');
      hiddenElements.forEach(el => el.classList.remove('hidden'));
    }
    
    // Redimensionner le jeu
    if (this.gameManager) {
      this.gameManager.handleResize();
    }
  }

  destroy(): void {
    window.removeEventListener('resize', () => this.handleResize());
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    window.removeEventListener('resize', this.handleOrientationChange);
    
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }
  }
}