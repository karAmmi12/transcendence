import { User, FriendshipStatus } from '../../types/index.js';
import { i18n } from '@/services/i18nService.js';
import { userService } from '../../services/userService.js';

export class ProfileHeader {
  constructor(
    private user: User, 
    private isOwnProfile: boolean,
    private friendshipStatus?: FriendshipStatus | null 
  ) {}

  render(): string {
    const avatarUrl = userService.getAvatarUrl(this.user.avatarUrl);
    const isGoogleUser = !!this.user.googleId;

    return `
      <div class="bg-gray-800 rounded-lg p-8 mb-8">
        <div class="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <!-- Avatar et statut -->
          <div class="relative">
            <img 
              src="${avatarUrl}"
              alt="${this.user.username}" 
              class="w-32 h-32 rounded-full bg-gray-600 object-cover border-4 border-primary-500"
              onerror="this.src='/images/default-avatar.png'"
            />
            <div class="absolute bottom-2 right-2 w-6 h-6 ${this.user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
          </div>
          
          <!-- Informations utilisateur -->
          <div class="flex-1 text-center md:text-left">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <div class="mb-4 md:mb-0">
                <h1 class="text-3xl font-bold text-white mb-2">${this.user.username}</h1>
                <p class="text-gray-400 mb-2">${this.user.email}</p>
                <div class="flex items-center justify-center md:justify-start space-x-4 text-sm text-gray-400">
                  <span class="flex items-center">
                    <div class="w-2 h-2 ${this.user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2"></div>
                    ${this.user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
                  </span>
                  ${this.user.lastLogin ? `
                    <span>${i18n.t('profile.lastLogin')}: ${new Date(this.user.lastLogin).toLocaleDateString()}</span>
                  ` : ''}
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex-shrink-0">
                ${this.isOwnProfile ? this.renderOwnProfileActions() : this.renderOtherProfileActions()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderOwnProfileActions(): string { 
    return `
      <div class="flex flex-col gap-4">
        <!-- Toggle 2FA -->
        ${!this.user.googleId ? `
          <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div class="flex flex-col">
              <span class="text-white font-medium">${i18n.t('profile.twoFactor.title')}</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="toggle-2fa" 
                class="sr-only peer" 
                ${this.user.twoFactorEnabled ? 'checked' : ''}
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ` : ''}
        
        <!-- Boutons existants -->
        <div class="flex flex-wrap gap-2 justify-center md:justify-start">
          ${!this.user.googleId ? `
          <button id="edit-profile" class="btn-primary">
            ${i18n.t('profile.actions.editProfile')}
          </button>
          <button id="change-password" class="btn-secondary">
            ${i18n.t('profile.actions.changePassword')}
          </button> ` : ''}
        </div>
      </div>
    `;
  }

  private renderOtherProfileActions(): string {
    // ✅ Gestion simplifiée si pas de friendshipStatus
    if (!this.friendshipStatus) {
      return `
        <div class="flex flex-wrap gap-2 justify-center md:justify-start">
          <button id="header-add-friend" class="btn-primary">
            ${i18n.t('profile.actions.addFriend')}
          </button>
          <button id="header-challenge-user" class="btn-secondary">
            ${i18n.t('profile.actions.challenge')}
          </button>
        </div>
      `;
    }

    const { isFriend, isRequestSent, isRequestReceived } = this.friendshipStatus;

    let friendButton = '';
    
    if (isFriend) {
      friendButton = `
        <button id="header-remove-friend" class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
          ${i18n.t('friends.actions.removeFriend')}
        </button>
      `;
    } else if (isRequestSent) {
      friendButton = `
        <button disabled class="bg-gray-600 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed">
          ${i18n.t('friends.status.requestSent')}
        </button>
      `;
    } else if (isRequestReceived) {
      friendButton = `
        <div class="flex gap-2">
          <button id="header-accept-friend-request" class="btn-primary">
            ${i18n.t('friends.actions.accept')}
          </button>
          <button id="header-decline-friend-request" class="btn-secondary">
            ${i18n.t('friends.actions.decline')}
          </button>
        </div>
      `;
    } else {
      friendButton = `
        <button id="header-add-friend" class="btn-primary">
          ${i18n.t('profile.actions.addFriend')}
        </button>
      `;
    }

    return `
      <div class="flex flex-wrap gap-2 justify-center md:justify-start">
        ${friendButton}
        <button id="header-challenge-user" class="btn-secondary">
          ${i18n.t('profile.actions.challenge')}
        </button>
      </div>
    `;
  }

  // ✅ Méthode principale pour attacher tous les événements du header
  public bindEvents(callbacks?: {
    onEditProfile?: () => void;
    onChangePassword?: () => void;
    onFriendAction?: (action: string) => Promise<void>;
    onToggle2FA?: (enabled: boolean) => Promise<void>;
  }): void {
    if (!callbacks) return;

    // ✅ Événements pour les boutons de profil personnel
    if (this.isOwnProfile) {
      document.getElementById('edit-profile')?.addEventListener('click', () => {
        callbacks.onEditProfile?.();
      });

      document.getElementById('change-password')?.addEventListener('click', () => {
        callbacks.onChangePassword?.();
      });

      // Toggle 2FA
      if (callbacks.onToggle2FA) {
        const toggle2FA = document.getElementById('toggle-2fa') as HTMLInputElement;
        toggle2FA?.addEventListener('change', async () => {
          try {
            await callbacks.onToggle2FA!(toggle2FA.checked);
          } catch (error) {
            // Revert toggle state on error
            toggle2FA.checked = !toggle2FA.checked;
          }
        });
      }
    } else {
      // ✅ Événements pour les actions sur d'autres profils
      if (callbacks.onFriendAction) {
        document.getElementById('header-add-friend')?.addEventListener('click', () => {
          callbacks.onFriendAction!('add-friend');
        });

        document.getElementById('header-remove-friend')?.addEventListener('click', () => {
          callbacks.onFriendAction!('remove-friend');
        });

        document.getElementById('header-accept-friend-request')?.addEventListener('click', () => {
          callbacks.onFriendAction!('accept-friend-request');
        });

        document.getElementById('header-decline-friend-request')?.addEventListener('click', () => {
          callbacks.onFriendAction!('decline-friend-request');
        });
      }

      document.getElementById('header-challenge-user')?.addEventListener('click', () => {
        console.log('Challenge user from header - TODO: Implement');
      });
    }
  }

  // ✅ Méthodes dépréciées - gardées pour compatibilité
  /** @deprecated Utilisez bindEvents() à la place */
  public bind2FAEvents(onToggle2FA?: (enabled: boolean) => Promise<void>): void {
    this.bindEvents({ onToggle2FA });
  }
}