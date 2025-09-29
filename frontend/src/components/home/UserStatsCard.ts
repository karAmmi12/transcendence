import { i18n } from '@/services/i18nService.js';
import type { User } from '../../types/index.js';

export class UserStatsCard 
{
  constructor(private user: User) {}
  

  render(): string 
  {
    if (!this.user?.stats) 
      return '';

    return `
      <div class="bg-gray-800 p-4 md:p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
        <h3 class="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center">
          <span class="text-xl md:text-2xl mr-3">🎮</span>
          ${i18n.t('home.stats.title')}
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-green-400">${this.user.stats.wins}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.stats.wins')}</div>
          </div>
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-red-400">${this.user.stats.losses}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.stats.losses')}</div>
          </div>
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-blue-400">${this.user.stats.winRate}%</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.stats.winRate')}</div>
          </div>
          <div class="text-center p-3 bg-gray-700/50 rounded-lg">
            <div class="text-xl md:text-2xl font-bold text-purple-400">${this.user.stats.totalGames}</div>
            <div class="text-xs md:text-sm text-gray-400 mt-1">${i18n.t('home.stats.games')}</div>
          </div>
        </div>
      </div>
    `;
  }
}