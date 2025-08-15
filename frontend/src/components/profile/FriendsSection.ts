import { i18n } from '@services/i18n';
import { userService } from '../../services/userService.js';
import type { Friend } from '../../types/index.js';

export class FriendsSection {
  constructor(private friends: Friend[], private isOwnProfile: boolean) {}
  
  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-primary-400 flex items-center">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
            ${i18n.t('profile.friends.title')} (${this.friends.length})
          </h2>
          ${this.isOwnProfile ? `<button id="manage-friends" class="btn-secondary text-sm">${i18n.t('profile.friends.manage')}</button>` : ''}
        </div>
        ${this.renderFriendsList()}
      </div>
    `;
  }

  private renderFriendsList(): string {
    if (this.friends.length === 0) {
      return `
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-4">👥</div>
          <p class="text-gray-400">${i18n.t('profile.friends.noFriends')}</p>
          ${this.isOwnProfile ? `
            <button class="mt-4 btn-primary text-sm">
              ${i18n.t('profile.friends.findFriends')}
            </button>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="space-y-3 max-h-64 overflow-y-auto">
        ${this.friends.map(friend => this.renderFriendItem(friend)).join('')}
      </div>
      ${this.friends.length > 5 ? `
        <button id="view-all-friends" class="w-full mt-4 btn-secondary text-sm">
          ${i18n.t('profile.friends.viewAll')} (${this.friends.length})
        </button>
      ` : ''}
    `;
  }

  private renderFriendItem(friend: Friend): string {
    const avatarUrl = userService.getAvatarUrl(friend.avatar_url);
    
    return `
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <img 
              src="${avatarUrl}"
              alt="${friend.username}" 
              class="w-10 h-10 rounded-full bg-gray-600 object-cover"
              onerror="this.src='/images/default-avatar.png'"
            >
            <div class="absolute -bottom-1 -right-1 w-4 h-4 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-700"></div>
          </div>
          <div>
            <div class="text-white font-medium">${friend.username}</div>
            <div class="text-gray-400 text-sm">
              ${friend.isOnline ? i18n.t('profile.friends.online') : this.getLastSeenText(friend.lastSeen)}
            </div>
          </div>
        </div>
        <div class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            class="text-blue-400 hover:text-blue-300 p-1" 
            title="${i18n.t('profile.friends.viewProfile')}"
            data-friend-id="${friend.id}"
            data-action="view-profile"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          ${friend.isOnline ? `
            <button 
              class="text-green-400 hover:text-green-300 p-1" 
              title="${i18n.t('profile.friends.challenge')}"
              data-friend-id="${friend.id}"
              data-action="challenge"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </button>
          ` : ''}
          <button 
            class="text-blue-400 hover:text-blue-300 p-1" 
            title="${i18n.t('profile.friends.sendMessage')}"
            data-friend-id="${friend.id}"
            data-action="message"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private getLastSeenText(lastSeen?: string): string {
    if (!lastSeen) return i18n.t('profile.friends.offline');
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return i18n.t('profile.friends.justOffline');
    if (diffMins < 60) return i18n.t('profile.friends.minsAgo', { mins: diffMins });
    if (diffHours < 24) return i18n.t('profile.friends.hoursAgo', { hours: diffHours });
    return i18n.t('profile.friends.daysAgo', { days: diffDays });
  }
}