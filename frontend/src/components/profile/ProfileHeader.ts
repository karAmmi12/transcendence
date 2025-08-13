
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
          src="${this.user.avatar_url || '/default-avatar.png'}" 
          alt="${this.user.username}" 
          class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary-500 transition-transform hover:scale-105"
        />
        ${this.user.isOnline ? '<div class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>' : ''}
        ${this.isOwnProfile ? `
          <button id="change-avatar" class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
        <div class="flex-1">
            <h1 class="text-3xl font-bold text-white mb-2">${this.user.username}</h1>
            <p class="text-gray-400 mb-2">Joined on ${new Date(this.user.createdAt).toLocaleDateString()}</p>
            ${this.user.lastLogin ? `<p class="text-gray-400">Last login: ${new Date(this.user.lastLogin).toLocaleDateString()}</p>` : ''}
        </div>
        `;
    }

   private renderActions(): string {
       if (!this.isOwnProfile) return '';

       return `
           <div class="mt-4">
               <button id="edit-profile" class="btn-secondary">
                   Edit Profile
               </button>
           </div>
       `;
   }
}