import { i18n } from '@/services/i18nService';
import { tournamentService } from '@/services/tournamentService';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import { TournamentMatch } from '@/components/tournament/TournamentMatch';
// import { TournamentStats } from '@/components/tournament/TournamentStats';

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
    // const stats = new TournamentStats(this.tournament);

    element.innerHTML = `
      <div class="max-w-7xl mx-auto px-4">
        <div class="mb-8">
          <h1 class="text-3xl font-bold mb-4">${i18n.t('tournament.title')}</h1>
          <div class="bg-gray-800 rounded-lg p-6 mb-6">
            ${this.renderTournamentHeader()}
          </div>
        </div>

        ${this.currentMatch ? `
          <div class="mb-8">
            <div id="current-match-section">
              ${this.renderCurrentMatch()}
            </div>
          </div>
        ` : ''}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <div id="tournament-bracket">
              ${bracket.render()}
            </div>
          </div>
       
      </div>
    `;

    // Attacher les événements des composants
    bracket.bindEvents();
    // stats.bindEvents();
  }

  private renderTournamentHeader(): string {
    return `
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold mb-2">${i18n.t('tournament.status.title')}</h2>
          <span class="px-3 py-1 rounded-full text-sm font-medium ${this.getStatusClasses()}">
            ${i18n.t(`tournament.status.${this.tournament.status}`)}
          </span>
        </div>
        <div class="text-right">
          <p class="text-gray-400 text-sm">${i18n.t('tournament.participants')}</p>
          <p class="text-2xl font-bold">${this.tournament.participants.length}/8</p>
        </div>
      </div>
    `;
  }

  private renderCurrentMatch(): string {
    if (!this.currentMatch) return '';

    const match = new TournamentMatch(this.currentMatch, this.tournamentId);
    return match.render();
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
      this.loadTournamentData().then(() => {
        const element = document.querySelector('#page-content');
        if (element) this.render(element);
      });
    });
  }

  private async handleMatchFinished(matchData: any): Promise<void> {
    try {
      // ✅ Utiliser l'ID depuis les données du tournoi
      const result = await tournamentService.finishMatch(
        this.tournament.id,
        matchData.matchNumber,
        matchData.player1,
        matchData.player2,
        matchData.score1,
        matchData.score2,
        matchData.duration
      );

      // Mettre à jour les données locales
      this.tournament = result.tournament;
      this.currentMatch = result.tournament.nextMatch;

      // Re-render la page
      const element = document.querySelector('#page-content');
      if (element) this.render(element);

      this.showNotification('Match terminé avec succès !', 'success');

    } catch (error) {
      console.error('Failed to finish match:', error);
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