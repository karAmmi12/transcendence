import { i18n } from '@services/i18n';
import { userService } from '@services/userService';
import { authService } from '@services/authService';
import { friendService } from '@services/friendsService';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { StatsCard } from '@components/profile/StatsCard';
import { FriendsSection } from '@components/profile/FriendsSection';
import { MatchHistoryCard } from '@components/profile/MatchHistoryCard';
import { EditProfileModal } from '@components/profile/EditProfileModal';
import { ChangePasswordModal } from '@components/profile/ChangePasswordModal';
import { QuickActionsCard, type ActionCallbacks } from '@components/profile/QuickActionsCard';
import { ProfileLayout, type ProfileComponents } from '@components/profile/ProfileLayout';
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

      this.friends = await friendService.getFriends();

      // Si c'est le profil d'un autre utilisateur, charger le statut d'amitié
      if (this.userId) {
        this.friendshipStatus = this.calculateFriendshipStatus(parseInt(this.userId));
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

  private calculateFriendshipStatus(userId: number): FriendshipStatus {
    // Vérifier si l'utilisateur est dans la liste d'amis
    const isFriend = this.friends.some(friend => friend.id === userId);

    // Pour l'instant, on n'a pas de système de demandes d'amis implémenté
    // Donc on retourne un statut simple : ami ou pas ami
    return {
      isFriend,
      isPending: false,
      isRequestSent: false,
      isRequestReceived: false
    };
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

  private openChangePasswordModal(): void 
  {
    if (!this.user) return;

    const changePasswordModal = new ChangePasswordModal(this.user, () => {
      // Callback après changement de mot de passe
      alert(i18n.t('profile.changePassword.success'));
      // Optionnel : rediriger vers la page de profil ou recharger les données
      const element = document.querySelector('#page-content');
      if (element) {
        this.render(element);
      }
    });
    changePasswordModal.show();
  }

  private render(element: Element): void {
    if (!this.user) return;

    const isOwnProfile = !this.userId;

    // Créer les composants
    const profileHeader = new ProfileHeader(this.user, isOwnProfile, this.friendshipStatus);
    const statsCard = new StatsCard(this.user);
    const matchHistoryCard = new MatchHistoryCard(this.matchHistory, isOwnProfile);
    
    const components: ProfileComponents = {
      header: profileHeader,
      stats: statsCard,
      history: matchHistoryCard
    };

    // Ajouter les composants spécifiques au profil personnel
    if (isOwnProfile) {
      components.friends = new FriendsSection(this.friends, isOwnProfile);
      
      // Créer les callbacks pour QuickActionsCard
      const actionCallbacks: ActionCallbacks = {
        onEditProfile: () => this.openEditModal(),
        onLogout: () => authService.logout(),
        onChangePassword: () => this.openChangePasswordModal()
      };
      
      components.actions = new QuickActionsCard(actionCallbacks);
    }

    // Créer et rendre le layout
    const layout = new ProfileLayout(isOwnProfile, components);
    element.innerHTML = layout.render();

    // Attacher les événements
    layout.bindEvents(this.handleFriendAction.bind(this));
  }

  private async handleFriendAction(action: string): Promise<void> {
    if (!this.userId) return;

    try {
      let success = false;
      
      switch (action) {
        case 'add-friend':
          success = await friendService.sendFriendRequest(parseInt(this.userId));
          break;
        case 'remove-friend':
          if (confirm(i18n.t('friends.confirmations.removeFriend'))) {
            success = await friendService.removeFriend(parseInt(this.userId));
          }
          break;
        case 'accept-friend-request':
          // TODO: Implémenter quand le système de demandes sera ajouté
          console.log('Accept friend request - TODO');
          break;
        case 'decline-friend-request':
          // TODO: Implémenter quand le système de demandes sera ajouté
          console.log('Decline friend request - TODO');
          break;
      }

      if (success) {
        // ✅ Recharger les données et recalculer le statut
        this.friends = await friendService.getFriends();
        this.friendshipStatus = this.calculateFriendshipStatus(parseInt(this.userId));
        
        const element = document.querySelector('#page-content');
        if (element) this.render(element);
      }
    } catch (error) {
      console.error('Failed to perform friend action:', error);
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