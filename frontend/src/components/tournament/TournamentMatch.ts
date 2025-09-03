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
          <canvas id="tournament-game-canvas" class="w-full rounded-lg" style="height: 400px;"></canvas>
        </div>
      </div>
    `;
  }

  bindEvents(): void {
    // Utiliser setTimeout pour s'assurer que les éléments sont dans le DOM
    setTimeout(() => {
      const startBtn = document.getElementById('start-tournament-match');
      const gameContainer = document.getElementById('tournament-game-container');
      const canvas = document.getElementById('tournament-game-canvas') as HTMLCanvasElement;

      console.log('🔍 Binding tournament match events:', { startBtn, gameContainer, canvas });

      if (startBtn && gameContainer && canvas) {
        startBtn.addEventListener('click', () => {
          console.log('🎮 Start tournament match clicked!');
          this.startMatch(gameContainer, canvas);
        });
      } else {
        console.error('❌ Tournament match elements not found:', { startBtn, gameContainer, canvas });
      }
    }, 100);
  }

  private startMatch(container: Element, canvas: HTMLCanvasElement): void {
    console.log('🚀 Starting tournament match...');
    
    // Afficher la zone de jeu
    container.classList.remove('hidden');
    
    // Masquer le bouton de démarrage
    const startBtn = document.getElementById('start-tournament-match');
    if (startBtn) startBtn.style.display = 'none';

    // S'assurer que le canvas a des dimensions correctes
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight || 400;

    // Configurer le jeu pour le tournoi
    const gameSettings = {
      player1Name: this.match.player1,
      player2Name: this.match.player2,
      winScore: 5,
      ballSpeed: 'medium' as 'slow' | 'medium' | 'fast',
      enableEffects: false
    };
    
    console.log('🎮 Game settings:', gameSettings);

    try {
      // Créer l'instance de jeu
      this.game = new Pong3D('tournament-game-canvas', gameSettings, false);
      
      // ✅ CONFIGURER LE CALLBACK AVANT DE DÉMARRER
      this.game.onGameEnd = (winner, scores, duration) => {
        console.log('🏁 Tournament match ended via callback:', { winner, scores, duration });
        this.handleMatchEnd(winner, scores, duration);
      };

      // ✅ Démarrer le jeu après configuration du callback
      setTimeout(() => {
        if (this.game) {
          console.log('🚀 Starting Pong3D game...');
          this.game.startGame();
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Failed to start tournament match:', error);
    }
  }

  private handleMatchEnd(winner: string, scores: any, duration: number): void {
    console.log('🏆 Tournament match ended, processing results...');
    
    // Afficher une notification temporaire de fin de match
    this.showMatchEndNotification(winner, scores);
    
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

  // ✅ Nouvelle méthode pour afficher une notification de fin de match
  private showMatchEndNotification(winner: string, scores: any): void {
    const gameContainer = document.getElementById('tournament-game-container');
    if (!gameContainer) return;

    // Créer une overlay de résultats
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-lg';
    overlay.innerHTML = `
      <div class="text-center p-8">
        <h3 class="text-2xl font-bold text-green-400 mb-4">🏆 Match Terminé !</h3>
        <div class="text-xl mb-4">
          <span class="font-semibold text-white">${winner}</span> remporte le match !
        </div>
        <div class="text-lg text-gray-300 mb-6">
          Score final : ${scores.player1} - ${scores.player2}
        </div>
        <div class="text-blue-400 font-medium">
          Passage au match suivant...
        </div>
      </div>
    `;

    // Positionner l'overlay correctement
    gameContainer.style.position = 'relative';
    gameContainer.appendChild(overlay);

    // Supprimer l'overlay après 3 secondes
    setTimeout(() => {
      overlay.remove();
    }, 3000);
  }
}