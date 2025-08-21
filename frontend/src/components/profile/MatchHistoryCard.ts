import { i18n } from '@/services/i18nService.js';
import type { MatchHistory } from '../../types/index.js';
import { userService } from '@/services/userService.js';

export class MatchHistoryCard {
  private filteredMatches: MatchHistory[] = [];
  private currentFilter: string = 'all';

  constructor(private matchHistory: MatchHistory[], private isOwnProfile: boolean) {
    this.filteredMatches = [...this.matchHistory];
  }
  
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
        ${this.renderVisualStats()}
        ${this.renderMatches()}
      </div>
    `;
  }

  private renderFilters(): string {
    const gameModes = [...new Set(this.matchHistory.map(m => m.gameMode).filter(Boolean))];
    
    return `
      <div class="flex flex-col sm:flex-row gap-2">
        <select id="match-filter" class="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:border-primary-500 focus:outline-none">
          <option value="all">${i18n.t('profile.history.filters.all')}</option>
          <option value="wins">${i18n.t('profile.history.filters.wins')}</option>
          <option value="losses">${i18n.t('profile.history.filters.losses')}</option>
          <option value="tournament">${i18n.t('profile.history.filters.tournament')}</option>
        </select>
        ${gameModes.length > 0 ? `
          <select id="mode-filter" class="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:border-primary-500 focus:outline-none">
            <option value="all">${i18n.t('game.customization.gameMode')}</option>
            ${gameModes.map(mode => `
              <option value="${mode}">${i18n.t(`game.modes.${mode}`)}</option>
            `).join('')}
          </select>
        ` : ''}
      </div>
    `;
  }

  
  private renderVisualStats(): string {
    if (this.filteredMatches.length === 0) return '';

    const wins = this.filteredMatches.filter(m => m.result === 'win').length;
    const losses = this.filteredMatches.filter(m => m.result === 'loss').length;
    const total = this.filteredMatches.length;
    const winRate = Math.round((wins / total) * 100);

    return `
      <div class="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-6 mb-6 border border-gray-600/30">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <!-- Section Camembert -->
          <div class="flex flex-col items-center">
            <div class="relative w-40 h-40 mb-4">
              ${this.renderAdvancedPieChart(winRate)}
            </div>
            
            <!-- Légende du camembert -->
            <div class="flex gap-4 text-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-lg"></div>
                <span class="text-gray-300">${i18n.t('profile.stats.wins')} (${wins})</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500 shadow-lg"></div>
                <span class="text-gray-300">${i18n.t('profile.stats.losses')} (${losses})</span>
              </div>
            </div>
          </div>

          <!-- Section Statistiques détaillées -->
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/50 hover:bg-emerald-900/40 transition-colors">
              <div class="text-3xl font-bold text-emerald-400 mb-2">${wins}</div>
              <div class="text-sm text-gray-300 uppercase tracking-wide">${i18n.t('profile.stats.wins')}</div>
            </div>
            
            <div class="text-center p-4 bg-red-900/30 rounded-lg border border-red-700/50 hover:bg-red-900/40 transition-colors">
              <div class="text-3xl font-bold text-red-400 mb-2">${losses}</div>
              <div class="text-sm text-gray-300 uppercase tracking-wide">${i18n.t('profile.stats.losses')}</div>
            </div>
            
            <div class="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-700/50 hover:bg-blue-900/40 transition-colors">
              <div class="text-3xl font-bold text-blue-400 mb-2">${total}</div>
              <div class="text-sm text-gray-300 uppercase tracking-wide">${i18n.t('profile.history.stats.totalGames')}</div>
            </div>
            
            <div class="text-center p-4 bg-purple-900/30 rounded-lg border border-purple-700/50 hover:bg-purple-900/40 transition-colors">
              <div class="text-3xl font-bold text-purple-400 mb-2">${this.getRecentWinStreak()}</div>
              <div class="text-sm text-gray-300 uppercase tracking-wide">${i18n.t('profile.history.stats.recent')}</div>
            </div>
          </div>
        </div>

        <!-- Graphique en barres pour les modes de jeu -->
        ${this.renderGameModeChart()}
      </div>
    `;
  }
  private renderAdvancedPieChart(winRate: number): string {
    const winPercentage = winRate;
    const lossPercentage = 100 - winRate;
    
    // Calcul des angles pour le SVG (commencer à -90° pour avoir le début en haut)
    const startAngle = -90;
    const winAngle = (winPercentage / 100) * 360;
    
    // Créer les paths pleins pour un camembert épuré
    const winPath = this.createFilledArcPath(80, 80, 60, startAngle, startAngle + winAngle);
    const lossPath = this.createFilledArcPath(80, 80, 60, startAngle + winAngle, startAngle + 360);
    
    return `
      <svg class="w-40 h-40 drop-shadow-lg" viewBox="0 0 160 160">
        <!-- Dégradés épurés -->
        <defs>
          <radialGradient id="winGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" style="stop-color:#34d399;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
          </radialGradient>
          <radialGradient id="lossGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" style="stop-color:#f87171;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
          </radialGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15"/>
          </filter>
        </defs>
        
