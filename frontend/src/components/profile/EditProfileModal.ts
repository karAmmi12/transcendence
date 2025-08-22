import { i18n } from '@/services/i18nService.js';
import { userService } from '@services/userService';
import type { User } from '../../types/index.js';

export class EditProfileModal {
  private modal: HTMLElement | null = null;
  private user: User;
  private onSave: (updatedUser: User) => void;

  constructor(user: User, onSave: (updatedUser: User) => void) {
    this.user = user;
    this.onSave = onSave;
  }

  show(): void {
    this.createModal();
    this.bindEvents();
    
    // Animation d'apparition avec Tailwind
    setTimeout(() => {
      this.modal?.classList.remove('opacity-0');
      this.modal?.classList.add('opacity-100');
      const content = this.modal?.querySelector('.modal-content');
      content?.classList.remove('scale-95');
      content?.classList.add('scale-100');
    }, 10);
  }

  private createModal(): void {
    // Supprimer le modal existant s'il y en a un
    this.close();

    this.modal = document.createElement('div');
    this.modal.id = 'edit-profile-modal';
    this.modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    
    this.modal.innerHTML = `
      <div class="modal-content bg-gray-800 rounded-lg max-w-md w-full transform scale-95 transition-transform duration-300">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">${i18n.t('profile.edit.title')}</h2>
            <button id="close-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form id="edit-profile-form" class="space-y-6">
            <!-- Avatar Section -->
            <div class="text-center">
              <div class="relative inline-block group">
                <img 
                  id="preview-avatar" 
                  src="${this.user.avatarUrl || '/images/default-avatar.png'}" 
                  alt="${this.user.username}" 
                  class="w-24 h-24 rounded-full object-cover border-4 border-primary-500 transition-transform group-hover:scale-105"
                />
                <button 
                  type="button" 
                  id="change-avatar-btn"
                  class="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>
              </div>
              <input type="file" id="avatar-upload" accept="image/*" class="hidden" />
              <p class="text-gray-400 text-sm mt-2">${i18n.t('profile.edit.changeAvatarHint')}</p>
            </div>

            <!-- Username -->
            <div>
              <label for="edit-username" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.edit.username')}
              </label>
              <input 
                type="text" 
                id="edit-username" 
                value="${this.user.username}"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
                minlength="3"
                maxlength="20"
              />
            </div>
            
            <!-- Email -->
            <div>
              <label for="edit-email" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.edit.email')}
              </label>
              <input 
                type="email" 
                id="edit-email" 
                value="${this.user.email || ''}"
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <!-- Error Message -->
            <div id="edit-error-message" class="hidden bg-red-900 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
              <span id="edit-error-description"></span>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button 
                type="button" 
                id="cancel-edit"
                class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                ${i18n.t('common.cancel')}
              </button>
              <button 
                type="submit" 
                id="save-profile"
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span id="save-spinner" class="hidden mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                <span id="save-text">${i18n.t('common.save')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  private bindEvents(): void {
    if (!this.modal) return;

    // Fermer le modal
    const closeBtn = this.modal.querySelector('#close-modal');
    const cancelBtn = this.modal.querySelector('#cancel-edit');
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => this.close());
    });

    // Fermer en cliquant sur l'overlay
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Upload d'avatar
    const changeAvatarBtn = this.modal.querySelector('#change-avatar-btn');
    const avatarUpload = this.modal.querySelector('#avatar-upload') as HTMLInputElement;
    const previewAvatar = this.modal.querySelector('#preview-avatar') as HTMLImageElement;

    changeAvatarBtn?.addEventListener('click', () => {
      avatarUpload.click();
    });

    avatarUpload?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validation de la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.showError(i18n.t('profile.edit.errors.avatarTooLarge'));
          return;
        }

        // Validation du type
        if (!file.type.startsWith('image/')) {
          this.showError(i18n.t('profile.edit.errors.invalidImageType'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (previewAvatar && e.target?.result) {
            previewAvatar.src = e.target.result as string;
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Soumission du formulaire
    const form = this.modal.querySelector('#edit-profile-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Échapper pour fermer
    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const saveBtn = form.querySelector('#save-profile') as HTMLButtonElement;
    const saveText = form.querySelector('#save-text') as HTMLElement;
    const saveSpinner = form.querySelector('#save-spinner') as HTMLElement;
    const errorMessage = form.querySelector('#edit-error-message') as HTMLElement;

    // Show loading state
    saveBtn.disabled = true;
    saveText.textContent = i18n.t('common.saving');
    saveSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    try {
    //   const formData = new FormData(form);
      const avatarFile = (form.querySelector('#avatar-upload') as HTMLInputElement).files?.[0];
      const username = (form.querySelector('#edit-username') as HTMLInputElement).value.trim();
      const email = (form.querySelector('#edit-email') as HTMLInputElement).value.trim();
      
      // Validation côté client
      if (username.length < 3) {
        throw new Error(i18n.t('profile.edit.errors.usernameTooShort'));
      }
      
      if (username.length > 20) {
        throw new Error(i18n.t('profile.edit.errors.usernameTooLong'));
      }

      if (!email.includes('@')) {
        throw new Error(i18n.t('profile.edit.errors.invalidEmail'));
      }

      const updatedData = {
        username,
        email
      };

      // Appel à l'API pour mettre à jour le profil
      const updatedUser = await userService.updateProfile(updatedData, avatarFile);
      
      // Appeler le callback avec les données mises à jour
      this.onSave(updatedUser);
      
      this.close();
      
    } catch (error) {
      this.showError((error as Error).message);
    } finally {
      // Reset loading state
      saveBtn.disabled = false;
      saveText.textContent = i18n.t('common.save');
      saveSpinner.classList.add('hidden');
    }
  }

  private showError(message: string): void {
    if (!this.modal) return;
    
    const errorMessage = this.modal.querySelector('#edit-error-message');
    const errorDescription = this.modal.querySelector('#edit-error-description');
    
    if (errorMessage && errorDescription) {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');
      
      // Auto-hide après 5 secondes
      setTimeout(() => {
        errorMessage.classList.add('hidden');
      }, 5000);
    }
  }

  close(): void {
    if (!this.modal) return;

    // Animation de fermeture
    this.modal.classList.remove('opacity-100');
    this.modal.classList.add('opacity-0');
    const content = this.modal.querySelector('.modal-content');
    content?.classList.remove('scale-100');
    content?.classList.add('scale-95');

    setTimeout(() => {
      document.removeEventListener('keydown', this.handleKeydown);
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }
}