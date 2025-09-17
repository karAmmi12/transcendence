import { User, FriendshipStatus } from '../../types/index.js';
import { i18n } from '@/services/i18nService.js';
import { userService } from '../../services/userService.js';
import { ThemeSelectionModal } from './ThemeSelectionModal.js';


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
      <div class="bg-gray-800 rounded-lg p-6 md:p-8 mb-8">
        <div class="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
          <!-- Avatar et statut -->
          <div class="relative flex-shrink-0">
            <img 
              src="${avatarUrl}"
              alt="${this.user.username}" 
              class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-600 object-cover border-4 border-primary-500"
              onerror="this.src='/images/default-avatar.png'"
            />
            <div class="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-5 h-5 md:w-6 md:h-6 ${this.user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
          </div>
          
          <!-- Informations utilisateur et actions -->
          <div class="flex-1 w-full text-center lg:text-left">
            <div class="flex flex-col space-y-4">
              <!-- Informations de base -->
              <div>
                <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">${this.user.username}</h1>
                <p class="text-gray-400 mb-3">${this.user.email}</p>
                <div class="flex items-center justify-center lg:justify-start space-x-4 text-sm text-gray-400 flex-wrap gap-2">
                  <span class="flex items-center">
                    <div class="w-2 h-2 ${this.user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2"></div>
                    ${this.user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
                  </span>
                  ${this.user.lastLogin ? `
                    <span class="hidden sm:inline">${i18n.t('profile.lastLogin')}: ${new Date(this.user.lastLogin).toLocaleDateString()}</span>
                  ` : ''}
                </div>
              </div>
              
              <!-- Actions -->
              <div class="w-full">
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
      <div class="space-y-4">
        <!-- Toggle 2FA -->
        ${!this.user.googleId ? `
          <div class="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
            <div class="flex flex-col">
              <span class="text-white font-medium text-sm md:text-base">${i18n.t('profile.twoFactor.title')}</span>
              <span class="text-gray-400 text-xs mt-1">${i18n.t('profile.twoFactor.description')}</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="toggle-2fa" 
                class="sr-only peer" 
                ${this.user.twoFactorEnabled ? 'checked' : ''}
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ` : ''}
        
        <!-- Boutons d'action -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button id="edit-profile" class="btn-primary w-full py-3 px-4 text-sm font-medium flex items-center justify-center">
            <i class="fas fa-edit mr-2"></i>
            ${i18n.t('profile.actions.editProfile')}
          </button>
          
          <button id="manage-themes" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors w-full flex items-center justify-center text-sm">
            <i class="fas fa-palette mr-2"></i>
            ${i18n.t('profile.themes.manageThemes')}
          </button>
          
          ${!this.user.googleId ? `
            <button id="change-password" class="btn-secondary w-full py-3 px-4 text-sm font-medium flex items-center justify-center">
              <i class="fas fa-key mr-2"></i>
              ${i18n.t('profile.actions.changePassword')}
            </button>
          ` : ''}
        </div>
        
        ${this.user.googleId ? `
          <div class="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div class="flex items-center text-blue-400 text-sm">
              <i class="fab fa-google mr-2"></i>
              <span>${i18n.t('profile.googleAccount')}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderOtherProfileActions(): string {
    const { isFriend } = this.friendshipStatus;
    // ✅ Gestion simplifiée si pas de friendshipStatus
    if (!this.friendshipStatus) {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
          <button id="header-add-friend" class="btn-primary w-full py-3 px-4 text-sm font-medium flex items-center justify-center">
            <i class="fas fa-user-plus mr-2"></i>
            ${i18n.t('profile.actions.addFriend')}
          </button>
          <button id="header-challenge-user" class="btn-secondary w-full py-3 px-4 text-sm font-medium flex items-center justify-center">
            <i class="fas fa-gamepad mr-2"></i>
            ${i18n.t('profile.actions.challenge')}
          </button>
        </div>
      `;
    }


    let friendButton = '';
    
    if (isFriend) {
      friendButton = `
        <button id="header-remove-friend" class="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors w-full flex items-center justify-center text-sm">
          <i class="fas fa-user-minus mr-2"></i>
          ${i18n.t('friends.actions.removeFriend')}
        </button>
      `;
    } else {
      friendButton = `
        <button id="header-add-friend" class="btn-primary w-full py-3 px-4 text-sm font-medium flex items-center justify-center">
          <i class="fas fa-user-plus mr-2"></i>
          ${i18n.t('profile.actions.addFriend')}
        </button>
      `;
    }

    return `
      <div class="grid grid-cols-1 sm:grid-cols-1 gap-3 max-w-md mx-auto lg:mx-0">
        ${friendButton}
      </div>
    `;
  }


  // ✅ Méthode principale pour attacher tous les événements du header
  public bindEvents(callbacks?: {
    onEditProfile?: () => void;
    onChangePassword?: () => void;
    onManageThemes?: () => void;
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

      document.getElementById('manage-themes')?.addEventListener('click', () => {
        callbacks.onManageThemes?.();
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