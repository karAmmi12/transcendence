import { i18n } from '@/services/i18nService.js';
import { userService } from '@services/userService';
import { authService } from '@services/authService';
import { friendService } from '@services/friendsService';
import { twoFactorService } from '@services/twoFactorService';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { StatsCard } from '@components/profile/StatsCard';
import { FriendsSection } from '@components/profile/FriendsSection';
import { MatchHistoryCard } from '@components/profile/MatchHistoryCard';
import { EditProfileModal } from '@components/profile/EditProfileModal';
import { ChangePasswordModal } from '@components/profile/ChangePasswordModal';
import { ThemeSelectionModal } from '@components/profile/ThemeSelectionModal';
import { TwoFactorModal } from '@components/auth/TwoFactorModal';
import { QuickActionsCard, type ActionCallbacks } from '@components/profile/QuickActionsCard';

import { ProfileLayout, type ProfileComponents } from '@components/profile/ProfileLayout';
import type { User, MatchHistory, Friend, FriendshipStatus } from '../types/index.js';

export class ProfilePage {
  private languageListener: (() => void) | null = null;
  private friendsUpdateListener: (() => void) | null = null;

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

    // ✅ Écouter les mises à jour des amis
    this.friendsUpdateListener = async () => {
      await this.refreshFriendsData();
    };
    window.addEventListener('friendsUpdated', this.friendsUpdateListener);
  }

  private async refreshFriendsData(): Promise<void> {
    try {
      // Recharger les données des amis
      this.friends = await friendService.getFriends();
      
      // Recalculer le statut d'amitié si on regarde le profil d'un autre utilisateur
      if (this.userId) {
        this.friendshipStatus = this.calculateFriendshipStatus(parseInt(this.userId));
      }
      
      // Re-render la page
      const element = document.querySelector('#page-content');
      if (element) {
        this.render(element);
      }
      
    } catch (error) {
      console.error('Failed to refresh friends data:', error);
    }
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
        this.friendshipStatus = this.calculateFriendshipStatus(parseInt(this.userId));
      }

      // ✅ Charger l'historique des matchs et les amis seulement pour son propre profil
      if (!this.userId) {
        this.matchHistory = await userService.getMatchHistory(this.userId);
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
    return { isFriend };
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

  private openChangePasswordModal(): void {
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

  private openThemeModal(): void {
    if (!this.user) return;

    const themeModal = new ThemeSelectionModal(this.user, (newTheme: string) => {
      // Callback après changement de thème
      if (this.user) {
        this.user.theme = newTheme;
      }
      
      const element = document.querySelector('#page-content');
      if (element) {
        this.render(element);
      }
      
      // Notification de succès
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium bg-green-600 transform translate-x-full transition-transform duration-300';
      notification.textContent = i18n.t('profile.themes.messages.saved');
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 10);
      
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    });

    themeModal.show();
  }

  private async handleToggle2FA(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        // Activer 2FA - envoyer le code par email
        const result = await twoFactorService.enable2FA();
        
        if (result.success) {
          // Ouvrir le modal de vérification
          const modal = new TwoFactorModal(
            'enable',
            () => {
              // Success callback - actualiser les données utilisateur
              if (this.user) {
                this.user.twoFactorEnabled = true;
              }
              const element = document.querySelector('#page-content');
              if (element) {
                this.render(element);
              }
              alert(i18n.t('profile.twoFactor.messages.enabled'));
            },
            () => {
              // Cancel callback - remettre le toggle à false
              const toggle = document.getElementById('toggle-2fa') as HTMLInputElement;
              if (toggle) toggle.checked = false;
            }
          );
          modal.show();
        } else {
          throw new Error(result.message);
        }
      } else {
        // Désactiver 2FA - demander d'abord le code
        const result = await twoFactorService.disable2FA(); // Envoyer un code pour confirmer
        
        if (result.success) {
          const modal = new TwoFactorModal(
            'disable',
            () => {
              // Success callback - actualiser les données utilisateur
              if (this.user) {
                this.user.twoFactorEnabled = false;
              }
              const element = document.querySelector('#page-content');
              if (element) {
                this.render(element);
              }
              alert(i18n.t('profile.twoFactor.messages.disabled'));
            },
            () => {
              // Cancel callback - remettre le toggle à true
              const toggle = document.getElementById('toggle-2fa') as HTMLInputElement;
              if (toggle) toggle.checked = true;
            }
          );
          modal.show();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error('2FA toggle error:', error);
      alert((error as Error).message);
      throw error; // Permet au ProfileHeader de revert le toggle
    }
  }

  private render(element: Element): void {
    if (!this.user) return;

    const isOwnProfile = !this.userId;

    // Créer les composants
    const profileHeader = new ProfileHeader(this.user, isOwnProfile, this.friendshipStatus);
    const statsCard = new StatsCard(this.user);
    
    const components: ProfileComponents = {
      header: profileHeader,
      stats: statsCard
    };

    // Ajouter les composants spécifiques au profil personnel
    if (isOwnProfile) {
      components.history = new MatchHistoryCard(this.matchHistory, isOwnProfile);
      components.friends = new FriendsSection(this.friends, isOwnProfile);
    }

    // Créer et rendre le layout
    const layout = new ProfileLayout(isOwnProfile, components);
    element.innerHTML = layout.render();

    if (components.history) {
      components.history.bindFilterEvents(element);
    }

    // Attacher les événements
    this.bindEvents(components, isOwnProfile);
  }

  private bindEvents(components: any, isOwnProfile: boolean): void {
    if (isOwnProfile) {
      // ✅ Utiliser la nouvelle méthode bindEvents unifiée
      components.header.bindEvents({
        onEditProfile: () => this.openEditModal(),
        onChangePassword: () => this.openChangePasswordModal(),
        onManageThemes: () => this.openThemeModal(), 
        onToggle2FA: (enabled: boolean) => this.handleToggle2FA(enabled)
      });

      if (components.friends) {
        components.friends.bindEvents();
      }

      
    } else {
      // Pour les autres profils
      components.header.bindEvents({
        onFriendAction: async (action: string) => {
          await this.handleFriendAction(action);
        }
      });
    }
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

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }

    // ✅ Nettoyer le listener des amis
    if (this.friendsUpdateListener) {
      window.removeEventListener('friendsUpdated', this.friendsUpdateListener);
      this.friendsUpdateListener = null;
    }
  }
}