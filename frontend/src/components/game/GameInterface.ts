import { i18n } from '@/services/i18nService.js';

export class GameInterface {
  constructor(
    private mode: 'local' | 'remote' | 'tournament',
    private callbacks: {
      onPause: () => void;
      onQuit: () => void;
    }
  ) {}

  render(): string {
    return `
      <!-- Header du jeu -->
      <div class="bg-gray-800/50 backdrop-blur-sm rounded-t-lg p-3 md:p-4 flex justify-between items-center border-b border-gray-700/50">
        <h2 class="text-lg md:text-xl font-bold">${this.getGameModeTitle()}</h2>
        <div class="flex gap-2 md:gap-3">
          <button id="pause-game" class="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors">
            ⏸️ <span class="hidden sm:inline">${i18n.t('common.pause')}</span>
          </button>
          <button id="quit-game" class="bg-red-600 hover:bg-red-700 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition-colors">
            <span class="hidden sm:inline">${i18n.t('game.lobby.leaveGame')}</span><span class="sm:hidden">✕</span>
          </button>
        </div>
      </div>

      <!-- Zone de jeu responsive -->
      <div class="relative bg-gray-800 rounded-b-lg overflow-hidden">
        <!-- Canvas Container avec aspect ratio préservé -->
        <div class="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800">
          <canvas id="game-canvas" 
                  class="absolute top-0 left-0 w-full h-full"
                  style="background: linear-gradient(45deg, #1a1a2e, #16213e); border-radius: 0 0 0.5rem 0.5rem;">
            ${i18n.t('common.canvasNotSupported')}
          </canvas>
          
          <!-- Game Overlay responsive -->
          ${this.renderGameOverlay()}
        </div>
        
        <!-- Game Controls -->
        ${this.renderGameControls()}
      </div>
    `;
  }

