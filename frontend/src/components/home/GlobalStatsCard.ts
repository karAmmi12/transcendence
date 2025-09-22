import { i18n } from '@/services/i18nService.js';
import type { GlobalStats } from '../../types/index.js';

export class GlobalStatsCard {
  constructor(private stats: GlobalStats) {}

  render(): string {
    return `
      <div class="bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors">
        <h3 class="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center">
          <span class="text-xl md:text-2xl mr-3">📊</span>
          ${i18n.t('home.globalStats.title')}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-blue-400">${this.stats.totalPlayers.toLocaleString()}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.globalStats.totalPlayers')}</div>
          </div>
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-green-400">${this.stats.totalGames.toLocaleString()}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.globalStats.totalGames')}</div>
          </div>
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-yellow-400">${this.stats.onlinePlayers.toLocaleString()}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.globalStats.onlinePlayers')}</div>
          </div>
        </div>
      </div>
    `;
  }
}
