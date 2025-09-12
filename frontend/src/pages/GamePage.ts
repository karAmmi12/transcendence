import { authService } from '@/services/authService.js';
import { userService } from '@/services/userService.js'; // ✅ Ajouter l'import
import { i18n } from '@/services/i18nService.js';
import { GameManager, GameManagerConfig } from '@/components/game/GameManager';
import { matchService } from '@/services/matchService';
import type { GameSettings } from '@/components/game/Pong3D/Pong3D.js';
import { RemotePong } from '@/components/game/RemotePong.js';

export class GamePage {
  private gameMode: 'local' | 'remote' | 'tournament' | null = null;
  private gameManager: GameManager | null = null;
  private remotePong: RemotePong | null = null;
  private settings: GameSettings | null = null;
  private userPreferredTheme: string | null = null;

  private beforeNavigateHandler: ((event: CustomEvent) => void) | null = null;

  constructor() {
    this.parseGameMode();
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
    // Vérifier si on a une instance RemotePong active
    return this.remotePong !== null;
  }

  /**
   * ✅ Charger le thème préféré de l'utilisateur connecté
   */
  private async loadUserPreferredTheme(): Promise<void> {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        // ✅ Récupérer directement depuis l'utilisateur actuel
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

  // private renderLocalSettings(): string {
  //   const isAuthenticated = authService.isAuthenticated();
  //   const currentUser = authService.getCurrentUser();
    
  //   return `
  //     <div class="bg-gray-800 rounded-lg p-6">
  //       <h3 class="text-xl mb-4">${i18n.t('game.customization.title')} - ${i18n.t('game.modes.local')}</h3>
  //       <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  //         <div>
  //           <label class="block mb-2">${i18n.t('forms.placeholders.username')} 1:</label>
  //           ${isAuthenticated && currentUser ? `
  //             <input type="text" id="player1-name-input" value="${currentUser.username}" 
  //                   readonly
  //                   class="bg-gray-600 rounded px-3 py-2 w-full cursor-not-allowed opacity-75 border border-blue-500/50">
  //             <div class="text-xs text-blue-400 mt-1">✓ ${i18n.t('auth.login.username')}</div>
  //           ` : `
  //             <input type="text" id="player1-name-input" value="${i18n.t('game.placeholder.player')} 1" 
  //                   class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
  //           `}
  //         </div>
  //         <div>
  //           <label class="block mb-2">${i18n.t('forms.placeholders.username')} 2:</label>
  //           <input type="text" id="player2-name-input" value="${i18n.t('game.placeholder.player')} 2" 
  //                 class="bg-gray-700 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500">
  //         </div>
  //         <div>
  //           <label class="block mb-2">${i18n.t('game.customization.ballSpeed')}:</label>
  //           <select id="ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
  //             <option value="slow">${i18n.t('common.slow')}</option>
  //             <option value="medium" selected>${i18n.t('common.medium')}</option>
  //             <option value="fast">${i18n.t('common.fast')}</option>
  //           </select>
  //         </div>
  //         <div>
  //           <label class="block mb-2">${i18n.t('common.score')} ${i18n.t('common.toWin')}:</label>
  //           <select id="win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
  //             <option value="3">3 ${i18n.t('common.points')}</option>
  //             <option value="5" selected>5 ${i18n.t('common.points')}</option>
  //             <option value="10">10 ${i18n.t('common.points')}</option>
  //           </select>
  //         </div>
  //       </div>
        
  //       <div class="flex flex-col sm:flex-row gap-3">
  //         <button id="start-local-game" 
  //                 class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1">
  //           ${i18n.t('game.lobby.startGame')}
  //         </button>
  //         <button id="back-to-modes" 
  //                 class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
  //           ${i18n.t('common.changeMode')}
  //         </button>
  //       </div>
  //     </div>
  //   `;
  // }

   private renderLocalSettings(): string {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    const defaultTheme = this.userPreferredTheme || 'classic'; // ✅ Utiliser le thème préféré

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
          <div>
            <label class="block mb-2">${i18n.t('game.customization.theme')}:</label>
            <select id="game-theme" class="bg-gray-700 rounded px-3 py-2 w-full" ${isAuthenticated && this.userPreferredTheme ? 'disabled' : ''}>
              <option value="classic" ${defaultTheme === 'classic' ? 'selected' : ''}>${i18n.t('game.themes.classic')}</option>
              <option value="neon" ${defaultTheme === 'neon' ? 'selected' : ''}>${i18n.t('game.themes.neon')}</option>
              <option value="retro" ${defaultTheme === 'retro' ? 'selected' : ''}>${i18n.t('game.themes.retro')}</option>
              <option value="cyberpunk" ${defaultTheme === 'cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
              <option value="space" ${defaultTheme === 'space' ? 'selected' : ''}>Space</option>
              <option value="italian" ${defaultTheme === 'italian' ? 'selected' : ''}>${i18n.t('game.themes.italian')}</option>
              <option value="matrix" ${defaultTheme === 'matrix' ? 'selected' : ''}>${i18n.t('game.themes.matrix')}</option>
              <option value="lava" ${defaultTheme === 'lava' ? 'selected' : ''}>${i18n.t('game.themes.lava')}</option>
            </select>
            ${isAuthenticated && this.userPreferredTheme ? `
              <div class="text-xs text-blue-400 mt-1 flex items-center justify-between">
                <span>🎨 ${i18n.t('game.customization.userTheme')}: ${this.getThemeName(this.userPreferredTheme)}</span>
                <button id="change-theme-profile" class="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded">
                  ${i18n.t('game.customization.changeInProfile')}
                </button>
              </div>
            ` : `
              <div class="text-xs text-gray-400 mt-1">
                ${i18n.t('game.customization.guestTheme')}
              </div>
            `}
          </div>
          <div>
            <label class="block mb-2">${i18n.t('game.customization.powerUps')}:</label>
            <div class="flex items-center">
              <input type="checkbox" id="enable-powerups" class="mr-2" ${this.settings?.powerUps ? 'checked' : ''}>
              <label for="enable-powerups" class="text-sm">${i18n.t('game.customization.powerUps')}</label>
            </div>
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

  private renderRemoteSettings(): string 
  {
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

    // ✅ Vérifier s'il y a une interruption de jeu en cours
    const wasInGame = sessionStorage.getItem('remote_game_active');
    console.log('🔍 renderRemoteSettings - Checking sessionStorage:', { 
      wasInGame, 
      sessionItems: {
        remote_game_active: sessionStorage.getItem('remote_game_active'),
        remote_game_data: sessionStorage.getItem('remote_game_data')
      }
    });
    
    if (wasInGame === 'true') {
      console.log('🚫 GamePage detected game interruption - showing forfeit modal instead of matchmaking interface');
      return `
        <div class="bg-gray-800 rounded-lg p-6 text-center">
          <h3 class="text-xl mb-4 text-red-400">Défaite par déconnexion</h3>
          <div class="mb-6">
            <div class="text-6xl mb-4">😔</div>
            <p class="text-lg text-gray-300 mb-2">Vous avez quitté la partie</p>
            <p class="text-sm text-gray-400">Votre adversaire remporte la victoire par forfait</p>
          </div>
          <button id="back-to-menu-from-forfeit"
                  class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.backToMenu')}
          </button>
        </div>
      `;
    }

    const currentUser = authService.getCurrentUser();
    const defaultTheme = this.userPreferredTheme || 'classic';

    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl mb-4">${i18n.t('game.customization.title')} - ${i18n.t('game.modes.remote')}</h3>

        <!-- Informations utilisateur -->
        <div class="mb-6 p-4 bg-gray-700/50 rounded-lg border border-blue-500/30">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-white font-medium">${i18n.t('game.remote.yourProfile')}</h4>
              <p class="text-blue-400">${currentUser?.username}</p>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-400">${i18n.t('game.customization.theme')}</div>
              <div class="text-purple-300">🎨 ${this.getThemeName(defaultTheme)}</div>
            </div>
          </div>
        </div>

        <!-- Paramètres de matchmaking -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block mb-2">${i18n.t('game.customization.ballSpeed')}:</label>
            <select id="remote-ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="slow">${i18n.t('common.slow')}</option>
              <option value="medium" selected>${i18n.t('common.medium')}</option>
              <option value="fast">${i18n.t('common.fast')}</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">${i18n.t('game.remote.speedNote')}</p>
          </div>

          <div>
            <label class="block mb-2">${i18n.t('common.score')} ${i18n.t('common.toWin')}:</label>
            <select id="remote-win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="3">3 ${i18n.t('common.points')}</option>
              <option value="5" selected>5 ${i18n.t('common.points')}</option>
              <option value="10">10 ${i18n.t('common.points')}</option>
            </select>
          </div>

          <div>
            <label class="block mb-2">${i18n.t('game.customization.powerUps')}:</label>
            <div class="flex items-center">
              <input type="checkbox" id="remote-enable-powerups" class="mr-2">
              <label for="remote-enable-powerups" class="text-sm">${i18n.t('game.customization.enablePowerUps')}</label>
            </div>
            <p class="text-xs text-gray-400 mt-1">${i18n.t('game.remote.powerUpsNote')}</p>
          </div>

          
        </div>

        <!-- Informations de thème (lecture seule) -->
        <div class="mb-6 p-3 bg-gray-700/50 rounded-lg border border-purple-500/30">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm text-gray-300">${i18n.t('game.customization.willUseTheme')}:</span>
              <span class="text-purple-300 font-medium ml-2">${this.getThemeName(defaultTheme)}</span>
            </div>
            <button id="change-theme-profile-remote" class="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded">
              ${i18n.t('game.customization.changeInProfile')}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="start-remote-game" 
                  class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1">
            ${i18n.t('game.remote.findOpponent')}
          </button>
          <button id="back-to-modes" 
                  class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.changeMode')}
          </button>
        </div>
      </div>
    `;
  }

  private renderTournamentSettings(): string 
  {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    const defaultTheme = this.userPreferredTheme || 'classic';

    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl mb-4">${i18n.t('game.customization.title')} - ${i18n.t('game.modes.tournament')}</h3>

        <!-- Informations participant -->
        ${isAuthenticated && currentUser ? `
          <div class="mb-6 p-4 bg-gray-700/50 rounded-lg border border-purple-500/30">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-white font-medium">${i18n.t('tournament.yourParticipation')}</h4>
                <p class="text-purple-400">${currentUser.username} (${i18n.t('tournament.authenticatedPlayer')})</p>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400">${i18n.t('game.customization.theme')}</div>
                <div class="text-purple-300">🎨 ${this.getThemeName(defaultTheme)}</div>
              </div>
            </div>
          </div>
        ` : `
          <div class="mb-6 p-4 bg-gray-700/50 rounded-lg border border-yellow-500/30">
            <div class="text-center">
              <h4 class="text-white font-medium mb-2">${i18n.t('tournament.guestMode')}</h4>
              <p class="text-yellow-400 text-sm">${i18n.t('tournament.guestModeDescription')}</p>
            </div>
          </div>
        `}

        <!-- Paramètres du tournoi -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block mb-2">${i18n.t('tournament.participants')}:</label>
            <select id="tournament-participants" class="bg-gray-700 rounded px-3 py-2 w-full" disabled>
              <option value="8" selected>8 ${i18n.t('tournament.participantsCount')}</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">${i18n.t('tournament.participantsNote')}</p>
          </div>

          <div>
            <label class="block mb-2">${i18n.t('game.customization.ballSpeed')}:</label>
            <select id="tournament-ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="slow">${i18n.t('common.slow')}</option>
              <option value="medium" selected>${i18n.t('common.medium')}</option>
              <option value="fast">${i18n.t('common.fast')}</option>
            </select>
          </div>

          <div>
            <label class="block mb-2">${i18n.t('common.score')} ${i18n.t('common.toWin')}:</label>
            <select id="tournament-win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="3">3 ${i18n.t('common.points')}</option>
              <option value="5" selected>5 ${i18n.t('common.points')}</option>
              <option value="7">7 ${i18n.t('common.points')}</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">${i18n.t('tournament.winScoreNote')}</p>
          </div>

          <div>
            <label class="block mb-2">${i18n.t('game.customization.powerUps')}:</label>
            <div class="flex items-center">
              <input type="checkbox" id="tournament-enable-powerups" class="mr-2">
              <label for="tournament-enable-powerups" class="text-sm">${i18n.t('game.customization.enablePowerUps')}</label>
            </div>
            <p class="text-xs text-gray-400 mt-1">${i18n.t('tournament.powerUpsNote')}</p>
          </div>
        </div>

        <!-- Thème (lecture seule pour utilisateurs connectés) -->
        ${isAuthenticated && this.userPreferredTheme ? `
          <div class="mb-6 p-3 bg-gray-700/50 rounded-lg border border-purple-500/30">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm text-gray-300">${i18n.t('game.customization.tournamentTheme')}:</span>
                <span class="text-purple-300 font-medium ml-2">${this.getThemeName(defaultTheme)}</span>
              </div>
              <button id="change-theme-profile-tournament" class="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded">
                ${i18n.t('game.customization.changeInProfile')}
              </button>
            </div>
          </div>
        ` : `
          <div class="mb-6">
            <label class="block mb-2">${i18n.t('game.customization.theme')}:</label>
            <select id="tournament-theme" class="bg-gray-700 rounded px-3 py-2 w-full">
              <option value="classic" selected>${i18n.t('game.themes.classic')}</option>
              <option value="neon">${i18n.t('game.themes.neon')}</option>
              <option value="retro">${i18n.t('game.themes.retro')}</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="space">Space</option>
              <option value="italian">${i18n.t('game.themes.italian')}</option>
              <option value="matrix">${i18n.t('game.themes.matrix')}</option>
              <option value="lava">${i18n.t('game.themes.lava')}</option>
            </select>
          </div>
        `}

        <!-- Description du tournoi -->
        <div class="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
          <h4 class="text-blue-300 font-medium mb-2">${i18n.t('tournament.howItWorks')}</h4>
          <ul class="text-sm text-gray-300 space-y-1">
            <li>• ${i18n.t('tournament.step1')}</li>
            <li>• ${i18n.t('tournament.step2')}</li>
            <li>• ${i18n.t('tournament.step3')}</li>
            <li>• ${i18n.t('tournament.step4')}</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="create-tournament" 
                  class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors flex-1">
            ${i18n.t('tournament.create.createTournament')}
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
      <div class="relative bg-gray-800 rounded-b-lg overflow-hidden">
        <!-- Canvas Container avec aspect ratio préservé -->
        <div class="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
          <canvas id="game-canvas" 
                  class="absolute top-0 left-0 w-full h-full"
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

  private renderGameOverlay(): string {
    return `
      <div id="game-overlay" class="absolute inset-0 pointer-events-none">
        <!-- Overlay responsive pour les scores -->
        <div class="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex justify-between items-start">
          <!-- Score Joueur 1 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-blue-500/30 min-w-0 flex-shrink-0">
            <div id="player1-info" class="text-white">
              <div class="font-bold text-blue-400 text-xs md:text-sm truncate" id="player1-name">${i18n.t('game.score.you')} 1</div>
              <div class="text-xl md:text-3xl font-mono font-bold" id="player1-score">0</div>
            </div>
          </div>
          
          <!-- Timer central -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-gray-500/30 mx-2 min-w-0 flex-shrink-0">
            <div id="game-timer" class="text-white text-center">
              <div class="text-xs md:text-sm opacity-75 uppercase tracking-wide">${i18n.t('common.time')}</div>
              <div class="text-lg md:text-2xl font-mono font-bold">00:00</div>
            </div>
            <div class="text-xs text-center mt-1 text-gray-400 hidden md:block">
              ${this.getGameModeTitle()}
            </div>
          </div>
          
          <!-- Score Joueur 2 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-red-500/30 min-w-0 flex-shrink-0">
            <div id="player2-info" class="text-white text-right">
              <div class="font-bold text-red-400 text-xs md:text-sm truncate" id="player2-name">${i18n.t('game.score.you')} 2</div>
              <div class="text-xl md:text-3xl font-mono font-bold" id="player2-score">0</div>
            </div>
          </div>
        </div>
        
        <!-- Status mobile en bas (visible uniquement sur mobile) -->
        <div class="absolute bottom-2 left-2 right-2 md:hidden">
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
      <div class="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
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

        <!-- Mobile Game Info (visible sur mobile) -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:hidden">
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

  private renderMobileControls(): string {
    return `
      <div class="bg-gray-700/50 rounded-lg p-4">
        <h4 class="text-lg mb-3 text-center">${i18n.t('game.controls.touch')}</h4>
        <div class="flex justify-between items-center">
          <div class="text-center">
            <div class="text-xs mb-2 text-blue-300 font-semibold">${i18n.t('game.score.you')} 1</div>
            <div class="flex flex-col gap-3">
              <button id="p1-up" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation" 
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p1-down" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
          
          <div class="text-center px-4 flex-1">
            <div class="text-xs text-gray-400 mb-2">${i18n.t('game.controls.instructions')}</div>
          </div>
          
          <div class="text-center">
            <div class="text-xs mb-2 text-red-300 font-semibold">${i18n.t('game.score.you')} 2</div>
            <div class="flex flex-col gap-3">
              <button id="p2-up" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p2-down" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation"
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

    // Start games
    document.getElementById('start-local-game')?.addEventListener('click', () => this.startLocalGame());

    // ✅ Bouton cancel pour annuler le matchmaking
    document.getElementById('cancel-matchmaking')?.addEventListener('click', () => this.cancelMatchmaking());

    // ✅ Bouton retour au menu depuis forfait - nettoyer sessionStorage
    document.getElementById('back-to-menu-from-forfeit')?.addEventListener('click', () => {
      console.log('🧹 Cleaning up session storage before returning to menu');
      sessionStorage.removeItem('remote_game_active');
      sessionStorage.removeItem('remote_game_data');
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });
    document.getElementById('start-remote-game')?.addEventListener('click', () => this.startRemoteGame());
    document.getElementById('create-tournament')?.addEventListener('click', () => this.createTournament());

    // ✅ Redirection vers le profil pour changer le thème (tous modes)
    document.getElementById('change-theme-profile')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
    });
    document.getElementById('change-theme-profile-remote')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
    });
    document.getElementById('change-theme-profile-tournament')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
    });

    // Power ups (tous modes)
    ['enable-powerups', 'remote-enable-powerups', 'tournament-enable-powerups'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        const checkbox = e.target as HTMLInputElement;
        console.log(`🔋 Power-ups ${checkbox.checked ? 'enabled' : 'disabled'} for ${id}`);
        
        if (this.gameManager) {
          this.gameManager.togglePowerUps(checkbox.checked);
        }
      });
    });

    // Game interface controls
    this.bindGameInterfaceEvents();

    // Mobile controls
    this.setupMobileControls();

    // Responsive resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Écouter l'événement de redémarrage remote
    window.addEventListener('startRemoteGame', () => {
      this.startRemoteGame();
    }, { once: true });
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


  private createTournament(): void {
    const gameSettings = this.getGameSettings();
    const isAuthenticated = authService.isAuthenticated();
    
    // Construire l'URL avec les paramètres
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

  private async selectMode(mode: 'local' | 'remote' | 'tournament'): Promise<void> {
    this.gameMode = mode;
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url.toString());
    
    // Re-render pour afficher l'interface du mode sélectionné
    const element = document.querySelector('#page-content');
    if (element) this.render(element);
    this.bindEvents();

    // // Auto-start remote matchmaking if authenticated and not interrupted
    // if (mode === 'remote' && authService.isAuthenticated()) {
      // ✅ Vérifier s'il y a une interruption avant de lancer le matchmaking
      const wasInGame = sessionStorage.getItem('remote_game_active');
      if (wasInGame !== 'true') {
        console.log('🎮 Auto-starting remote matchmaking');
      //   setTimeout(() => this.startRemoteGame(), 100);
      } else {
        console.log('🚫 Not auto-starting due to game interruption - showing forfeit modal');
      }
    // }
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

  private async startRemoteGame(): Promise<void> {
    try {
      console.log('🌐 Starting remote game...');
      
      // Récupérer les paramètres de jeu
      const gameSettings = this.getGameSettings();
      
      // Afficher l'interface de jeu
      this.showGameInterface();
      
      // Créer une nouvelle instance RemotePong
      console.log('🆕 Creating new RemotePong instance');
      this.remotePong = new RemotePong('game-canvas', gameSettings);
      
      // Écouter l'événement de redémarrage pour la prochaine fois
      window.addEventListener('startRemoteGame', () => {
        this.startRemoteGame();
      }, { once: true });
      
      // Démarrer la partie remote
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
    
    // Retourner à la sélection de mode
    this.showModeSelection();
  }

  private updateMatchmakingStatus(message: string): void {
    const statusElement = document.getElementById('matchmaking-text');
    if (statusElement) {
      statusElement.textContent = message;
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
      // if (authService.isAuthenticated()) {
      //   await matchService.sendLocalMatchData(
      //     settings.player1Name,
      //     settings.player2Name,
      //     scores.player1,
      //     scores.player2,
      //     Math.floor(duration)
      //   );
      //   console.log('✅ Match data saved to backend');
      // }
      console.log('🎮 Game ended, data already saved by Pong3D');

    } catch (error) {
      console.error('❌ Failed to save match data:', error);
    }
  }

  private getGameSettings(): GameSettings 
  {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    // Noms des joueurs selon le mode
    let player1Name: string;
    let player2Name: string;
    
    if (this.gameMode === 'remote') {
      player1Name = currentUser?.username || 'Player';
      player2Name = 'Opponent'; // Sera mis à jour lors du matchmaking
    } else if (this.gameMode === 'tournament') {
      player1Name = currentUser?.username || 'Player';
      player2Name = 'Opponent'; // Sera mis à jour lors du tournoi
    } else {
      // Mode local
      player1Name = isAuthenticated && currentUser 
        ? currentUser.username 
        : (document.getElementById('player1-name-input') as HTMLInputElement)?.value || 'Player 1';
      player2Name = (document.getElementById('player2-name-input') as HTMLInputElement)?.value || 'Player 2';
    }
    
    // Récupérer les paramètres selon le mode
    const prefix = this.gameMode === 'remote' ? 'remote-' : 
                  this.gameMode === 'tournament' ? 'tournament-' : '';
    
    const ballSpeedEl = document.getElementById(`${prefix}ball-speed`) as HTMLSelectElement;
    const winScoreEl = document.getElementById(`${prefix}win-score`) as HTMLSelectElement;
    const powerUpsEl = document.getElementById(`${prefix}enable-powerups`) as HTMLInputElement;
    const themeEl = document.getElementById(`${prefix}theme`) as HTMLSelectElement;
    
    // Thème : préféré utilisateur ou sélection manuelle
    let selectedTheme: string;
    if (isAuthenticated && this.userPreferredTheme) {
      selectedTheme = this.userPreferredTheme;
    } else {
      selectedTheme = themeEl?.value || 'classic';
    }
    
    return {
      player1Name,
      player2Name,
      ballSpeed: ballSpeedEl?.value as 'slow' | 'medium' | 'fast' || 'medium',
      winScore: parseInt(winScoreEl?.value || '5'),
      theme: selectedTheme,
      enableEffects: false, // Toujours false pour l'instant
      powerUps: powerUpsEl?.checked || false
    };
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

  /**
   * ✅ Obtenir le nom d'affichage d'un thème
   */
  private getThemeName(themeId: string): string {
    const nameMap: Record<string, string> = {
      classic: i18n.t('game.themes.classic'),
      neon: i18n.t('game.themes.neon'),
      retro: i18n.t('game.themes.retro'),
      cyberpunk: 'Cyberpunk',
      space: 'Space',
      italian: i18n.t('game.themes.italian'),
      matrix: i18n.t('game.themes.matrix'),
      lava: i18n.t('game.themes.lava')
    };
    
    return nameMap[themeId] || nameMap.classic;
  }

  destroy(): void {
    console.log('🧹 Destroying GamePage and cleaning up active games');
    
    window.removeEventListener('resize', () => this.handleResize());
    
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }

    if (this.remotePong) {
      this.remotePong.destroy();
      this.remotePong = null;
    }

    // Retirer les handlers de navigation
    if (this.beforeNavigateHandler) {
      window.removeEventListener('beforeNavigate', this.beforeNavigateHandler as EventListener);
      this.beforeNavigateHandler = null;
    }
  }
}