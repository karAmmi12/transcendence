import { i18n } from '@/services/i18nService.js';
import { authService } from '@/services/authService.js';
import type { GameSettings as Pong3DGameSettings }  from '@/types/index.js';
import { Logger } from '@/utils/logger.js'; 

export class GameSettingsUI
{
  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur de l'interface des paramètres de jeu
   * @param mode Mode de jeu (local, remote, tournament)
   * @param userPreferredTheme Thème préféré de l'utilisateur
   * @param callbacks Callbacks pour les actions
   */
  constructor(
    private mode: 'local' | 'remote' | 'tournament',
    private userPreferredTheme: string | null,
    private callbacks: {
      onStartLocal: () => void;
      onStartRemote: () => void;
      onCreateTournament: () => void;
      onBackToModes: () => void;
      onChangeTheme: () => void;
    }
  )
  {
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Rend l'interface des paramètres selon le mode
   */
  render(): string
  {
    switch (this.mode)
    {
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

  /**
   * Attache les événements aux éléments de l'interface
   */
  bindEvents(): void
  {
    // Start buttons
    document.getElementById('start-local-game')?.addEventListener('click', this.callbacks.onStartLocal);
    document.getElementById('start-remote-game')?.addEventListener('click', this.callbacks.onStartRemote);
    document.getElementById('create-tournament')?.addEventListener('click', this.callbacks.onCreateTournament);

    // Back buttons
    document.querySelectorAll('#back-to-modes').forEach(btn =>
    {
      btn.addEventListener('click', this.callbacks.onBackToModes);
    });

    // Theme change buttons
    document.getElementById('change-theme-profile')?.addEventListener('click', this.callbacks.onChangeTheme);
    document.getElementById('change-theme-profile-remote')?.addEventListener('click', this.callbacks.onChangeTheme);
    document.getElementById('change-theme-profile-tournament')?.addEventListener('click', this.callbacks.onChangeTheme);

    // Back to menu from forfeit
    document.getElementById('back-to-menu-from-forfeit')?.addEventListener('click', () =>
    {
      Logger.log('🧹 Cleaning up session storage before returning to menu');
      sessionStorage.removeItem('remote_game_active');
      sessionStorage.removeItem('remote_game_data');
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });
  }

  /**
   * Récupère les paramètres de jeu configurés
   */
  getGameSettings(): Pong3DGameSettings
  {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    
    // Noms des joueurs selon le mode
    let player1Name: string;
    let player2Name: string;
    
    if (this.mode === 'remote')
    {
      player1Name = currentUser?.username || 'Player';
      player2Name = 'Opponent'; // Sera mis à jour lors du matchmaking
    } else if (this.mode === 'tournament')
    {
      player1Name = currentUser?.username || 'Player';
      player2Name = 'Opponent'; // Sera mis à jour lors du tournoi
    } else
    {
      // Mode local
      player1Name = isAuthenticated && currentUser 
        ? currentUser.username 
        : (document.getElementById('player1-name-input') as HTMLInputElement)?.value || 'Player 1';
      player2Name = (document.getElementById('player2-name-input') as HTMLInputElement)?.value || 'Player 2';
    }
    
    // Récupérer les paramètres selon le mode
    const prefix = this.mode === 'remote' ? 'remote-' : 
                  this.mode === 'tournament' ? 'tournament-' : '';
    
    const ballSpeedEl = document.getElementById(`${prefix}ball-speed`) as HTMLSelectElement;
    const winScoreEl = document.getElementById(`${prefix}win-score`) as HTMLSelectElement;
    const powerUpsEl = document.getElementById(`${prefix}enable-powerups`) as HTMLInputElement;
    const themeEl = document.getElementById(`${prefix}theme`) as HTMLSelectElement;
    
    // Thème : préféré utilisateur ou sélection manuelle
    let selectedTheme: string;
    if (isAuthenticated && this.userPreferredTheme)
    {
      selectedTheme = this.userPreferredTheme;
    } else
    {
      const themeSelector = document.getElementById(this.mode === 'local' ? 'game-theme' : `${prefix}theme`) as HTMLSelectElement;
      selectedTheme = themeSelector?.value || 'classic';
      Logger.log('🎨 Using selected theme from UI:', selectedTheme, 'from selector:', themeSelector?.id);
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

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Rend les paramètres pour le mode local
   */
  private renderLocalSettings(): string
  {
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();
    const defaultTheme = this.userPreferredTheme || 'classic';

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
              <input type="checkbox" id="enable-powerups" class="mr-2">
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

  /**
   * Rend les paramètres pour le mode remote
   */
  private renderRemoteSettings(): string
  {
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated)
    {
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
    Logger.log('🔍 renderRemoteSettings - Checking sessionStorage:', { 
      wasInGame, 
      sessionItems: {
        remote_game_active: sessionStorage.getItem('remote_game_active'),
        remote_game_data: sessionStorage.getItem('remote_game_data')
      }
    });
    
    if (wasInGame === 'true')
    {
      Logger.log('🚫 GamePage detected game interruption - showing forfeit modal instead of matchmaking interface');
      return `
        <div class="bg-gray-800 rounded-lg p-6 text-center">
          <h3 class="text-xl mb-4 text-red-400">${i18n.t('game.remote.forfeit.title')}</h3>
          <div class="mb-6">
            <div class="text-6xl mb-4">😔</div>
            <p class="text-lg text-gray-300 mb-2">${i18n.t('game.remote.forfeit.message')}</p>
            <p class="text-sm text-gray-400">${i18n.t('game.remote.forfeit.opponentWins')}</p>
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

        <!-- ✅ Message informatif sur les rôles -->
        <div class="mb-6 p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
          <div class="flex items-start gap-3">
            <div class="text-amber-400 text-xl">👑</div>
            <div>
              <h4 class="text-amber-200 font-medium mb-2">${i18n.t('game.remote.howItWorks.title')}</h4>
              <div class="text-amber-100 text-sm space-y-1">
                <p><strong>🎮 ${i18n.t('game.remote.howItWorks.host.title')} :</strong> ${i18n.t('game.remote.howItWorks.host.description')}</p>
                <p><strong>👥 ${i18n.t('game.remote.howItWorks.guest.title')} :</strong> ${i18n.t('game.remote.howItWorks.guest.description')}</p>
                <p><strong>🎨 ${i18n.t('game.remote.howItWorks.theme.title')} :</strong> ${i18n.t('game.remote.howItWorks.theme.description')}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Paramètres configurables UNIQUEMENT si vous êtes susceptible d'être host -->
        <div id="host-settings" class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg text-white">${i18n.t('game.remote.hostSettings.title')}</h4>
            <span class="text-xs bg-blue-600 px-2 py-1 rounded">${i18n.t('game.remote.hostSettings.note')}</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block mb-2">${i18n.t('game.customization.ballSpeed')}:</label>
              <select id="remote-ball-speed" class="bg-gray-700 rounded px-3 py-2 w-full">
                <option value="slow">${i18n.t('common.slow')}</option>
                <option value="medium" selected>${i18n.t('common.medium')}</option>
                <option value="fast">${i18n.t('common.fast')}</option>
              </select>
            </div>

            <div>
              <label class="block mb-2">${i18n.t('common.score')} ${i18n.t('common.toWin')}:</label>
              <select id="remote-win-score" class="bg-gray-700 rounded px-3 py-2 w-full">
                <option value="3">3 ${i18n.t('common.points')}</option>
                <option value="5" selected>5 ${i18n.t('common.points')}</option>
                <option value="10">10 ${i18n.t('common.points')}</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block mb-2">${i18n.t('game.customization.powerUps')}:</label>
              <div class="flex items-center">
                <input type="checkbox" id="remote-enable-powerups" class="mr-2">
                <label for="remote-enable-powerups" class="text-sm">${i18n.t('game.customization.enablePowerUps')}</label>
              </div>
              <p class="text-xs text-gray-400 mt-1">${i18n.t('game.remote.powerUpsNote')}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="start-remote-game" 
                  class="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
            <span>🌐</span>
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

  /**
   * Rend les paramètres pour le mode tournament
   */
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

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Obtient le nom d'affichage du thème
   * @param themeId ID du thème
   * @returns Nom d'affichage du thème
   */
  private getThemeName(themeId: string): string
  {
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
}