import { i18n } from '@/services/i18nService.js';
import { friendService } from '@services/friendsService';
import { User, Friend } from '../../types/index.js';

export class FriendsManagementModal {
  private modal: HTMLElement | null = null;
  private currentTab: 'friends' | 'search' = 'friends';
  private friends: Friend[] = [];
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
          <p class="text-gray-400 mb-4">${i18n.t('profile.friends.noFriends')}</p>
          <button 
            class="btn-primary" 
            onclick="document.querySelector('#tab-search').click()"
          >
            ${i18n.t('profile.friends.findFriends')}
          </button>
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
                data-action="view-profile"
                data-userid="${friend.id}"
              >
                ${i18n.t('profile.friends.viewProfile')}
              </button>
              <button 
                class="btn-danger text-sm" 
                data-action="remove-friend" 
                data-userid="${friend.id}"
              >
                ${i18n.t('friends.actions.removeFriend')}
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
          <p class="text-sm text-gray-400 mt-2">${i18n.t('friends.search.searchInstructions')}</p>
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
        ${this.searchResults.map(user => {
          const isFriend = this.friends.some(friend => friend.id === user.id);
          
          return `
            <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div class="flex items-center space-x-3">
                <img 
                  src="${user.avatar_url || '/images/default-avatar.png'}"
                  alt="${user.username}"
                  class="w-12 h-12 rounded-full object-cover"
                  onerror="this.src='/images/default-avatar.png'"
                />
                <div>
                  <h3 class="font-semibold text-white">${user.username}</h3>
                  <p class="text-sm ${user.isOnline ? 'text-green-400' : 'text-gray-400'}">
                    ${user.isOnline ? i18n.t('profile.friends.online') : i18n.t('profile.friends.offline')}
                  </p>
                  ${isFriend ? `<span class="text-xs bg-green-600 text-white px-2 py-1 rounded-full">${i18n.t('friends.status.friends')}</span>` : ''}
                </div>
              </div>
              <div class="flex space-x-2">
                <button 
                  class="btn-secondary text-sm" 
                  data-action="view-profile"
                  data-userid="${user.id}"
                  type="button"
                >
                  ${i18n.t('profile.friends.viewProfile')}
                </button>
                ${isFriend ? 
                  `<button 
                    class="btn-danger text-sm" 
                    data-action="remove-friend" 
                    data-userid="${user.id}"
                    type="button"
                  >
                    ${i18n.t('friends.actions.removeFriend')}
                  </button>` :
                  `<button 
                    class="btn-primary text-sm" 
                    data-action="add-friend" 
                    data-userid="${user.id}"
                    type="button"
                  >
                    ${i18n.t('friends.actions.addFriend')}
                  </button>`
                }
              </div>
            </div>
          `;
        }).join('')}
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
        const tabId = target.id.replace('tab-', '') as 'friends' | 'search';
        this.switchTab(tabId);
      });
    });

    // Recherche - attacher les événements initiaux
    this.bindSearchEvents();

    // Actions - MODIFIER ICI pour éviter la double exécution
    this.modal.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      
      if (!action) return;

      console.log('Action clicked:', action, 'Target:', target); // Debug

      try {
        let success = false;
        
        switch (action) {
          case 'view-profile':
            const userId = target.dataset.userid;
            console.log('User ID récupéré pour view-profile:', userId); // Debug
            
            if (!userId || userId === '0' || userId === 'undefined') {
              console.error('ID utilisateur invalide:', userId);
              return;
            }
            
            // Fermer le modal immédiatement avant la navigation
            this.close();
            
            // Attendre un petit délai pour s'assurer que le modal est fermé
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigate', { detail: `/profile/${userId}` }));
            }, 100);
            
            return; // Important: sortir de la fonction ici
            
          case 'add-friend':
            const userIdToAdd = parseInt(target.dataset.userid || '0');
            console.log('Adding friend with ID:', userIdToAdd);
            if (userIdToAdd === 0) {
              console.error('ID utilisateur invalide pour ajout ami');
              return;
            }
            success = await friendService.sendFriendRequest(userIdToAdd);
            if (success) {
              this.showMessage(i18n.t('friends.messages.friendAdded'), 'success');
              await this.loadData();
              this.updateTabContent();
              this.updateSearchResults();
            }
            break;
            
          case 'remove-friend':
            const friendId = parseInt(target.dataset.userid || '0');
            console.log('Removing friend with ID:', friendId);
            if (friendId === 0) {
              console.error('ID ami invalide pour suppression');
              return;
            }
            if (confirm(i18n.t('friends.confirmations.removeFriend'))) {
              success = await friendService.removeFriend(friendId);
              if (success) {
                this.showMessage(i18n.t('friends.messages.friendRemoved'), 'success');
                await this.loadData();
                this.updateTabContent();
                this.updateSearchResults();
              }
            }
            break;
        }
        
        if (!success && action !== 'view-profile') {
          this.showMessage(i18n.t('friends.messages.actionFailed'), 'error');
        }
        
      } catch (error) {
        console.error('Action failed:', error);
        this.showMessage(i18n.t('friends.messages.actionFailed'), 'error');
      }
    });
  }

  private bindSearchEvents(): void 
  {
    const searchInput = this.modal?.querySelector('#search-input') as HTMLInputElement;
    const searchBtn = this.modal?.querySelector('#search-btn');
    
    if (!searchInput || !searchBtn) return;
    
    const performSearch = async () => {
      const query = searchInput.value.trim();
      
      if (query && query.length >= 2) {
        try {
          this.searchResults = await friendService.searchUsers(query);
          this.updateSearchResults();
        } catch (error) {
          console.error('Search error:', error);
          this.showMessage(i18n.t('friends.messages.searchFailed'), 'error');
        }
      } else if (query.length === 0) {
        this.searchResults = [];
        this.updateSearchResults();
      }
    };

    // Recherche sur Enter
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Recherche sur clic du bouton
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performSearch();
    });

    // Recherche en temps réel avec debounce
    let searchTimeout: number;
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      
      clearTimeout(searchTimeout);
      
      if (query.length >= 2) {
        searchTimeout = window.setTimeout(() => {
          performSearch();
        }, 500);
      } else if (query.length === 0) {
        this.searchResults = [];
        this.updateSearchResults();
      }
    });
  }

  private switchTab(tab: 'friends' | 'search'): void {
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
    
    // Re-attacher les événements de recherche si on passe à l'onglet search
    if (tab === 'search') {
      setTimeout(() => {
        this.bindSearchEvents();
      }, 50);
    }
  }

  private updateTabContent(): void {
    const content = this.modal?.querySelector('#tab-content');
    if (content) {
      content.innerHTML = this.renderTabContent();
      
      // Mettre à jour le compteur d'amis dans l'onglet
      const friendsTab = this.modal?.querySelector('#tab-friends');
      if (friendsTab) {
        friendsTab.textContent = `${i18n.t('profile.friends.title')} (${this.friends.length})`;
      }
    }
  }

  private updateSearchResults(): void {
    const searchResults = this.modal?.querySelector('#search-results');
    if (searchResults) {
      searchResults.innerHTML = this.renderSearchResults();
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
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