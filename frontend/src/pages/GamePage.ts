import { authService } from '@/services/authService.js';
import { i18n } from '@/services/i18nService.js';
import { Pong3D } from '@/components/game/Pong3D/Pong3D.js';
import type { GameSettings } from '@/components/game/Pong3D/Pong3D.js';

export class GamePage {
  private gameMode: 'local' | 'remote' | 'tournament' = 'local';
  private pong3D: Pong3D | null = null;

  constructor() {
    this.parseGameMode();
  }

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element);
    this.bindEvents();
  }

  private parseGameMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    this.gameMode = urlParams.get('mode') as 'local' | 'remote' | 'tournament' || 'local';
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
        <h3 class="text-xl mb-4">Choisissez votre mode de jeu</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button id="mode-local" class="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">Mode Local</h4>
            <p class="text-sm text-gray-300">Jouez à deux sur la même machine</p>
          </button>
          <button id="mode-remote" class="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">Mode En Ligne</h4>
            <p class="text-sm text-gray-300">Affrontez des joueurs du monde entier</p>
          </button>
          <button id="mode-tournament" class="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors">
            <h4 class="font-bold mb-2">Tournoi</h4>
            <p class="text-sm text-gray-300">Participez à un tournoi à 8 joueurs</p>
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
        <h3 class="text-xl mb-4">Paramètres - Mode Local</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block mb-2">Nom Joueur 1:</label>
            ${isAuthenticated && currentUser ? `
              <input type="text" id="player1-name-input" value="${currentUser.username}" 
                    readonly
                    class="bg-gray-600 rounded px-3 py-2 w-full cursor-not-allowed opacity-75 border border-blue-500/50">
              <div class="text-xs text-blue-400 mt-1">✓ Utilisateur connecté</div>
            ` : `
              <input type="text" id="player1-name-input" value="Joueur 1" 
                    class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
            `}
          </div>
          <div>
            <label class="block mb-2">Nom Joueur 2:</label>
            <input type="text" id="player2-name-input" value="Joueur 2" 
                  class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block mb-2">Vitesse de balle:</label>
            <select id="ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="slow">Lent</option>
              <option value="medium" selected>Moyen</option>
              <option value="fast">Rapide</option>
            </select>
          </div>
          <div>
            <label class="block mb-2">Points pour gagner:</label>
            <select id="win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="3">3 points</option>
              <option value="5" selected>5 points</option>
              <option value="10">10 points</option>
            </select>
          </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="start-local-game" 
                  class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1">
            Démarrer la Partie
          </button>
          <button id="back-to-modes" 
                  class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Changer de Mode
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
          <h3 class="text-xl mb-4 text-yellow-400">Connexion Requise</h3>
          <p class="text-gray-300 mb-6">Vous devez être connecté pour jouer en ligne</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '/login?redirect=/game?mode=remote' }))"
                    class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Se Connecter
            </button>
            <button id="back-to-modes" 
                    class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Changer de Mode
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-gray-800 rounded-lg p-6 text-center">
        <h3 class="text-xl mb-4">Mode En Ligne</h3>
        <div id="matchmaking-status">
          <div class="mb-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-300">Recherche d'un adversaire...</p>
          </div>
          <button id="cancel-matchmaking" 
                  class="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Annuler
          </button>
        </div>
      </div>
    `;
  }

  private renderTournamentSettings(): string {

    const isAuthenticated = authService.isAuthenticated();
    return `
      <div class="bg-gray-800 rounded-lg p-6 text-center">
        <h3 class="text-xl mb-4">Mode Tournoi</h3>
        <p class="text-gray-300 mb-6">Créez ou rejoignez un tournoi à 8 joueurs</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '${isAuthenticated
            ? '/tournament/create?participants=8&mode=authenticated'
            : '/tournament/create?participants=8&mode=guest'}' }))"
                  class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Créer un Tournoi
          </button>
          <button id="back-to-modes" 
                  class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            Changer de Mode
          </button>
        </div>
      </div>
    `;
  }

  private renderGameContainer(): string {
    return `
      <!-- Canvas Container -->
      <div class="relative w-full bg-gray-800 rounded-lg overflow-hidden" style="padding-bottom: 56.25%;">
        <canvas id="pong-3d-canvas" 
                class="absolute top-0 left-0 w-full h-full"
                style="background: linear-gradient(45deg, #1a1a2e, #16213e);">
        </canvas>
        
        <!-- Game Overlay -->
        ${this.renderGameOverlay()}
      </div>
      
      <!-- Game Controls -->
      ${this.renderGameControls()}
    `;
  }

  private renderGameOverlay(): string {
    return `
      <div id="game-overlay" class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div class="bg-black bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-500/30">
          <div id="player1-info" class="text-white">
            <div class="font-bold text-blue-400" id="player1-name">Joueur 1</div>
            <div class="text-3xl font-mono font-bold" id="player1-score">0</div>
          </div>
        </div>
        
        <div class="bg-black bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-500/30">
          <div id="game-timer" class="text-white text-center">
            <div class="text-sm opacity-75 uppercase tracking-wide">Temps</div>
            <div class="text-2xl font-mono font-bold">00:00</div>
          </div>
          <div class="text-xs text-center mt-1 text-gray-400">
            ${this.getGameModeTitle()}
          </div>
        </div>
        
        <div class="bg-black bg-opacity-60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-red-500/30">
          <div id="player2-info" class="text-white text-right">
            <div class="font-bold text-red-400" id="player2-name">Joueur 2</div>
            <div class="text-3xl font-mono font-bold" id="player2-score">0</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderGameControls(): string {
    return `
      <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Desktop Controls -->
        <div class="bg-gray-800 rounded-lg p-4 hidden md:block">
          <h4 class="text-lg mb-3">Contrôles Clavier</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Joueur 1:</strong> W/S ou ↑/↓</div>
            <div><strong>Joueur 2:</strong> I/K</div>
          </div>
          <div class="mt-2 text-xs text-gray-400">
            Appuyez sur ESPACE pour pause
          </div>
        </div>
        
        <!-- Game Status -->
        <div class="bg-gray-800 rounded-lg p-4">
          <h4 class="text-lg mb-3">Status</h4>
          <div id="game-status" class="text-green-400 text-sm">
            Prêt à jouer
          </div>
          <div class="mt-2">
            <button id="pause-game" 
                    class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm">
              ⏸️ Pause
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Touch Controls -->
      <div id="mobile-controls" class="mt-4 md:hidden">
        ${this.renderMobileControls()}
      </div>
    `;
  }

  private renderMobileControls(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-4">
        <h4 class="text-lg mb-3 text-center">Contrôles Tactiles</h4>
        <div class="flex justify-between items-center">
          <div class="text-center">
            <div class="text-xs mb-2 text-blue-300 font-semibold">Joueur 1</div>
            <div class="flex flex-col gap-3">
              <button id="p1-up" class="bg-blue-600 text-white p-4 rounded-xl touch-manipulation" 
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p1-down" class="bg-blue-600 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
          
          <div class="text-center px-4 flex-1">
            <div class="text-xs text-gray-400 mb-2">Maintenez pour bouger</div>
          </div>
          
          <div class="text-center">
            <div class="text-xs mb-2 text-red-300 font-semibold">Joueur 2</div>
            <div class="flex flex-col gap-3">
              <button id="p2-up" class="bg-red-600 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p2-down" class="bg-red-600 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
        </div>
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

    // Pause game
    document.getElementById('pause-game')?.addEventListener('click', () => this.togglePause());

    // Mobile controls
    this.setupMobileControls();

    // Responsive resize
    window.addEventListener('resize', () => this.handleResize());
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
    this.gameMode = null as any;
    
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.toString());
    
    const element = document.querySelector('#page-content');
    if (element) this.render(element);
    this.bindEvents();
  }

  private startLocalGame(): void {
    console.log('🎮 Starting local game...');
    
    // Hide settings, show game
    const settings = document.getElementById('game-settings');
    const container = document.getElementById('game-container');
    
    if (settings && container) {
      settings.classList.add('hidden');
      container.classList.remove('hidden');
      
      // Get game settings
      const gameSettings = this.getGameSettings();
      
      // Initialize Pong3D
      this.initPong3D(gameSettings);
    }
  }

  private initPong3D(settings: GameSettings): void {
    try {
      this.pong3D = new Pong3D('pong-3d-canvas', settings, this.gameMode === 'remote');
      
      setTimeout(() => {
        if (this.pong3D) {
          this.pong3D.startGame();
        }
        
        // Update player names in overlay
        const p1Name = document.getElementById('player1-name');
        const p2Name = document.getElementById('player2-name');
        if (p1Name) p1Name.textContent = settings.player1Name;
        if (p2Name) p2Name.textContent = settings.player2Name;
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to initialize Pong3D:', error);
      
      const statusEl = document.getElementById('game-status');
      if (statusEl) {
        statusEl.textContent = 'Erreur lors de l\'initialisation du jeu 3D';
        statusEl.className = 'text-red-400 text-sm';
      }
    }
  }

  private getGameSettings(): GameSettings {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    // Si l'utilisateur est connecté, utiliser son username pour le joueur 1
    const player1Name = isAuthenticated && currentUser 
      ? currentUser.username 
      : (document.getElementById('player1-name-input') as HTMLInputElement)?.value || 'Joueur 1';
    
    return {
      player1Name,
      player2Name: (document.getElementById('player2-name-input') as HTMLInputElement)?.value || 'Joueur 2',
      ballSpeed: (document.getElementById('ball-speed') as HTMLSelectElement)?.value as 'slow' | 'medium' | 'fast' || 'medium',
      winScore: parseInt((document.getElementById('win-score') as HTMLSelectElement)?.value || '5'),
      enableEffects: false // Pour l'instant, désactivés
    };
  }

  private togglePause(): void {
    if (this.pong3D) {
      const currentStatus = this.pong3D.getGameStatus();
      
      if (currentStatus === 'playing') {
        this.pong3D.togglePause();
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
          pauseBtn.innerHTML = '▶️ Reprendre';
          pauseBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm';
        }
      } else if (currentStatus === 'paused') {
        this.pong3D.togglePause();
        const pauseBtn = document.getElementById('pause-game');
        if (pauseBtn) {
          pauseBtn.innerHTML = '⏸️ Pause';
          pauseBtn.className = 'bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm';
        }
      }
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
    if (this.pong3D) {
      const isUp = controlId.includes('up');
      const player = controlId.includes('p1') ? 'player1' : 'player2';
      this.pong3D.handleMobileInput(player, isUp ? 'up' : 'down', true);
    }
  }

  private handleMobileControlEnd(controlId: string): void {
    if (this.pong3D) {
      const isUp = controlId.includes('up');
      const player = controlId.includes('p1') ? 'player1' : 'player2';
      this.pong3D.handleMobileInput(player, isUp ? 'up' : 'down', false);
    }
  }

  private handleResize(): void {
    if (this.pong3D) {
      this.pong3D.handleResize();
    }
  }

  private getGameModeTitle(): string {
    switch (this.gameMode) {
      case 'local': return 'Mode Local';
      case 'remote': return 'Mode En Ligne';
      case 'tournament': return 'Mode Tournoi';
      default: return 'Sélection du Mode';
    }
  }

  private getGameModeDescription(): string {
    switch (this.gameMode) {
      case 'local': return 'Affrontez-vous à deux sur la même machine';
      case 'remote': return 'Défiez des joueurs du monde entier';
      case 'tournament': return 'Participez à un tournoi épique';
      default: return 'Choisissez votre mode de jeu préféré';
    }
  }

  destroy(): void {
    window.removeEventListener('resize', () => this.handleResize());
    
    if (this.pong3D) {
      this.pong3D.destroy();
      this.pong3D = null;
    }
  }
}