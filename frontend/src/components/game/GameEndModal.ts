import { i18n } from '@/services/i18nService.js';
import type { GameEndStats } from '@/types/index.js';

// ==========================================
// INTERFACES
// ==========================================

// Interface locale pour GameEndModal qui est différente de celle des types globaux
export interface GameEndModalStats
{
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
  matchDuration: number;
  totalScore: number;
  gameMode: 'local' | 'remote';
  winScore: number;
}

export interface GameEndModalCallbacks
{
  onPlayAgain?: () => void;
  onBackToMenu: () => void;
  onViewStats?: () => void;
}

// ==========================================
// FONCTION UTILITAIRE
// ==========================================

// Fonction utilitaire pour convertir GameEndStats vers GameEndModalStats
export function convertToModalStats(stats: GameEndStats): GameEndModalStats
{
  return {
    winnerName: stats.winnerName || stats.winner,
    loserName: stats.loserName || stats.loser,
    winnerScore: stats.winnerScore || stats.finalScore?.winner || 0,
    loserScore: stats.loserScore || stats.finalScore?.loser || 0,
    matchDuration: stats.matchDuration || parseInt(stats.duration) || 0,
    totalScore: stats.totalScore || (stats.winnerScore || 0) + (stats.loserScore || 0),
    gameMode: (stats.gameMode === 'remote' ? 'remote' : 'local') as 'local' | 'remote',
    winScore: stats.winScore || 5
  };
}

// ==========================================
// CLASSE GAMEENDMODAL
// ==========================================

