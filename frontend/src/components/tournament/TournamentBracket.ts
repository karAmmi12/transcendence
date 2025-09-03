import { i18n } from '@/services/i18nService';

export class TournamentBracket {
  constructor(private bracket: any) {}

  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h3 class="text-xl font-semibold mb-6">${i18n.t('tournament.bracket.title')}</h3>
        
        <div class="tournament-bracket">
          <!-- Quarts de finale -->
          <div class="bracket-round">
            <h4 class="text-lg font-medium mb-4 text-center">${i18n.t('tournament.rounds.quarterFinals')}</h4>
            <div class="grid grid-cols-1 gap-4">
              ${this.renderMatches(this.bracket.quarterFinals)}
            </div>
          </div>

          <!-- Demi-finales -->
          <div class="bracket-round mt-8">
            <h4 class="text-lg font-medium mb-4 text-center">${i18n.t('tournament.rounds.semiFinals')}</h4>
            <div class="grid grid-cols-1 gap-4">
              ${this.renderMatches(this.bracket.semiFinals)}
            </div>
          </div>

          <!-- Finale -->
          <div class="bracket-round mt-8">
            <h4 class="text-lg font-medium mb-4 text-center">${i18n.t('tournament.rounds.final')}</h4>
            <div class="flex justify-center">
              ${this.renderMatch(this.bracket.final)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderMatches(matches: any[]): string {
    return matches.map(match => this.renderMatch(match)).join('');
  }

  private renderMatch(match: any): string {
    const player1 = match.player1?.name || i18n.t('tournament.tbd');
    const player2 = match.player2?.name || i18n.t('tournament.tbd');
    const winner = match.winner?.name;

    return `
      <div class="bracket-match bg-gray-700 rounded-lg p-4 ${match.status === 'completed' ? 'opacity-75' : ''}">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-400">Match ${match.id}</span>
          <span class="px-2 py-1 rounded text-xs font-medium ${this.getMatchStatusClasses(match.status)}">
            ${i18n.t(`tournament.matchStatus.${match.status}`)}
          </span>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between items-center p-2 rounded ${winner === player1 ? 'bg-green-900/30' : 'bg-gray-600'}">
            <span class="font-medium">${player1}</span>
            ${winner === player1 ? '<span class="text-green-400">👑</span>' : ''}
          </div>
          
          <div class="text-center text-gray-400 text-sm">VS</div>
          
          <div class="flex justify-between items-center p-2 rounded ${winner === player2 ? 'bg-green-900/30' : 'bg-gray-600'}">
            <span class="font-medium">${player2}</span>
            ${winner === player2 ? '<span class="text-green-400">👑</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  private getMatchStatusClasses(status: string): string {
    switch (status) {
      case 'pending': return 'bg-gray-600 text-gray-300';
      case 'in_progress': return 'bg-blue-600 text-blue-100';
      case 'completed': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-300';
    }
  }

  bindEvents(): void {
    // Pas d'événements spécifiques pour l'instant
    // Pourrait inclure des actions comme voir les détails d'un match
  }
}