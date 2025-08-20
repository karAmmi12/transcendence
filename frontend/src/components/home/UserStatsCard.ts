import { i18n } from '@services/i18n';
import type { User } from '../../types/index.js';

export class UserStatsCard {
  constructor(private user: User) {}

  render(): string {
    if (!this.user?.stats) return '';

    return `
      <div class="bg-gray-800 p-6 rounded-lg mb-8 max-w-4xl mx-auto">
        <h2 class="text-2xl font-semibold mb-4 text-primary-400">${i18n.t('home.stats.title')}</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-gray-700 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-400">${this.user.stats.wins}</div>
            <div class="text-gray-400 text-sm">${i18n.t('home.stats.wins')}</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg">
            <div class="text-2xl font-bold text-red-400">${this.user.stats.losses}</div>
            <div class="text-gray-400 text-sm">${i18n.t('home.stats.losses')}</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg">
            <div class="text-2xl font-bold text-yellow-400">${this.user.stats.winRate}%</div>
            <div class="text-gray-400 text-sm">${i18n.t('home.stats.winRate')}</div>
          </div>
          <div class="bg-gray-700 p-4 rounded-lg">
            <div class="text-2xl font-bold text-purple-400">#${this.user.stats.rank}</div>
            <div class="text-gray-400 text-sm">${i18n.t('home.stats.rank')}</div>
          </div>
        </div>
      </div>
    `;
  }
}