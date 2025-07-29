import { PongGame } from '../components/PongGame.js';
import { authService } from '../services/auth.js';
import { i18n } from '../services/i18n.js';

export class GamePage {
  private pongGame: PongGame | null = null;

  async mount(selector: string): Promise<void> {
    const element = document.querySelector(selector);
    if (!element) return;

    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
      return;
    }

    element.innerHTML = `
      <div class="min-h-screen bg-gray-900 text-white">
        <div class="container mx-auto px-4 py-8">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold font-game mb-4">
              ${i18n.t('game.title')}
            </h1>
            <div id="game-message" class="text-xl text-blue-400 mb-4 hidden">
              ${i18n.t('game.lobby.waitingForPlayer')}
            </div>
          </div>

          <div class="flex justify-center mb-8">
            <div class="relative">
              <canvas id="pong-canvas" class="border-2 border-white rounded-lg"></canvas>
            </div>
          </div>

          <div class="text-center space-y-4">
            <div class="bg-gray-800 p-4 rounded-lg inline-block">
              <h3 class="text-lg font-semibold mb-2">${i18n.t('game.controls.instructions')}</h3>
              <p class="text-gray-300">${i18n.t('game.controls.pause')}</p>
            </div>
            
            <div class="space-x-4">
              <button id="start-game-btn" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                ${i18n.t('game.lobby.startGame')}
              </button>
              <button id="leave-game-btn" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                ${i18n.t('game.lobby.leaveGame')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(currentUser.id);
  }

  private bindEvents(playerId: string): void {
    const startBtn = document.getElementById('start-game-btn');
    const leaveBtn = document.getElementById('leave-game-btn');

    startBtn?.addEventListener('click', () => {
      this.startGame(playerId);
    });

    leaveBtn?.addEventListener('click', () => {
      this.leaveGame();
    });

    // Auto-start pour le développement
    setTimeout(() => this.startGame(playerId), 1000);
  }

  private startGame(playerId: string): void {
    if (this.pongGame) {
      this.pongGame.disconnect();
    }

    this.pongGame = new PongGame('pong-canvas', playerId);
    this.pongGame.connect();

    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.textContent = 'Connecting...';
      (startBtn as HTMLButtonElement).disabled = true;
    }
  }

  private leaveGame(): void {
    if (this.pongGame) {
      this.pongGame.disconnect();
      this.pongGame = null;
    }

    window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
  }

  destroy(): void {
    if (this.pongGame) {
      this.pongGame.disconnect();
    }
  }
}