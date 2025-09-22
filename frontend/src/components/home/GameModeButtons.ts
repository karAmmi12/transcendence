import { i18n } from '@/services/i18nService.js';
import type { GameModeCallbacks } from '@/types/index.js';

export class GameModeButtons {
  constructor(
    private isAuthenticated: boolean,
    private callbacks: GameModeCallbacks
  ) {}

  render(): string {
    return `
      <div class="mb-16">
        <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">${i18n.t('home.gameModes.title')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          ${this.renderLocalGameCard()}
          ${this.renderRemoteGameCard()}
          ${this.renderTournamentCard()}
        </div>
      </div>
    `;
  }

  private renderLocalGameCard(): string {
    return `
      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-all duration-300 transform hover:scale-105">
        <div class="text-center">
          <div class="text-4xl mb-4">🏠</div>
          <h3 class="text-lg md:text-xl font-semibold mb-3">${i18n.t('home.gameModes.local.title')}</h3>
          <p class="text-gray-400 text-sm md:text-base mb-6 min-h-[3rem]">${i18n.t('home.gameModes.local.description')}</p>
          <button 
            id="local-game-btn" 
            class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors touch-manipulation"
          >
            ${i18n.t('home.gameModes.local.button')}
          </button>
        </div>
      </div>
    `;
  }

  private renderRemoteGameCard(): string {
    const isDisabled = !this.isAuthenticated;
    const buttonClass = isDisabled 
      ? 'w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors touch-manipulation cursor-pointer' // ✅ Retirer cursor-not-allowed
      : 'w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors touch-manipulation';

    return `
      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-105">
        <div class="text-center">
          <div class="text-4xl mb-4">🌐</div>
          <h3 class="text-lg md:text-xl font-semibold mb-3">${i18n.t('home.gameModes.remote.title')}</h3>
          <p class="text-gray-400 text-sm md:text-base mb-3 min-h-[3rem]">${i18n.t('home.gameModes.remote.description')}</p>
          ${!this.isAuthenticated ? `
            <p class="text-yellow-400 text-xs md:text-sm mb-3 flex items-center justify-center">
              <i class="fas fa-lock mr-1"></i>
              ${i18n.t('home.gameModes.remote.loginRequired')}
            </p>
          ` : ''}
          <button 
            id="remote-game-btn" 
            class="${buttonClass}"
          >
            ${isDisabled ? i18n.t('nav.login') : i18n.t('home.gameModes.remote.button')}
          </button>
        </div>
      </div>
    `;
  }

  private renderTournamentCard(): string {
    return `
      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 transform hover:scale-105 sm:col-span-2 lg:col-span-1">
        <div class="text-center">
          <div class="text-4xl mb-4">🏆</div>
          <h3 class="text-lg md:text-xl font-semibold mb-3">${i18n.t('home.gameModes.tournament.title')}</h3>
          <p class="text-gray-400 text-sm md:text-base mb-6 min-h-[3rem]">${i18n.t('home.gameModes.tournament.description')}</p>
          <button 
            id="tournament-btn" 
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors touch-manipulation"
          >
            ${i18n.t('home.gameModes.tournament.button')}
          </button>
        </div>
      </div>
    `;
  }

  bindEvents(): void {
    document.getElementById('local-game-btn')?.addEventListener('click', () => {
      this.callbacks.onLocalGame();
    });

    document.getElementById('remote-game-btn')?.addEventListener('click', () => {
      // ✅ Si non connecté, rediriger vers la connexion
      if (!this.isAuthenticated) {
        this.callbacks.onLogin?.();
      } else {
        this.callbacks.onRemoteGame();
      }
    });

    document.getElementById('tournament-btn')?.addEventListener('click', () => {
      this.callbacks.onTournament();
    });
  }
}