        <!-- Segment des défaites (fond) -->
        ${lossPercentage > 0 ? `<path d="${lossPath}" fill="url(#lossGradient)" filter="url(#softShadow)"/>` : ''}
        
        <!-- Segment des victoires (par-dessus) -->
        ${winPercentage > 0 ? `<path d="${winPath}" fill="url(#winGradient)" filter="url(#softShadow)"/>` : ''}
        
        <!-- Cercle de base si pas de données -->
        ${winPercentage === 0 && lossPercentage === 0 ? `
          <circle cx="80" cy="80" r="60" fill="#374151" stroke="#4B5563" stroke-width="2"/>
        ` : ''}
      </svg>
    `;
  }


  private createFilledArcPath(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
    if (startAngle === endAngle) return '';
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    // Créer un path rempli qui forme une portion de camembert
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }


  private createAdvancedArcPath(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  }

  private getRecentWinStreak(): number {
    // Calculer la série de victoires récente (derniers 5 matchs)
    const recentMatches = this.filteredMatches.slice(0, 5);
    return recentMatches.filter(m => m.result === 'win').length;
  }

  private renderGameModeChart(): string {
    const modes = this.filteredMatches.reduce((acc, match) => {
      if (match.gameMode) {
        acc[match.gameMode] = (acc[match.gameMode] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(modes).length === 0) return '';

    const maxCount = Math.max(...Object.values(modes));
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
    
    return `
      <div class="mt-6 pt-6 border-t border-gray-600/50">
        <h4 class="text-lg font-semibold text-gray-200 mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          ${i18n.t('game.customization.gameMode')}
        </h4>
        <div class="space-y-3">
          ${Object.entries(modes).map(([mode, count], index) => {
            const percentage = (count / this.filteredMatches.length) * 100;
            const barWidth = (count / maxCount) * 100;
            const color = colors[index % colors.length];
            
            return `
              <div class="group hover:bg-gray-700/30 p-3 rounded-lg transition-all duration-200">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-gray-200 font-medium">${i18n.t(`game.modes.${mode}`)}</span>
                  <span class="text-gray-400 bg-gray-700 px-2 py-1 rounded text-xs font-mono">${count} (${Math.round(percentage)}%)</span>
                </div>
                <div class="bg-gray-600 rounded-full h-3 overflow-hidden">
                  <div class="${color} h-3 rounded-full transition-all duration-500 ease-out shadow-lg" style="width: ${barWidth}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
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

    const recentMatches = this.filteredMatches.slice(0, 10);
    
    return `
      <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        ${recentMatches.length > 0 ? recentMatches.map(match => this.renderMatch(match)).join('') : `
          <div class="text-center py-8">
            <div class="text-gray-400 text-4xl mb-2">🔍</div>
            <p class="text-gray-500">${i18n.t('profile.history.noMatchesFilter')}</p>
          </div>
        `}
      </div>
      ${this.filteredMatches.length > 10 ? `
        <div class="mt-6 pt-4 border-t border-gray-700">
          <button id="view-all-matches" class="w-full btn-secondary">
            ${i18n.t('profile.history.viewAll')} (${this.filteredMatches.length})
          </button>
        </div>
      ` : ''}
      ${this.renderQuickStats()}
    `;
  }

  
  private renderMatch(match: MatchHistory): string {
    const isWin = match.result === 'win';
    const resultColor = isWin ? 'text-emerald-400' : 'text-red-400';
    const bgColor = isWin ? 'bg-emerald-900/20 hover:bg-emerald-900/30' : 'bg-red-900/20 hover:bg-red-900/30';
    const borderColor = isWin ? 'border-emerald-500/50' : 'border-red-500/50';
    const iconBg = isWin ? 'bg-emerald-500' : 'bg-red-500';
    
    // Utiliser l'avatar de l'adversaire ou l'avatar par défaut
    const opponentAvatar = userService.getAvatarUrl(match.opponentAvatar) || '/images/default-avatar.png';
    
    return `
      <div class="flex items-center justify-between p-4 ${bgColor} rounded-xl border-l-4 ${borderColor} transition-all group cursor-pointer backdrop-blur-sm" data-match-id="${match.id}">
        <div class="flex items-center space-x-4">
          <div class="flex flex-col items-center">
            <div class="w-4 h-4 rounded-full ${iconBg} mb-2 shadow-lg flex items-center justify-center">
              ${isWin ? 
                '<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : 
                '<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>'
              }
            </div>
            <span class="${resultColor} font-bold text-xs uppercase tracking-wider">
              ${i18n.t(`profile.history.result.${match.result}`)}
            </span>
          </div>
          
          <!-- Nom de l'adversaire suivi de son avatar -->
          <div class="flex items-center space-x-3">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <span class="text-white font-semibold text-lg">vs ${match.opponent}</span>
                <!-- Avatar de l'adversaire après le nom -->
                <img 
                  src="${opponentAvatar}" 
                  alt="${match.opponent}" 
                  class="w-10 h-10 rounded-full bg-gray-600 object-cover border-2 border-gray-500 shadow-md"
                  onerror="this.src='/images/default-avatar.png'"
                />
                ${match.gameMode ? `
                  <span class="px-3 py-1 bg-gray-600 rounded-full text-xs text-gray-300 font-medium">
                    ${i18n.t(`game.modes.${match.gameMode}`)}
                  </span>
                ` : ''}
              </div>
              <div class="text-gray-400 text-sm flex items-center space-x-4">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  ${this.formatDate(match.date)}
                </span>
                ${match.duration ? `
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${this.formatDuration(match.duration)}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-white font-bold text-2xl mb-2 font-mono">
            ${match.score.player} - ${match.score.opponent}
          </div>
          <button class="text-blue-400 hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-900/20 hover:bg-blue-900/40 px-3 py-1 rounded-full">
            ${i18n.t('profile.history.viewDetails')} →
          </button>
        </div>
      </div>
    `;
  }


  private renderQuickStats(): string {
    if (this.filteredMatches.length === 0) return '';

    const wins = this.filteredMatches.filter(m => m.result === 'win').length;
    const total = this.filteredMatches.length;
    const winRate = Math.round((wins / total) * 100);

    return `
      <div class="mt-6 pt-6 border-t border-gray-700">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-gradient-to-br from-blue-900/40 to-blue-800/40 rounded-xl p-4 border border-blue-700/30">
            <div class="text-2xl font-bold text-blue-400 mb-1">${total}</div>
            <div class="text-xs text-gray-300 uppercase tracking-wide">${i18n.t('profile.history.stats.totalGames')}</div>
          </div>
          <div class="bg-gradient-to-br from-green-900/40 to-green-800/40 rounded-xl p-4 border border-green-700/30">
            <div class="text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'} mb-1">${winRate}%</div>
            <div class="text-xs text-gray-300 uppercase tracking-wide">${i18n.t('profile.history.stats.winRate')}</div>
          </div>
          <div class="bg-gradient-to-br from-purple-900/40 to-purple-800/40 rounded-xl p-4 border border-purple-700/30">
            <div class="text-2xl font-bold text-purple-400 mb-1">${wins}</div>
            <div class="text-xs text-gray-300 uppercase tracking-wide">${i18n.t('profile.stats.wins')}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Méthode pour appliquer les filtres
  applyFilters(resultFilter: string = 'all', modeFilter: string = 'all'): void {
    this.filteredMatches = this.matchHistory.filter(match => {
      const matchesResult = resultFilter === 'all' || 
                          (resultFilter === 'wins' && match.result === 'win') ||
                          (resultFilter === 'losses' && match.result === 'loss') ||
                          (resultFilter === 'tournament' && match.gameMode === 'tournament');
      
      const matchesMode = modeFilter === 'all' || match.gameMode === modeFilter;
      
      return matchesResult && matchesMode;
    });
  }

 // Méthode pour attacher les événements de filtrage
  bindFilterEvents(container: Element): void {
    const resultFilter = container.querySelector('#match-filter') as HTMLSelectElement;
    const modeFilter = container.querySelector('#mode-filter') as HTMLSelectElement;

    const updateFilters = () => {
      const resultValue = resultFilter?.value || 'all';
      const modeValue = modeFilter?.value || 'all';
      this.applyFilters(resultValue, modeValue);
      
      // Re-render complètement les sections stats et matchs
      const statsContainer = container.querySelector('.bg-gradient-to-br');
      const matchesSection = container.querySelector('.space-y-3')?.parentElement;
      
      if (statsContainer && matchesSection) {
        // Recréer les éléments de stats et matchs
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderVisualStats() + this.renderMatches();
        
        // Remplacer les sections
        const newStats = tempDiv.children[0];
        const newMatches = tempDiv.children[1];
        
        if (newStats) statsContainer.replaceWith(newStats);
        if (newMatches) matchesSection.replaceWith(newMatches);
      }
    };

    resultFilter?.addEventListener('change', updateFilters);
    modeFilter?.addEventListener('change', updateFilters);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return i18n.t('common.today');
    if (diffDays === 1) return i18n.t('common.yesterday');
    if (diffDays < 7) return i18n.t('common.daysAgo', { days: diffDays.toString() });
    
    return date.toLocaleDateString();
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}