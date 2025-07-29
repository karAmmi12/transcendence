import { i18n } from '@services/i18n';
import { authService } from '@services/auth';
import type { User, MatchHistory } from '../types/index.js';

export class ProfilePage {
  private languageListener: (() => void) | null = null;
  private user: User | null = null;
  private matchHistory: MatchHistory[] = [];
  private userId: string | null = null; // Pour afficher le profil d'un autre utilisateur

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    // Extraire l'ID utilisateur de l'URL si présent (ex: /profile/123)
    const path = window.location.pathname;
    const matches = path.match(/\/profile\/(.+)/);
    this.userId = matches ? matches[1] : null;

    this.loadUserData();

    // Nettoie l'ancien listener si besoin
    this.destroy();

    // Ajoute le listener pour le changement de langue
    this.languageListener = () => {
      this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);
  }

  private async loadUserData(): Promise<void> {
    const element = document.querySelector('#page-content');
    if (!element) return;

    // Afficher un état de chargement
    this.renderLoading(element);

    try {
      // Charger les données utilisateur
      this.user = await authService.getUserProfile(this.userId);
      this.matchHistory = await authService.getMatchHistory(this.userId);

      if (!this.user) {
        this.renderError(element, i18n.t('profile.errors.userNotFound'));
        return;
      }

      this.render(element);
    } catch (error) {
      this.renderError(element, i18n.t('profile.errors.loadFailed'));
    }
  }

  private renderLoading(element: Element): void {
    element.innerHTML = `
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span class="ml-4 text-gray-300">${i18n.t('common.loading')}</span>
      </div>
    `;
  }

  private renderError(element: Element, message: string): void {
    element.innerHTML = `
      <div class="text-center py-16">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold mb-4 text-red-400">${i18n.t('common.error')}</h2>
        <p class="text-gray-300 mb-6">${message}</p>
        <button id="back-home" class="btn-primary">
          ${i18n.t('common.back')}
        </button>
      </div>
    `;

    document.getElementById('back-home')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
    });
  }

  private render(element: Element): void {
    if (!this.user) return;

    const isOwnProfile = !this.userId || this.userId === this.user.id;

    element.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <!-- Header du profil -->
        <div class="bg-gray-800 rounded-lg p-8 mb-8">
          <div class="flex items-center space-x-6">
            <div class="relative">
              <img 
                src="${this.user.avatar || '/default-avatar.png'}" 
                alt="${this.user.username}" 
                class="w-24 h-24 rounded-full border-4 border-primary-500"
              />
              ${this.user.isOnline ? '<div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>' : ''}
            </div>
            
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-white mb-2">${this.user.username}</h1>
              <p class="text-gray-400 mb-2">${i18n.t('profile.joinedOn')} ${new Date(this.user.createdAt).toLocaleDateString()}</p>
              ${this.user.lastLogin ? `<p class="text-gray-400">${i18n.t('profile.lastLogin')} ${new Date(this.user.lastLogin).toLocaleDateString()}</p>` : ''}
              ${isOwnProfile ? `<button id="edit-profile" class="mt-4 btn-secondary">${i18n.t('profile.editProfile')}</button>` : ''}
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Statistiques -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-6 text-primary-400">${i18n.t('profile.stats.title')}</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-400">${this.user.stats.wins}</div>
                <div class="text-gray-400">${i18n.t('profile.stats.gamesWon')}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-400">${this.user.stats.losses}</div>
                <div class="text-gray-400">${i18n.t('profile.stats.gamesLost')}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-400">${this.user.stats.totalGames}</div>
                <div class="text-gray-400">${i18n.t('profile.stats.gamesPlayed')}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-400">${this.user.stats.winRate}%</div>
                <div class="text-gray-400">${i18n.t('profile.stats.winRate')}</div>
              </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-gray-700">
              <div class="flex justify-between">
                <span class="text-gray-400">${i18n.t('profile.stats.ranking')}</span>
                <span class="text-white font-bold">#${this.user.stats.rank}</span>
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-gray-400">${i18n.t('profile.stats.currentStreak')}</span>
                <span class="text-white font-bold">${this.user.stats.currentStreak}</span>
              </div>
            </div>
          </div>

          <!-- Historique des matchs -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-6 text-primary-400">${i18n.t('profile.history.title')}</h2>
            <div class="space-y-3 max-h-64 overflow-y-auto">
              ${this.matchHistory.length > 0 
                ? this.matchHistory.slice(0, 5).map(match => `
                    <div class="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 rounded-full ${match.result === 'win' ? 'bg-green-500' : 'bg-red-500'}"></div>
                        <span class="text-white">${match.opponent}</span>
                      </div>
                      <div class="text-right">
                        <div class="text-white font-bold">${match.score.player} - ${match.score.opponent}</div>
                        <div class="text-gray-400 text-sm">${new Date(match.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  `).join('')
                : `<p class="text-gray-400 text-center py-8">${i18n.t('profile.history.noGames')}</p>`
              }
            </div>
            ${this.matchHistory.length > 5 ? `
              <button id="view-all-matches" class="w-full mt-4 btn-secondary">
                ${i18n.t('profile.history.viewAll')}
              </button>
            ` : ''}
          </div>
        </div>

        ${isOwnProfile ? `
          <!-- Actions du profil -->
          <div class="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-bold mb-4 text-primary-400">${i18n.t('profile.actions.title')}</h2>
            <div class="flex space-x-4">
              <button id="change-avatar" class="btn-secondary">${i18n.t('profile.actions.changeAvatar')}</button>
              <button id="change-password" class="btn-secondary">${i18n.t('profile.actions.changePassword')}</button>
              <button id="logout" class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                ${i18n.t('nav.logout')}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Actions du profil
    document.getElementById('edit-profile')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/settings' }));
    });

    document.getElementById('logout')?.addEventListener('click', () => {
      authService.logout();
    });

    document.getElementById('view-all-matches')?.addEventListener('click', () => {
      // Ouvrir une modal ou naviguer vers une page dédiée
      console.log('View all matches');
    });

    document.getElementById('change-avatar')?.addEventListener('click', () => {
      // Ouvrir un modal de changement d'avatar
      console.log('Change avatar');
    });

    document.getElementById('change-password')?.addEventListener('click', () => {
      // Ouvrir un modal de changement de mot de passe
      console.log('Change password');
    });
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}
