import { i18n } from '@services/i18n';
import { friendService } from '@services/friendsService';
import { User, Friend, FriendRequest } from '../../types/index.js';

export class FriendsManagementModal {
  private modal: HTMLElement | null = null;
  private currentTab: 'friends' | 'requests' | 'search' = 'friends';
  private friends: Friend[] = [];
  private pendingRequests: FriendRequest[] = [];
  private searchResults: User[] = [];

  public async show(): Promise<void> {
    await this.loadData();
    this.createModal();
    this.bindEvents();
    
    // Animation d'ouverture
    setTimeout(() => {
      if (this.modal) {
        this.modal.classList.remove('opacity-0');
        this.modal.classList.add('opacity-100');
        const content = this.modal.querySelector('.modal-content');
        content?.classList.remove('scale-95');
        content?.classList.add('scale-100');
      }
    }, 10);
  }

  private async loadData(): Promise<void> {
    this.friends = await friendService.getFriends();
    this.pendingRequests = await friendService.getPendingRequests();
  }

  private createModal(): void {
    this.close();

    this.modal = document.createElement('div');
    this.modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    
    this.modal.innerHTML = `
      <div class="modal-content bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden transform scale-95 transition-transform duration-300">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">${i18n.t('profile.friends.manage')}</h2>
            <button id="close-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
            <button id="tab-friends" class="tab-btn flex-1 py-2 px-4 rounded-md transition-colors ${this.currentTab === 'friends' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}">
              ${i18n.t('profile.friends.title')} (${this.friends.length})
            </button>
            <button id="tab-requests" class="tab-btn flex-1 py-2 px-4 rounded-md transition-colors ${this.currentTab === 'requests' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}">
              ${i18n.t('friends.requests.title')} (${this.pendingRequests.length})
            </button>
            <button id="tab-search" class="tab-btn flex-1 py-2 px-4 rounded-md transition-colors ${this.currentTab === 'search' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}">
              ${i18n.t('friends.search.title')}
            </button>
          </div>

          <!-- Content -->
          <div id="tab-content" class="min-h-[400px] max-h-[500px] overflow-y-auto">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  private renderTabContent(): string {
    switch (this.currentTab) {
      case 'friends':
        return this.renderFriendsList();
      case 'requests':
        return this.renderRequestsList();
      case 'search':
        return this.renderSearchTab();
      default:
        return '';
    }
  }

  private renderFriendsList(): string {
    if (this.friends.length === 0) {
      return `
        <div class="text-center py-12">
          <div class="text-gray-400 text-4xl mb-4">👥</div>
          <p class="text-gray-400">${i18n.t('profile.friends.noFriends')}</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${this.friends.map(friend => `
          <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <img 
                src="${friend.avatar_url || '/images/default-avatar.png'}" 
                alt="${friend.username}"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 class="font-semibold text-white">${friend.username}</h3>
                <p class="text-sm ${friend.isOnline ? 'text-green-400' : 'text-gray-400'}">
                  ${friend.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                class="btn-secondary text-sm" 
                onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile/${friend.id}' }))"
              >
                ${i18n.t('profile.friends.viewProfile')}
              </button>
              <button 
                class="btn-danger text-sm" 
                data-action="remove-friend" 
                data-user-id="${friend.id}"
              >
                ${i18n.t('friends.actions.remove')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderRequestsList(): string {
    if (this.pendingRequests.length === 0) {
      return `
        <div class="text-center py-12">
          <div class="text-gray-400 text-4xl mb-4">📨</div>
          <p class="text-gray-400">${i18n.t('friends.requests.noPending')}</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${this.pendingRequests.map(request => `
          <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <img 
                src="${request.sender?.avatar_url || '/images/default-avatar.png'}" 
                alt="${request.sender?.username}"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 class="font-semibold text-white">${request.sender?.username}</h3>
                <p class="text-sm text-gray-400">
                  ${i18n.t('friends.requests.sentRequest')}
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                class="btn-primary text-sm" 
                data-action="accept-request" 
                data-request-id="${request.id}"
              >
                ${i18n.t('friends.actions.accept')}
              </button>
              <button 
                class="btn-secondary text-sm" 
                data-action="decline-request" 
                data-request-id="${request.id}"
              >
                ${i18n.t('friends.actions.decline')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderSearchTab(): string {
    return `
      <div>
        <!-- Search Input -->
        <div class="mb-6">
          <div class="relative">
            <input 
              type="text" 
              id="search-input" 
              placeholder="${i18n.t('friends.search.placeholder')}"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
            />
            <button 
              id="search-btn" 
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div id="search-results">
          ${this.renderSearchResults()}
        </div>
      </div>
    `;
  }

  private renderSearchResults(): string {
    if (this.searchResults.length === 0) {
      return `
        <div class="text-center py-12">
          <div class="text-gray-400 text-4xl mb-4">🔍</div>
          <p class="text-gray-400">${i18n.t('friends.search.noResults')}</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${this.searchResults.map(user => `
          <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <img 
                src="${user.avatar_url || '/images/default-avatar.png'}" 
                alt="${user.username}"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 class="font-semibold text-white">${user.username}</h3>
                <p class="text-sm ${user.isOnline ? 'text-green-400' : 'text-gray-400'}">
                  ${user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                class="btn-secondary text-sm" 
                onclick="window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile/${user.id}' }))"
              >
                ${i18n.t('profile.friends.viewProfile')}
              </button>
              <button 
                class="btn-primary text-sm" 
                data-action="send-request" 
                data-user-id="${user.id}"
              >
                ${i18n.t('friends.actions.addFriend')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private bindEvents(): void {
    if (!this.modal) return;

    // Fermer le modal
    const closeBtn = this.modal.querySelector('#close-modal');
    closeBtn?.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Gestion des onglets
    this.modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabId = target.id.replace('tab-', '') as 'friends' | 'requests' | 'search';
        this.switchTab(tabId);
      });
    });

    // Recherche
    const searchInput = this.modal.querySelector('#search-input') as HTMLInputElement;
    const searchBtn = this.modal.querySelector('#search-btn');
    
    const performSearch = async () => {
      const query = searchInput?.value.trim();
      if (query && query.length >= 2) {
        this.searchResults = await friendService.searchUsers(query);
        this.updateSearchResults();
      }
    };

    searchInput?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    searchBtn?.addEventListener('click', performSearch);

    // Actions
    this.modal.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      
      if (!action) return;

      try {
        let success = false;
        
        switch (action) {
          case 'send-request':
            const userId = parseInt(target.dataset.userId!);
            success = await friendService.sendFriendRequest(userId);
            if (success) {
              this.showMessage(i18n.t('friends.messages.requestSent'), 'success');
              // Supprimer de la liste de recherche
              this.searchResults = this.searchResults.filter(u => u.id !== userId);
              this.updateSearchResults();
            }
            break;
            
          case 'accept-request':
            const acceptRequestId = parseInt(target.dataset.requestId!);
            success = await friendService.acceptFriendRequest(acceptRequestId);
            if (success) {
              this.showMessage(i18n.t('friends.messages.requestAccepted'), 'success');
              await this.loadData();
              this.updateTabContent();
            }
            break;
            
          case 'decline-request':
            const declineRequestId = parseInt(target.dataset.requestId!);
            success = await friendService.declineFriendRequest(declineRequestId);
            if (success) {
              this.showMessage(i18n.t('friends.messages.requestDeclined'), 'success');
              await this.loadData();
              this.updateTabContent();
            }
            break;
            
          case 'remove-friend':
            const friendId = parseInt(target.dataset.userId!);
            if (confirm(i18n.t('friends.confirmations.removeFriend'))) {
              success = await friendService.removeFriend(friendId);
              if (success) {
                this.showMessage(i18n.t('friends.messages.friendRemoved'), 'success');
                await this.loadData();
                this.updateTabContent();
              }
            }
            break;
        }
        
        if (!success && action !== 'remove-friend') {
          this.showMessage(i18n.t('friends.messages.actionFailed'), 'error');
        }
        
      } catch (error) {
        console.error('Friend action error:', error);
        this.showMessage(i18n.t('friends.messages.actionFailed'), 'error');
      }
    });
  }

  private switchTab(tab: 'friends' | 'requests' | 'search'): void {
    this.currentTab = tab;
    
    // Mettre à jour les styles des onglets
    this.modal?.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('text-gray-300');
    });
    
    const activeTab = this.modal?.querySelector(`#tab-${tab}`);
    activeTab?.classList.remove('text-gray-300');
    activeTab?.classList.add('bg-blue-600', 'text-white');
    
    this.updateTabContent();
  }

  private updateTabContent(): void {
    const content = this.modal?.querySelector('#tab-content');
    if (content) {
      content.innerHTML = this.renderTabContent();
    }
  }

  private updateSearchResults(): void {
    const searchResults = this.modal?.querySelector('#search-results');
    if (searchResults) {
      searchResults.innerHTML = this.renderSearchResults();
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[60] px-4 py-2 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } transform translate-x-full transition-transform duration-300`;
    notification.textContent = message;
    
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
  }

  public close(): void {
    if (!this.modal) return;

    this.modal.classList.remove('opacity-100');
    this.modal.classList.add('opacity-0');
    const content = this.modal.querySelector('.modal-content');
    content?.classList.remove('scale-100');
    content?.classList.add('scale-95');

    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }
}