  private renderGameOverlay(): string {
    return `
      <div id="game-overlay" class="absolute inset-0 pointer-events-none">
        <!-- Overlay responsive pour les scores -->
        <div class="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex justify-between items-start">
          <!-- Score Joueur 1 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-blue-500/30 min-w-0 flex-shrink-0">
            <div id="player1-info" class="text-white">
              <div class="font-bold text-blue-400 text-xs md:text-sm truncate" id="player1-name">${i18n.t('game.score.you')} 1</div>
              <div class="text-xl md:text-3xl font-mono font-bold" id="player1-score">0</div>
            </div>
          </div>
          
          <!-- Timer central -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-gray-500/30 mx-2 min-w-0 flex-shrink-0">
            <div id="game-timer" class="text-white text-center">
              <div class="text-xs md:text-sm opacity-75 uppercase tracking-wide">${i18n.t('common.time')}</div>
              <div class="text-lg md:text-2xl font-mono font-bold">00:00</div>
            </div>
            <div class="text-xs text-center mt-1 text-gray-400 hidden md:block">
              ${this.getGameModeTitle()}
            </div>
          </div>
          
          <!-- Score Joueur 2 -->
          <div class="bg-black/60 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg border border-red-500/30 min-w-0 flex-shrink-0">
            <div id="player2-info" class="text-white text-right">
              <div class="font-bold text-red-400 text-xs md:text-sm truncate" id="player2-name">${i18n.t('game.score.you')} 2</div>
              <div class="text-xl md:text-3xl font-mono font-bold" id="player2-score">0</div>
            </div>
          </div>
        </div>
        
        <!-- Status mobile en bas (visible uniquement sur mobile) -->
        <div class="absolute bottom-2 left-2 right-2 md:hidden">
          <div class="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-center border border-gray-500/30">
            <div id="game-status-mobile" class="text-green-400 text-xs">
              ${i18n.t('game.status.waiting')}...
            </div>
            <div class="text-xs text-gray-400 mt-1">
              ${this.getGameModeTitle()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderGameControls(): string {
    return `
      <div class="p-3 md:p-4 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <!-- Desktop Controls -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:p-4 hidden md:block">
          <h4 class="text-base md:text-lg mb-3">${i18n.t('game.controls.title')}</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>${i18n.t('game.score.you')} 1:</strong> W/S ${i18n.t('common.or')} ↑/↓</div>
            <div><strong>${i18n.t('game.score.you')} 2:</strong> I/K</div>
          </div>
          <div class="mt-2 text-xs text-gray-400">
            ${i18n.t('game.controls.pause')}
          </div>
        </div>
        
        <!-- Game Status (visible sur desktop) -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:p-4 hidden md:block">
          <h4 class="text-base md:text-lg mb-3">${i18n.t('common.status')}</h4>
          <div id="game-status" class="text-green-400 text-sm">
            ${i18n.t('game.status.waiting')}...
          </div>
          <div id="game-scores" class="text-lg mt-2">0 - 0</div>
          <div id="game-timer-display" class="text-sm text-gray-300 mt-1">00:00</div>
        </div>

        <!-- Mobile Game Info (visible sur mobile) -->
        <div class="bg-gray-700/50 rounded-lg p-3 md:hidden">
          <h4 class="text-base mb-2">${i18n.t('common.gameInfo')}</h4>
          <div class="flex justify-between items-center text-sm">
            <div id="game-scores-mobile" class="font-mono">0 - 0</div>
            <div id="game-timer-mobile" class="text-gray-300">00:00</div>
          </div>
        </div>
      </div>

      <!-- Mobile Touch Controls -->
      <div id="mobile-controls" class="p-3 md:hidden">
        ${this.renderMobileControls()}
      </div>
    `;
  }

  private renderMobileControls(): string {
    return `
      <div class="bg-gray-700/50 rounded-lg p-4">
        <h4 class="text-lg mb-3 text-center">${i18n.t('game.controls.touch')}</h4>
        <div class="flex justify-between items-center">
          <div class="text-center">
            <div class="text-xs mb-2 text-blue-300 font-semibold">${i18n.t('game.score.you')} 1</div>
            <div class="flex flex-col gap-3">
              <button id="p1-up" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation" 
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p1-down" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
          
          <div class="text-center px-4 flex-1">
            <div class="text-xs text-gray-400 mb-2">${i18n.t('game.controls.instructions')}</div>
          </div>
          
          <div class="text-center">
            <div class="text-xs mb-2 text-red-300 font-semibold">${i18n.t('game.score.you')} 2</div>
            <div class="flex flex-col gap-3">
              <button id="p2-up" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↑</button>
              <button id="p2-down" class="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl touch-manipulation"
                      style="min-width: 70px; min-height: 70px; font-size: 1.8rem;">↓</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents(): void {
    const pauseBtn = document.getElementById('pause-game');
    const quitBtn = document.getElementById('quit-game');

    pauseBtn?.addEventListener('click', this.callbacks.onPause);
    quitBtn?.addEventListener('click', () => {
      if (confirm(i18n.t('common.confirmQuitGame'))) {
        this.callbacks.onQuit();
      }
    });
  }

  updatePauseButton(isPaused: boolean): void {
    const pauseBtn = document.getElementById('pause-game');
    if (!pauseBtn) return;

    if (isPaused) {
      pauseBtn.innerHTML = `▶️ ${i18n.t('common.resume')}`;
      pauseBtn.className = 'bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors';
    } else {
      pauseBtn.innerHTML = `⏸️ ${i18n.t('common.pause')}`;
      pauseBtn.className = 'bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm transition-colors';
    }
  }

  updateGameStatus(status: string, scores: string, timer: string): void {
    const statusEl = document.getElementById('game-status');
    const scoresEl = document.getElementById('game-scores');
    const timerEl = document.getElementById('game-timer-display');
    const mobileScoresEl = document.getElementById('game-scores-mobile');
    const mobileTimerEl = document.getElementById('game-timer-mobile');

    if (statusEl) statusEl.textContent = status;
    if (scoresEl) scoresEl.textContent = scores;
    if (timerEl) timerEl.textContent = timer;
    if (mobileScoresEl) mobileScoresEl.textContent = scores;
    if (mobileTimerEl) mobileTimerEl.textContent = timer;
  }

  updatePlayerNames(player1Name: string, player2Name: string): void {
    const p1NameEl = document.getElementById('player1-name');
    const p2NameEl = document.getElementById('player2-name');

    if (p1NameEl) p1NameEl.textContent = player1Name;
    if (p2NameEl) p2NameEl.textContent = player2Name;
  }

  updateScores(player1Score: number, player2Score: number): void {
    const p1ScoreEl = document.getElementById('player1-score');
    const p2ScoreEl = document.getElementById('player2-score');

    if (p1ScoreEl) p1ScoreEl.textContent = player1Score.toString();
    if (p2ScoreEl) p2ScoreEl.textContent = player2Score.toString();
  }

  updateTimer(timeString: string): void {
    const timerEl = document.getElementById('game-timer');
    if (timerEl) {
      const timeDiv = timerEl.querySelector('div:last-child');
      if (timeDiv) timeDiv.textContent = timeString;
    }
  }

  private getGameModeTitle(): string {
    switch (this.mode) {
      case 'local': return i18n.t('game.modes.local');
      case 'remote': return i18n.t('game.modes.remote');
      case 'tournament': return i18n.t('game.modes.tournament');
      default: return i18n.t('common.modeSelection');
    }
  }
}