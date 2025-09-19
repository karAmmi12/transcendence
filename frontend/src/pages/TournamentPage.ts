import { i18n } from '@/services/i18nService';
import { tournamentService } from '@/services/tournamentService';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import { TournamentMatch as TournamentMatchComponent } from '@components/tournament/TournamentMatch';

export class TournamentPage {
  private tournament: any = null;
  private currentMatch: any = null;

  // ✅ Accepter directement les données du tournoi ou un ID
  async mount(selector: string, tournamentData?: any): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    // ✅ Si on a déjà les données du tournoi, les utiliser directement
    if (tournamentData) {
      this.tournament = tournamentData;
      this.currentMatch = this.tournament.nextMatch;
      this.render(element);
      this.bindEvents();
      return;
    }

    // ✅ Sinon, essayer de récupérer depuis l'URL (fallback)
    const pathParts = window.location.pathname.split('/');
    const tournamentId = parseInt(pathParts[pathParts.length - 1]);

    if (!tournamentId) {
      this.renderError(element, 'Tournament not found');
      return;
    }

    await this.loadTournamentData(tournamentId);
    this.render(element);
    this.bindEvents();
  }

  private async loadTournamentData(tournamentId: number): Promise<void> {
    try {
      this.tournament = await tournamentService.getTournament(tournamentId);
      this.currentMatch = this.tournament.nextMatch;
    } catch (error) {
      console.error('Failed to load tournament:', error);
    }
  }

  private render(element: Element): void {
    if (!this.tournament) {
      this.renderError(element, 'Failed to load tournament data');
      return;
    }

    const bracket = new TournamentBracket(this.tournament.bracket);

    element.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <!-- Header épuré -->
        <div class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold font-orbitron bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  ${i18n.t('tournament.title')}
                </h1>
                <p class="text-gray-400 mt-1">Tournoi #${this.tournament.id}</p>
              </div>
              <div class="text-right">
                <div class="flex items-center gap-3">
                  <span class="px-4 py-2 rounded-full text-sm font-medium ${this.getStatusClasses()}">
                    ${i18n.t(`tournament.status.${this.tournament.status}`)}
                  </span>
                  <div class="text-sm text-gray-400">
                    <div>${i18n.t('tournament.participants')}</div>
                    <div class="text-2xl font-bold text-white">${this.tournament.participants.length}/8</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="max-w-7xl mx-auto px-4 py-8">
          ${this.currentMatch ? `
            <!-- Match en cours -->
            <div class="mb-8">
              <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 p-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  ${i18n.t('tournament.currentMatch')}
                </h2>
                <div id="current-match-section">
                  ${this.renderCurrentMatch()}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Bracket organigramme -->
          <div class="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
            <div id="tournament-bracket">
              ${bracket.render()}
            </div>
          </div>

          ${this.tournament.status === 'completed' ? `
            <!-- Champion -->
            <div class="mt-8 text-center">
              <div class="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl border border-yellow-500/30 p-8">
                <h2 class="text-3xl font-bold text-yellow-400 mb-2">🏆 Champion</h2>
                <p class="text-2xl font-semibold text-white">${this.tournament.winner}</p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Attacher les événements
    bracket.bindEvents();
    this.bindMatchDetailsEvents();
  }

  private bindMatchDetailsEvents(): void {
    window.addEventListener('viewMatchDetails', (event: CustomEvent) => {
      const { matchId } = event.detail;
      this.showMatchDetails(matchId);
    });
  }

  private showMatchDetails(matchId: number): void {
    // Trouver le match correspondant
    const allMatches = [
      ...this.tournament.bracket.quarterFinals,
      ...this.tournament.bracket.semiFinals,
      this.tournament.bracket.final
    ];
    
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;

    // Créer un modal avec les détails du match
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">Détails du Match #${match.id}</h3>
          <button class="text-gray-400 hover:text-white" onclick="this.closest('.fixed').remove()">
            ✕
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-4 bg-gray-700 rounded-lg">
              <div class="font-semibold ${match.winner === match.player1 ? 'text-green-400' : 'text-gray-300'}">
                ${match.player1}
              </div>
              ${match.score1 !== undefined ? `<div class="text-2xl font-bold mt-2">${match.score1}</div>` : ''}
            </div>
            <div class="text-center p-4 bg-gray-700 rounded-lg">
              <div class="font-semibold ${match.winner === match.player2 ? 'text-green-400' : 'text-gray-300'}">
                ${match.player2}
              </div>
              ${match.score2 !== undefined ? `<div class="text-2xl font-bold mt-2">${match.score2}</div>` : ''}
            </div>
          </div>
          
          <div class="text-center">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getMatchStatusClasses(match.status)}">
              ${i18n.t(`tournament.matchStatus.${match.status}`)}
            </span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  private getMatchStatusClasses(status: string): string {
    switch (status) {
      case 'pending': return 'bg-gray-600 text-gray-300';
      case 'in_progress': return 'bg-blue-600 text-blue-100';
      case 'completed': return 'bg-green-600 text-green-100';
      default: return 'bg-gray-600 text-gray-300';
    }
  }

  private renderCurrentMatch(): string {
    if (!this.currentMatch) return '';
   

    const match = new TournamentMatchComponent(this.currentMatch, this.tournament.id, this.tournament.gameSettings);
    const html = match.render();

    setTimeout(() => {
      match.bindEvents();
    }, 50);
    return html;
  }

  private getStatusClasses(): string {
    switch (this.tournament.status) {
      case 'waiting': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
      case 'in_progress': return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
      case 'completed': return 'bg-green-900/30 text-green-400 border border-green-700/50';
      default: return 'bg-gray-900/30 text-gray-400 border border-gray-700/50';
    }
  }

  private renderError(element: Element, message: string): void {
    element.innerHTML = `
      <div class="max-w-2xl mx-auto text-center">
        <div class="bg-red-900/30 border border-red-700/50 rounded-lg p-8">
          <h2 class="text-xl font-semibold text-red-400 mb-4">${i18n.t('common.error')}</h2>
          <p class="text-gray-300 mb-6">${message}</p>
          <button onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }))" 
                  class="bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('common.goBack')}
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Écouter les événements de fin de match
    window.addEventListener('matchFinished', (event: CustomEvent) => {
      this.handleMatchFinished(event.detail);
    });

    // Rafraîchir les données du tournoi
    window.addEventListener('refreshTournament', () => {
      this.loadTournamentData(this.tournament.id).then(() => {
        const element = document.querySelector('#page-content');
        if (element) this.render(element);
      });
    });
  }

private async handleMatchFinished(matchData: any): Promise<void> {
    try {
        console.log('🏆 Processing finished match:', matchData);
        
        const result = await tournamentService.finishMatch(
            this.tournament.id,
            matchData.matchNumber,
            matchData.player1,
            matchData.player2,
            matchData.score1,
            matchData.score2,
            matchData.duration
        );

        console.log('✅ Backend response:', result);

        // ✅ Mettre à jour avec la structure correcte
        if (result.tournament) {
            this.tournament = result.tournament;
            this.currentMatch = result.tournament.nextMatch;
        }

        // Re-render la page
        const element = document.querySelector('#page-content');
        if (element) this.render(element);

        // Afficher un message approprié
        if (this.tournament.status === 'completed') {
            this.showNotification(`🏆 Tournoi terminé ! Gagnant : ${this.tournament.winner || 'Inconnu'}`, 'success');
        } else if (this.currentMatch) {
            this.showNotification(`✅ Match terminé ! Prochain match : ${this.currentMatch.round}`, 'success');
        } else {
            this.showNotification('✅ Match terminé !', 'success');
        }

    } catch (error) {
        console.error('❌ Failed to finish match:', error);
        this.showNotification('Erreur lors de la sauvegarde du match', 'error');
    }
}

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
        : 'bg-red-900/30 text-red-400 border border-red-700/50'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}