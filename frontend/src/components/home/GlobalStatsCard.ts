import { i18n } from '@/services/i18nService';

export interface GlobalStats {
  totalPlayers: number;
  totalGames: number;
  onlinePlayers: number;
}

export class GlobalStatsCard {
  constructor(private stats: GlobalStats) {}

  render(): string {
    return `
      <div class="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 rounded-lg mb-8 max-w-4xl mx-auto border border-blue-700/30">
        <h2 class="text-2xl font-semibold mb-4 text-center text-blue-400">${i18n.t('home.globalStats.title')}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
          <div class="bg-black/20 p-4 rounded-lg border border-blue-600/30">
            <div class="text-2xl font-bold text-blue-400">${this.formatNumber(this.stats.totalPlayers)}</div>
            <div class="text-gray-300 text-sm">${i18n.t('home.globalStats.totalPlayers')}</div>
          </div>
          <div class="bg-black/20 p-4 rounded-lg border border-green-600/30">
            <div class="text-2xl font-bold text-green-400">${this.formatNumber(this.stats.totalGames)}</div>
            <div class="text-gray-300 text-sm">${i18n.t('home.globalStats.totalGames')}</div>
          </div>
          <div class="bg-black/20 p-4 rounded-lg border border-yellow-600/30">
            <div class="text-2xl font-bold text-yellow-400">${this.stats.onlinePlayers}</div>
            <div class="text-gray-300 text-sm">${i18n.t('home.globalStats.onlinePlayers')}</div>
          </div>
        </div>
      </div>
    `;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}