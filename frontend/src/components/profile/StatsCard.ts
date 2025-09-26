import { i18n } from '@/services/i18nService.js';
import type { User } from '../../types/index.js';

export class StatsCard {
  constructor(private user: User) {}

  render(): string {
    // Vérification de sécurité
    if (!this.user) {
      return this.renderError();
    }

    // Extraction des stats avec valeurs par défaut
    const stats = this.user.stats || this.getDefaultStats();
    
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        ${this.renderHeader()}
        ${this.renderMainStats(stats)}
      </div>
    `;
  }

  private getDefaultStats() {
    return {
      wins: 0,
      losses: 0,
      totalGames: 0,
      winRate: 0,
      rank: 0,
      highestScore: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  private renderError(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="text-center py-8">
          <div class="text-red-500 text-4xl mb-4">📊</div>
          <h3 class="text-lg font-medium text-red-400 mb-2">Erreur</h3>
          <p class="text-gray-400">Impossible de charger les statistiques</p>
        </div>
      </div>
    `;
  }

  private renderHeader(): string {
    return `
      <h2 class="text-xl font-bold mb-6 text-primary-400 flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        ${i18n.t('profile.stats.title')}
      </h2>
    `;
  }

  private renderMainStats(stats: any): string {
    // Calculs dérivés pour assurer la cohérence
    const totalGames = stats.wins + stats.losses;
    const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-4 bg-green-900/20 rounded-lg border border-green-700/30">
          <div class="text-2xl font-bold text-green-400 mb-1">${stats.wins}</div>
          <div class="text-gray-400 text-sm">${i18n.t('profile.stats.wins')}</div>
        </div>
        <div class="text-center p-4 bg-red-900/20 rounded-lg border border-red-700/30">
          <div class="text-2xl font-bold text-red-400 mb-1">${stats.losses}</div>
          <div class="text-gray-400 text-sm">${i18n.t('profile.stats.losses')}</div>
        </div>
        <div class="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
          <div class="text-2xl font-bold text-blue-400 mb-1">${totalGames}</div>
          <div class="text-gray-400 text-sm">${i18n.t('profile.stats.totalGames')}</div>
        </div>
        <div class="text-center p-4 ${this.getWinRateBgColor(winRate)} rounded-lg border ${this.getWinRateBorderColor(winRate)}">
          <div class="text-2xl font-bold ${this.getWinRateColor(winRate)} mb-1">${winRate}%</div>
          <div class="text-gray-400 text-sm mb-2">${i18n.t('profile.stats.winRate')}</div>
          <div class="w-full bg-gray-600 rounded-full h-2">
            <div class="${this.getWinRateColor(winRate).replace('text-', 'bg-')} h-2 rounded-full transition-all duration-500" style="width: ${winRate}%"></div>
          </div>
        </div>
      </div>
    `;
  }

//   private renderSecondaryStats(stats: any): string {
//     return `
//       <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <div class="text-center p-3 bg-gray-700 rounded-lg">
//           <div class="text-lg font-bold text-purple-400">${stats.rank ? `#${stats.rank}` : 'N/A'}</div>
//           <div class="text-gray-400 text-xs">${i18n.t('profile.stats.rank')}</div>
//         </div>
//         <div class="text-center p-3 bg-gray-700 rounded-lg">
//           <div class="text-lg font-bold text-yellow-400">${stats.highestScore || 0}</div>
//           <div class="text-gray-400 text-xs">${i18n.t('profile.stats.highestScore')}</div>
//         </div>
//         <div class="text-center p-3 bg-gray-700 rounded-lg">
//           <div class="text-lg font-bold text-orange-400">${stats.currentStreak || 0}</div>
//           <div class="text-gray-400 text-xs">${i18n.t('profile.stats.currentStreak')}</div>
//         </div>
//         <div class="text-center p-3 bg-gray-700 rounded-lg">
//           <div class="text-lg font-bold text-pink-400">${stats.longestStreak || 0}</div>
//           <div class="text-gray-400 text-xs">${i18n.t('profile.stats.longestStreak')}</div>
//         </div>
//       </div>
//     `;
//   }

  private getWinRateColor(winRate: number): string {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 50) return 'text-yellow-400';
    if (winRate >= 30) return 'text-orange-400';
    return 'text-red-400';
  }

  private getWinRateBgColor(winRate: number): string {
    if (winRate >= 70) return 'bg-green-900/20';
    if (winRate >= 50) return 'bg-yellow-900/20';
    if (winRate >= 30) return 'bg-orange-900/20';
    return 'bg-red-900/20';
  }

  private getWinRateBorderColor(winRate: number): string {
    if (winRate >= 70) return 'border-green-700/30';
    if (winRate >= 50) return 'border-yellow-700/30';
    if (winRate >= 30) return 'border-orange-700/30';
    return 'border-red-700/30';
  }
}