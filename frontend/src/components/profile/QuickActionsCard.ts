import { i18n } from '@/services/i18nService';

export interface ActionCallbacks {
  onEditProfile: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

export class QuickActionsCard {
  constructor(private callbacks: ActionCallbacks) {}

  render(): string {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4 text-primary-400">${i18n.t('profile.actions.title')}</h2>
        <div class="space-y-3">
          <button id="edit-profile" class="w-full btn-secondary text-left flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            ${i18n.t('profile.actions.editProfile')}
          </button>
          <button id="change-password" class="w-full btn-secondary text-left flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            ${i18n.t('profile.actions.changePassword')}
          </button>
          <button id="logout" class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            ${i18n.t('nav.logout')}
          </button>
        </div>
      </div>
    `;
  }

  bindEvents(): void {
    document.getElementById('edit-profile')?.addEventListener('click', this.callbacks.onEditProfile);
    document.getElementById('logout')?.addEventListener('click', this.callbacks.onLogout);
    document.getElementById('change-password')?.addEventListener('click', this.callbacks.onChangePassword);
  }
}