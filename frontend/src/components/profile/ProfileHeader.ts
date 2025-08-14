import { i18n } from '@services/i18n';
import type { User } from '../../types/index.js';

export class ProfileHeader {
  constructor(private user: User, private isOwnProfile: boolean) {}
  
  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-8 mb-8">
        <div class="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          ${this.renderAvatar()}
          ${this.renderUserInfo()}
          ${this.renderActions()}
        </div>
      </div>
    `;
  }

  private renderAvatar(): string {
    return `
      <div class="relative group">
        <img 
          src="${this.user.avatar_url || '/images/default-avatar.png'}" 
          alt="${this.user.username}" 
          class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary-500 transition-transform hover:scale-105"
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
    const joinedDate = this.user.createdAt ? new Date(this.user.createdAt).toLocaleDateString() : '';
    const lastLoginDate = this.user.lastLogin ? new Date(this.user.lastLogin).toLocaleDateString() : '';
    
    return `
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-white mb-2">${this.user.username}</h1>
        ${this.user.createdAt ? `
          <p class="text-gray-400 mb-2">
            ${i18n.t('profile.joinedOn')} ${joinedDate}
          </p>
        ` : ''}
        ${this.user.lastLogin ? `
          <p class="text-gray-400">
            ${i18n.t('profile.lastLogin')} ${lastLoginDate}
          </p>
        ` : ''}
        ${this.user.isOnline ? `
          <div class="flex items-center mt-2">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span class="text-green-400 text-sm font-medium">${i18n.t('profile.status.online')}</span>
          </div>
        ` : `
          <div class="flex items-center mt-2">
            <div class="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
            <span class="text-gray-400 text-sm">${i18n.t('profile.status.offline')}</span>
          </div>
        `}
      </div>
    `;
  }

  private renderActions(): string {
    if (!this.isOwnProfile) {
      return `
        <div class="flex flex-col space-y-2">
          <button id="add-friend" class="btn-primary">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
            ${i18n.t('profile.actions.addFriend')}
          </button>
          <button id="challenge-user" class="btn-secondary">
            <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            ${i18n.t('profile.actions.challenge')}
          </button>
        </div>
      `;
    }

    return `
      <div class="flex flex-col space-y-2">
        <button id="edit-profile" class="btn-primary">
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          ${i18n.t('profile.actions.editProfile')}
        </button>
        
      </div>
    `;
  }
}