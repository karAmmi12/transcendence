import { i18n } from '@/services/i18nService';
import { Pong3D } from '@/components/game/Pong3D/Pong3D';

export class TournamentMatch {
  private game: Pong3D | null = null;

  constructor(private match: any, private tournamentId: number) {}

  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xl font-semibold">${this.match.round}</h3>
            <p class="text-gray-400">Match ${this.match.matchNumber}</p>
          </div>
          <div class="text-right">
            <span class="px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700/50">
              ${i18n.t('tournament.currentMatch')}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-gray-700 rounded-lg p-4 text-center">
            <h4 class="text-lg font-semibold mb-2">${this.match.player1}</h4>
            <span class="text-gray-400">${i18n.t('tournament.player1')}</span>
          </div>
          
          <div class="bg-gray-700 rounded-lg p-4 text-center">
            <h4 class="text-lg font-semibold mb-2">${this.match.player2}</h4>
            <span class="text-gray-400">${i18n.t('tournament.player2')}</span>
          </div>
        </div>

        <div class="text-center">
          <button id="start-tournament-match" 
                  class="bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-lg font-medium transition-colors">
            ${i18n.t('tournament.startMatch')}
          </button>
        </div>

        <!-- Zone de jeu (cachée par défaut) -->
        <div id="tournament-game-container" class="hidden mt-6">
          <canvas id="tournament-game-canvas" class="w-full rounded-lg"></canvas>
        </div>
      </div>
    `;
  }

  bindEvents(): void {
    const startBtn = document.getElementById('start-tournament-match');
    const gameContainer = document.getElementById('tournament-game-container');
    const canvas = document.getElementById('tournament-game-canvas') as HTMLCanvasElement;

    startBtn?.addEventListener('click', () => {
      this.startMatch(gameContainer!, canvas);
    });
  }

  private startMatch(container: Element, canvas: HTMLCanvasElement): void {
    // Afficher la zone de jeu
    container.classList.remove('hidden');
    
    // Masquer le bouton de démarrage
    const startBtn = document.getElementById('start-tournament-match');
    if (startBtn) startBtn.style.display = 'none';

    // Configurer le jeu pour le tournoi
    const gameSettings = {
      player1Name: this.match.player1,
      player2Name: this.match.player2,
      scoreLimit: 5,
      ballSpeed: 1,
      paddleSpeed: 1
    };

    // Créer et démarrer le jeu
    this.game = new Pong3D('tournament-game-canvas', gameSettings, false);
    
    // Écouter la fin du match
    this.game.onGameEnd = (winner, scores, duration) => {
      this.handleMatchEnd(winner, scores, duration);
    };
  }

  private handleMatchEnd(winner: string, scores: any, duration: number): void {
    // Préparer les données du match
    const matchData = {
      tournamentId: this.tournamentId,
      matchNumber: this.match.matchNumber,
      player1: this.match.player1,
      player2: this.match.player2,
      score1: scores.player1,
      score2: scores.player2,
      duration: Math.floor(duration),
      winner
    };

    // Déclencher l'événement pour notifier la page parent
    window.dispatchEvent(new CustomEvent('matchFinished', { 
      detail: matchData 
    }));
  }
}