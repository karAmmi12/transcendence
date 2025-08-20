import { User, FriendshipStatus } from '../../types/index.js';
import { i18n } from '@services/i18n';
import { userService } from '../../services/userService.js';

// export class ProfileHeader {
//   private user: User;
//   private isOwnProfile: boolean;

//   constructor(user: User, isOwnProfile: boolean = false) {
//     this.user = user;
//     this.isOwnProfile = isOwnProfile;
//   }

//   render(): string {
//     return `
//       <div class="bg-gray-800 rounded-lg p-6 mb-6">
//         <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
//           ${this.renderAvatar()}
//           ${this.renderUserInfo()}
//         </div>
//       </div>
//     `;
//   }

//   private renderAvatar(): string {
//     const avatarUrl = userService.getAvatarUrl(this.user.avatar_url);
    
//     return `
//       <div class="relative group">
//         <img 
//           src="${avatarUrl}" 
//           alt="${this.user.username}" 
//           class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary-500 transition-transform hover:scale-105 object-cover"
//           onerror="this.src='/images/default-avatar.png'"
//         />
//         ${this.user.isOnline ? '<div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>' : ''}
//         ${this.isOwnProfile ? `
//           <button id="change-avatar" class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" title="${i18n.t('profile.actions.changeAvatar')}">
//             <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
//               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
//             </svg>
//           </button>
//         ` : ''}
//       </div>
//     `;
//   }

//   private renderUserInfo(): string {
//     return `
//       <div class="flex-1 text-center md:text-left">
//         <h1 class="text-3xl font-bold mb-2">${this.user.username}</h1>
//         <p class="text-gray-400 mb-4">${this.user.email}</p>
        
//         <div class="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
//           <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
//             ${this.user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
//           </span>
//           ${this.user.stats ? `
//             <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
//               ${i18n.t('profile.stats.ranking')}: #${this.user.stats.rank || 'N/A'}
//             </span>
//           ` : ''}
//         </div>

//         ${this.isOwnProfile ? this.renderOwnProfileActions() : this.renderOtherProfileActions()}
//       </div>
//     `;
//   }

//   private renderOwnProfileActions(): string {
//     return `
//       <div class="flex flex-wrap gap-2 justify-center md:justify-start">
//         <button id="edit-profile" class="btn-primary">
//           ${i18n.t('profile.actions.editProfile')}
//         </button>
//         <button id="change-password" class="btn-secondary">
//           ${i18n.t('profile.actions.changePassword')}
//         </button>
//       </div>
//     `;
//   }

//   private renderOtherProfileActions(): string {
//     return `
//       <div class="flex flex-wrap gap-2 justify-center md:justify-start">
//         <button id="add-friend" class="btn-primary">
//           ${i18n.t('profile.actions.addFriend')}
//         </button>
//         <button id="challenge-user" class="btn-secondary">
//           ${i18n.t('profile.actions.challenge')}
//         </button>
//       </div>
//     `;
//   }
// }



export class ProfileHeader {
  constructor(
    private user: User, 
    private isOwnProfile: boolean,
    private friendshipStatus?: FriendshipStatus | null 
  ) {}

  render(): string {
    const avatarUrl = userService.getAvatarUrl(this.user.avatar_url);
    
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

  // ✅ Ajouter une méthode pour attacher les événements
  public bindEvents(onFriendAction?: (action: string) => Promise<void>): void {
    if (!onFriendAction) return;

    // Actions d'amitié dans le header
    document.getElementById('header-add-friend')?.addEventListener('click', () => {
      onFriendAction('add-friend');
    });

    document.getElementById('header-remove-friend')?.addEventListener('click', () => {
      onFriendAction('remove-friend');
    });

    document.getElementById('header-accept-friend-request')?.addEventListener('click', () => {
      onFriendAction('accept-friend-request');
    });

    document.getElementById('header-decline-friend-request')?.addEventListener('click', () => {
      onFriendAction('decline-friend-request');
    });

    document.getElementById('header-challenge-user')?.addEventListener('click', () => {
      console.log('Challenge user from header - TODO: Implement');
    });
  }
}

