import { i18n } from '@services/i18n';
import { userService } from '@services/userService';
import { authService } from '@services/authService';
import { friendService } from '@services/friendsService';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { StatsCard } from '@components/profile/StatsCard';
import { FriendsSection } from '@components/profile/FriendsSection';
import { MatchHistoryCard } from '@components/profile/MatchHistoryCard';
import { EditProfileModal } from '@components/profile/EditProfileModal';
import type { User, MatchHistory, Friend, FriendshipStatus } from '../types/index.js';

export class ProfilePage {
  private languageListener: (() => void) | null = null;
  private user: User | null = null;
  private matchHistory: MatchHistory[] = [];
  private friends: Friend[] = [];
  private userId: string | null = null;
  private friendshipStatus: FriendshipStatus | null = null;

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    // Extraire l'ID utilisateur de l'URL si présent (ex: /profile/123)
    const path = window.location.pathname;
    const matches = path.match(/\/profile\/(.+)/);
    this.userId = matches ? matches[1] : null;

    this.destroy();
    this.loadUserData();

    // Listener pour le changement de langue
    this.languageListener = () => {
      const element = document.querySelector('#page-content');
      if (element) this.render(element);
    };
    window.addEventListener('languageChanged', this.languageListener);
  }

  private async loadUserData(): Promise<void> {
    const element = document.querySelector('#page-content');
    if (!element) return;

    this.renderLoading(element);

    try {
      // Charger les données utilisateur
      this.user = await userService.getUserProfile(this.userId);

      if (!this.user) {
        this.renderError(element, i18n.t('profile.errors.userNotFound'));
        return;
      }

      // Si c'est le profil d'un autre utilisateur, charger le statut d'amitié
      if (this.userId) {
        this.friendshipStatus = await friendService.getFriendshipStatus(parseInt(this.userId));
      }

      // Charger l'historique des matchs (pour l'instant mock data)
      this.matchHistory = this.createMockMatchHistory();

      // Charger les amis seulement pour son propre profil
      if (!this.userId) {
        this.friends = await friendService.getFriends();
      }

      this.render(element);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      this.renderError(element, i18n.t('profile.errors.loadFailed'));
    }
  }

  private openEditModal(): void {
    if (!this.user) return;

    const editModal = new EditProfileModal(this.user, (updatedUser: User) => {
      this.user = updatedUser;
      
      const element = document.querySelector('#page-content');
      if (element) {
        this.render(element);
      }
      
      // Déclencher un événement pour mettre à jour l'en-tête
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    });

    editModal.show();
  }

  private render(element: Element): void {
    if (!this.user) return;

    const isOwnProfile = !this.userId;

    // Créer les composants
    const profileHeader = new ProfileHeader(this.user, isOwnProfile);
    const statsCard = new StatsCard(this.user);
    const matchHistoryCard = new MatchHistoryCard(this.matchHistory, isOwnProfile);
    
    let friendsSection = null;
    if (isOwnProfile) {
      friendsSection = new FriendsSection(this.friends, isOwnProfile);
    }

    element.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8">
        ${profileHeader.render()}
        
        <div class="grid ${isOwnProfile ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-8">
          <!-- Colonne principale -->
          <div class="${isOwnProfile ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-8">
            ${statsCard.render()}
            ${matchHistoryCard.render()}
          </div>
          
          <!-- Sidebar -->
          <div class="space-y-8">
            ${isOwnProfile && friendsSection ? friendsSection.render() : ''}
            ${isOwnProfile ? this.renderQuickActions() : this.renderProfileActions()}
          </div>
        </div>
      </div>
    `;

    if (friendsSection) {
      friendsSection.bindEvents();
    }

    this.bindEvents();
  }

  private renderQuickActions(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4 text-primary-400">${i18n.t('profile.actions.title')}</h2>
        <div class="space-y-3">
          <button id="edit-profile" class="w-full btn-secondary text-left flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            ${i18n.t('profile.actions.editProfile')}
          </button>
          <button id="change-password" class="w-full btn-secondary text-left flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            ${i18n.t('profile.actions.changePassword')}
          </button>
          <button id="logout" class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            ${i18n.t('nav.logout')}
          </button>
        </div>
      </div>
    `;
  }

  private renderProfileActions(): string {
    if (!this.friendshipStatus) return '';

    const { isFriend, isRequestSent, isRequestReceived } = this.friendshipStatus;

    let friendButton = '';
    
    if (isFriend) {
      friendButton = `
        <button id="remove-friend" class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 01-8 0H3a2 2 0 00-2 2v6a2 2 0 002 2h2m8 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7h6m0 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m8 0v2"></path>
          </svg>
          ${i18n.t('friends.actions.remove')}
        </button>
      `;
    } else if (isRequestSent) {
      friendButton = `
        <button disabled class="w-full bg-gray-600 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          ${i18n.t('friends.status.requestSent')}
        </button>
      `;
    } else if (isRequestReceived) {
      friendButton = `
        <div class="space-y-2">
          <button id="accept-friend-request" class="w-full btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            ${i18n.t('friends.actions.accept')}
          </button>
          <button id="decline-friend-request" class="w-full btn-secondary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            ${i18n.t('friends.actions.decline')}
          </button>
        </div>
      `;
    } else {
      friendButton = `
        <button id="add-friend" class="w-full btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
          ${i18n.t('profile.actions.addFriend')}
        </button>
      `;
    }

    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="space-y-3">
          ${friendButton}
          <button id="challenge-user" class="w-full btn-secondary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            ${i18n.t('profile.actions.challenge')}
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Actions du profil personnel
    document.getElementById('edit-profile')?.addEventListener('click', () => {
      this.openEditModal();
    });

    document.getElementById('logout')?.addEventListener('click', () => {
      authService.logout();
    });

    document.getElementById('change-password')?.addEventListener('click', () => {
      console.log('Change password - TODO: Implement');
    });

    // Actions sur le profil d'un autre utilisateur
    document.getElementById('add-friend')?.addEventListener('click', async () => {
      if (!this.userId) return;
      
      try {
        const success = await friendService.sendFriendRequest(parseInt(this.userId));
        if (success) {
          this.friendshipStatus = await friendService.getFriendshipStatus(parseInt(this.userId));
          const element = document.querySelector('#page-content');
          if (element) this.render(element);
        }
      } catch (error) {
        console.error('Failed to send friend request:', error);
      }
    });

    document.getElementById('remove-friend')?.addEventListener('click', async () => {
      if (!this.userId) return;
      
      if (confirm(i18n.t('friends.confirmations.removeFriend'))) {
        try {
          const success = await friendService.removeFriend(parseInt(this.userId));
          if (success) {
            this.friendshipStatus = await friendService.getFriendshipStatus(parseInt(this.userId));
            const element = document.querySelector('#page-content');
            if (element) this.render(element);
          }
        } catch (error) {
          console.error('Failed to remove friend:', error);
        }
      }
    });

    document.getElementById('accept-friend-request')?.addEventListener('click', async () => {
      if (!this.friendshipStatus?.requestId) return;
      
      try {
        const success = await friendService.acceptFriendRequest(this.friendshipStatus.requestId);
        if (success) {
          this.friendshipStatus = await friendService.getFriendshipStatus(parseInt(this.userId!));
          const element = document.querySelector('#page-content');
          if (element) this.render(element);
        }
      } catch (error) {
        console.error('Failed to accept friend request:', error);
      }
    });

    document.getElementById('decline-friend-request')?.addEventListener('click', async () => {
      if (!this.friendshipStatus?.requestId) return;
      
      try {
        const success = await friendService.declineFriendRequest(this.friendshipStatus.requestId);
        if (success) {
          this.friendshipStatus = await friendService.getFriendshipStatus(parseInt(this.userId!));
          const element = document.querySelector('#page-content');
          if (element) this.render(element);
        }
      } catch (error) {
        console.error('Failed to decline friend request:', error);
      }
    });

    document.getElementById('challenge-user')?.addEventListener('click', () => {
      console.log('Challenge user - TODO: Implement game challenge');
    });
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

  // Simulation temporaire de l'historique des matchs
  private createMockMatchHistory(): MatchHistory[] {
    return [
      {
        id: '1',
        opponent: 'Alice',
        result: 'win',
        score: { player: 5, opponent: 3 },
        date: new Date(Date.now() - 86400000).toISOString(),
        duration: 180,
        gameMode: 'classic'
      },
      {
        id: '2',
        opponent: 'Bob',
        result: 'loss',
        score: { player: 2, opponent: 5 },
        date: new Date(Date.now() - 172800000).toISOString(),
        duration: 240,
        gameMode: 'ai'
      }
    ];
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}