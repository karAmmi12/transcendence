import { i18n } from '@/services/i18nService.js';

export class GameModeSelector 
{
  constructor(private callbacks: {
    onLocalMode: () => void;
    onRemoteMode: () => void;
    onTournamentMode: () => void;
  }) {}

  render(): string 
  {
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

  bindEvents(): void 
  {
    document.getElementById('mode-local')?.addEventListener('click', this.callbacks.onLocalMode);
    document.getElementById('mode-remote')?.addEventListener('click', this.callbacks.onRemoteMode);
    document.getElementById('mode-tournament')?.addEventListener('click', this.callbacks.onTournamentMode);
  }
}