export class GameEndModal
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private element: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private stats: GameEndModalStats;
  private callbacks: GameEndModalCallbacks;
  private isVisible: boolean = false;
  private isRemoteGame: boolean = false;

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur du modal de fin de partie
   * @param stats Statistiques du match terminé
   * @param callbacks Callbacks pour les actions du modal
   */
  constructor(stats: GameEndModalStats, callbacks: GameEndModalCallbacks)
  {
    this.stats = stats;
    this.callbacks = callbacks;
    this.isRemoteGame = stats.gameMode === 'remote';
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Affiche le modal avec animation
   */
  public show(): void
  {
    this.createModal();
    this.bindEvents();

    // Animation d'ouverture
    setTimeout(() =>
    {
      if (this.modal)
      {
        this.modal.classList.remove('opacity-0');
        this.modal.classList.add('opacity-100');
        const content = this.modal.querySelector('.modal-content');
        content?.classList.remove('scale-95');
        content?.classList.add('scale-100');
      }
    }, 10);
  }

  /**
   * Ferme le modal avec animation
   */
  public close(): void
  {
    if (!this.modal) return;

    // Animation de fermeture
    this.modal.classList.remove('opacity-100');
    this.modal.classList.add('opacity-0');
    const content = this.modal.querySelector('.modal-content');
    content?.classList.remove('scale-100');
    content?.classList.add('scale-95');

    setTimeout(() =>
    {
      this.modal?.remove();
      this.modal = null;
    }, 500);
  }

  /**
   * Met à jour les statistiques affichées
   * @param newStats Nouvelles statistiques
   */
  public updateStats(newStats: GameEndModalStats): void
  {
    this.stats = newStats;
    if (this.modal)
    {
      const content = this.modal.querySelector('.modal-content');
      if (content)
      {
        content.innerHTML = this.renderModalContent().replace(/.*modal-content[^>]*>|<\/div>$/g, '');
        this.bindEvents();
      }
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Crée et ajoute le modal au DOM
   */
  private createModal(): void
  {
    // Supprimer le modal existant s'il y en a un
    this.close();

    this.modal = document.createElement('div');
    this.modal.id = 'game-end-modal';
    this.modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-500';

    this.modal.innerHTML = this.renderModalContent();
    document.body.appendChild(this.modal);
  }

  /**
   * Rend le contenu complet du modal
   */
  private renderModalContent(): string
  {
    const durationText = this.formatDuration(this.stats.matchDuration);

    return `
      <div class="modal-content bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 transform scale-95 transition-transform duration-300">
        ${this.renderHeader()}
        ${this.renderScoreSection()}
        ${this.renderStatsSection(durationText)}
        ${this.renderActionButtons()}
      </div>
    `;
  }

  /**
   * Rend l'en-tête du modal
   */
  private renderHeader(): string
  {
    return `
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">🏆</div>
        <h2 class="text-3xl font-bold text-yellow-400 mb-2">
          ${i18n.t('game.endScreen.title')}
        </h2>
        <p class="text-xl text-gray-300">
          <span class="text-green-400 font-bold">${this.stats.winnerName}</span> 
          ${i18n.t('game.endScreen.winnerText')}
        </p>
      </div>
    `;
  }

  /**
   * Rend la section des scores finaux
   */
  private renderScoreSection(): string
  {
    return `
      <div class="bg-gray-900 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-center mb-4 text-gray-300">
          ${i18n.t('game.endScreen.finalScore')}
        </h3>
        <div class="flex justify-between items-center">
          <div class="text-center flex-1">
            <div class="text-2xl font-bold ${this.stats.winnerScore > this.stats.loserScore ? 'text-green-400' : 'text-red-400'}">
              ${this.stats.winnerName}
            </div>
            <div class="text-4xl font-mono font-bold ${this.stats.winnerScore > this.stats.loserScore ? 'text-green-400' : 'text-red-400'}">
              ${this.stats.winnerScore}
            </div>
          </div>
          <div class="text-3xl text-gray-500 px-4">-</div>
          <div class="text-center flex-1">
            <div class="text-2xl font-bold ${this.stats.loserScore > this.stats.winnerScore ? 'text-green-400' : 'text-red-400'}">
              ${this.stats.loserName}
            </div>
            <div class="text-4xl font-mono font-bold ${this.stats.loserScore > this.stats.winnerScore ? 'text-green-400' : 'text-red-400'}">
              ${this.stats.loserScore}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rend la section des statistiques du match
   * @param durationText Durée formatée du match
   */
  private renderStatsSection(durationText: string): string
  {
    return `
      <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div class="bg-gray-900 rounded-lg p-3 text-center">
          <div class="text-blue-400 font-semibold">${i18n.t('game.endScreen.stats.duration')}</div>
          <div class="text-xl font-mono">${durationText}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-3 text-center">
          <div class="text-purple-400 font-semibold">${i18n.t('game.endScreen.stats.totalPoints')}</div>
          <div class="text-xl font-mono">${this.stats.totalScore}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-3 text-center">
          <div class="text-orange-400 font-semibold">${i18n.t('game.endScreen.stats.mode')}</div>
          <div class="text-sm">${this.isRemoteGame ? i18n.t('game.modes.remote') : i18n.t('game.modes.local')}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-3 text-center">
          <div class="text-pink-400 font-semibold">${i18n.t('game.endScreen.stats.winCondition')}</div>
          <div class="text-xl">${this.stats.winScore}</div>
        </div>
      </div>
    `;
  }

  /**
   * Rend les boutons d'action du modal
   */
  private renderActionButtons(): string
  {
    return `
      <div class="flex flex-col gap-3">
        ${this.callbacks.onPlayAgain ? `
          <button 
            id="play-again-btn" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🔄 ${i18n.t('game.endScreen.actions.playAgain')}
          </button>
        ` : ''}
        <button 
          id="back-to-menu-btn" 
          class="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          🏠 ${i18n.t('game.endScreen.actions.backToMenu')}
        </button>
        ${!this.isRemoteGame ? `
          <button 
            id="view-stats-btn" 
            class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            📊 ${i18n.t('game.endScreen.actions.viewStats')}
          </button>
        ` : ''}
      </div>
    `;
  }

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Attache les événements aux éléments du modal
   */
  private bindEvents(): void
  {
    if (!this.modal) return;

    const playAgainBtn = this.modal.querySelector('#play-again-btn');
    const backToMenuBtn = this.modal.querySelector('#back-to-menu-btn');
    const viewStatsBtn = this.modal.querySelector('#view-stats-btn');

    playAgainBtn?.addEventListener('click', () =>
    {
      this.callbacks.onPlayAgain?.();
      this.close();
    });

    backToMenuBtn?.addEventListener('click', () =>
    {
      this.callbacks.onBackToMenu?.();
      this.close();
    });

    viewStatsBtn?.addEventListener('click', () =>
    {
      this.callbacks.onViewStats?.();
      this.close();
    });

    // Fermer avec Escape
    const handleKeydown = (e: KeyboardEvent) =>
    {
      if (e.key === 'Escape')
      {
        this.close();
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Nettoyer l'event listener lors de la fermeture
    this.modal.addEventListener('remove', () =>
    {
      document.removeEventListener('keydown', handleKeydown);
    });
  }

  /**
   * Formate la durée en minutes:secondes
   * @param seconds Durée en secondes
   * @returns Durée formatée (MM:SS)
   */
  private formatDuration(seconds: number): string
  {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}