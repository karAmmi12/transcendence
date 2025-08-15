import { User } from '../../types/index.js';
import { i18n } from '@services/i18n';
import { userService } from '../../services/userService.js';

export class ProfileHeader {
  private user: User;
  private isOwnProfile: boolean;

  constructor(user: User, isOwnProfile: boolean = false) {
    this.user = user;
    this.isOwnProfile = isOwnProfile;
  }

  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
          ${this.renderAvatar()}
          ${this.renderUserInfo()}
        </div>
      </div>
    `;
  }

  private renderAvatar(): string {
    const avatarUrl = userService.getAvatarUrl(this.user.avatar_url);
    
    return `
      <div class="relative group">
        <img 
          src="${avatarUrl}" 
          alt="${this.user.username}" 
          class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary-500 transition-transform hover:scale-105 object-cover"
          onerror="this.src='/images/default-avatar.png'"
        />
        ${this.user.isOnline ? '<div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>' : ''}
        ${this.isOwnProfile ? `
          <button id="change-avatar" class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" title="${i18n.t('profile.actions.changeAvatar')}">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }

  private renderUserInfo(): string {
    return `
      <div class="flex-1 text-center md:text-left">
        <h1 class="text-3xl font-bold mb-2">${this.user.username}</h1>
        <p class="text-gray-400 mb-4">${this.user.email}</p>
        
        <div class="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
          <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            ${this.user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
          </span>
          ${this.user.stats ? `
            <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              ${i18n.t('profile.stats.ranking')}: #${this.user.stats.rank || 'N/A'}
            </span>
          ` : ''}
        </div>

        ${this.isOwnProfile ? this.renderOwnProfileActions() : this.renderOtherProfileActions()}
      </div>
    `;
  }

  private renderOwnProfileActions(): string {
    return `
      <div class="flex flex-wrap gap-2 justify-center md:justify-start">
        <button id="edit-profile" class="btn-primary">
          ${i18n.t('profile.actions.editProfile')}
        </button>
        <button id="change-password" class="btn-secondary">
          ${i18n.t('profile.actions.changePassword')}
        </button>
      </div>
    `;
  }

  private renderOtherProfileActions(): string {
    return `
      <div class="flex flex-wrap gap-2 justify-center md:justify-start">
        <button id="add-friend" class="btn-primary">
          ${i18n.t('profile.actions.addFriend')}
        </button>
        <button id="challenge-user" class="btn-secondary">
          ${i18n.t('profile.actions.challenge')}
        </button>
      </div>
    `;
  }
}