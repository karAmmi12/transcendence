import { i18n } from '@services/i18n';
import type { MatchHistory } from '../../types/index.js';

export class MatchHistoryCard {
  constructor(private matchHistory: MatchHistory[], private isOwnProfile: boolean) {}
  
  render(): string {
    console.log('Rendering MatchHistoryCard with', this.matchHistory.length, 'matches');
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-primary-400 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            ${i18n.t('profile.history.title')}
          </h2>
          ${this.renderFilters()}
        </div>
        ${this.renderMatches()}
      </div>
    `;
  }

  private renderFilters(): string {
    return `
      <div class="flex space-x-2">
        <select id="match-filter" class="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:border-primary-500 focus:outline-none">
          <option value="all">${i18n.t('profile.history.filters.all')}</option>
          <option value="wins">${i18n.t('profile.history.filters.wins')}</option>
          <option value="losses">${i18n.t('profile.history.filters.losses')}</option>
          <option value="tournament">${i18n.t('profile.history.filters.tournament')}</option>
        </select>
      </div>
    `;
  }

  private renderMatches(): string {
    if (this.matchHistory.length === 0) {
      return `
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">🏓</div>
          <h3 class="text-lg font-medium text-gray-300 mb-2">${i18n.t('profile.history.noGames')}</h3>
          <p class="text-gray-500 mb-6">${i18n.t('profile.history.noGamesDesc')}</p>
          ${this.isOwnProfile ? `
            <button class="btn-primary">
              ${i18n.t('profile.history.playFirstGame')}
            </button>
          ` : ''}
        </div>
      `;
    }

    const recentMatches = this.matchHistory.slice(0, 10);
    
    return `
      <div class="space-y-3 max-h-96 overflow-y-auto">
        ${recentMatches.map(match => this.renderMatch(match)).join('')}
      </div>
      ${this.matchHistory.length > 10 ? `
        <div class="mt-6 pt-4 border-t border-gray-700">
          <button id="view-all-matches" class="w-full btn-secondary">
            ${i18n.t('profile.history.viewAll')} (${this.matchHistory.length})
          </button>
        </div>
      ` : ''}
      ${this.renderQuickStats()}
    `;
  }

  private renderMatch(match: MatchHistory): string {
    const isWin = match.result === 'win';
    const resultColor = isWin ? 'text-green-400' : 'text-red-400';
    const bgColor = isWin ? 'bg-green-900/20' : 'bg-red-900/20';
    const borderColor = isWin ? 'border-green-500' : 'border-red-500';
    
    return `
      <div class="flex items-center justify-between p-4 ${bgColor} rounded-lg border-l-4 ${borderColor} hover:bg-opacity-80 transition-all group cursor-pointer" data-match-id="${match.id}">
        <div class="flex items-center space-x-4">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'} mb-1"></div>
            <span class="${resultColor} font-bold text-xs uppercase tracking-wide">
              ${i18n.t(`profile.history.result.${match.result}`)}
            </span>
          </div>
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-white font-medium">vs ${match.opponent}</span>
              ${match.gameMode ? `
                <span class="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                  ${i18n.t(`game.modes.${match.gameMode}`)}
                </span>
              ` : ''}
            </div>
            <div class="text-gray-400 text-sm flex items-center space-x-3">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                ${this.formatDate(match.date)}
              </span>
              ${match.duration ? `
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  ${this.formatDuration(match.duration)}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white font-bold text-xl mb-1">
            ${match.score.player} - ${match.score.opponent}
          </div>
          <button class="text-blue-400 hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            ${i18n.t('profile.history.viewDetails')} →
          </button>
        </div>
      </div>
    `;
  }

  private renderQuickStats(): string {
    if (this.matchHistory.length === 0) return '';

    const wins = this.matchHistory.filter(m => m.result === 'win').length;
    const total = this.matchHistory.length;
    const winRate = Math.round((wins / total) * 100);
    const recentWins = this.matchHistory.slice(0, 5).filter(m => m.result === 'win').length;

    return `
      <div class="mt-6 pt-4 border-t border-gray-700">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-gray-700 rounded-lg p-3">
            <div class="text-lg font-bold text-blue-400">${total}</div>
            <div class="text-xs text-gray-400">${i18n.t('profile.history.stats.totalGames')}</div>
          </div>
          <div class="bg-gray-700 rounded-lg p-3">
            <div class="text-lg font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}">${winRate}%</div>
            <div class="text-xs text-gray-400">${i18n.t('profile.history.stats.winRate')}</div>
          </div>
          <div class="bg-gray-700 rounded-lg p-3">
            <div class="text-lg font-bold text-yellow-400">${recentWins}/5</div>
            <div class="text-xs text-gray-400">${i18n.t('profile.history.stats.recent')}</div>
          </div>
        </div>
      </div>
    `;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return i18n.t('common.today');
    if (diffDays === 1) return i18n.t('common.yesterday');
    if (diffDays < 7) return i18n.t('common.daysAgo', { days: diffDays });
    
    return date.toLocaleDateString();
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}