import { i18n } from '@services/i18n';
import { userService } from '@services/userService';
import { User } from '@/types/index.js';

export class ChangePasswordModal {
  private modal: HTMLElement | null = null;
  private user: User;
  private onSuccess: () => void;

  constructor(user: User, onSuccess: () => void) {
    this.user = user;
    this.onSuccess = onSuccess;
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
    this.modal.id = 'change-password-modal';
    this.modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    
    this.modal.innerHTML = `
      <div class="modal-content bg-gray-800 rounded-lg max-w-md w-full transform scale-95 transition-transform duration-300">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">${i18n.t('profile.changePassword.title')}</h2>
            <button id="close-modal" class="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form id="change-password-form" class="space-y-6">
            <!-- Current Password -->
            <div>
              <label for="current-password" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.changePassword.currentPassword')}
              </label>
              <input 
                type="password" 
                id="current-password" 
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="${i18n.t('profile.changePassword.currentPasswordPlaceholder')}"
                required
              />
            </div>

            <!-- New Password -->
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.changePassword.newPassword')}
              </label>
              <input 
                type="password" 
                id="new-password" 
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="${i18n.t('profile.changePassword.newPasswordPlaceholder')}"
                required
                minlength="8"
              />
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirm-new-password" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.changePassword.confirmPassword')}
              </label>
              <input 
                type="password" 
                id="confirm-new-password" 
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="${i18n.t('profile.changePassword.confirmPasswordPlaceholder')}"
                required
                minlength="8"
              />
            </div>

            <!-- Error Message -->
            <div id="password-error-message" class="hidden bg-red-900 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
              <span id="password-error-description"></span>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button 
                type="button" 
                id="cancel-password"
                class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                ${i18n.t('profile.changePassword.cancel')}
              </button>
              <button 
                type="submit" 
                id="save-password"
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span id="password-spinner" class="hidden mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                <span id="password-text">${i18n.t('profile.changePassword.save')}</span>
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
    const cancelBtn = this.modal.querySelector('#cancel-password');
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => this.close());
    });

    // Fermer en cliquant sur l'overlay
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Validation en temps réel
    const newPasswordInput = this.modal.querySelector('#new-password') as HTMLInputElement;
    const confirmPasswordInput = this.modal.querySelector('#confirm-new-password') as HTMLInputElement;

    [newPasswordInput, confirmPasswordInput].forEach(input => {
      input?.addEventListener('input', () => this.validatePasswords());
    });

    // Soumission du formulaire
    const form = this.modal.querySelector('#change-password-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Échapper pour fermer
    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  private validatePasswords(): void {
    if (!this.modal) return;

    const newPassword = (this.modal.querySelector('#new-password') as HTMLInputElement).value;
    const confirmPassword = (this.modal.querySelector('#confirm-new-password') as HTMLInputElement).value;
    const saveBtn = this.modal.querySelector('#save-password') as HTMLButtonElement;

    let isValid = true;
    let errorMessage = '';

    // Vérifier la longueur du mot de passe
    if (newPassword.length > 0 && newPassword.length < 8) {
      isValid = false;
      errorMessage = i18n.t('profile.changePassword.validation.minLength');
    }

    // Vérifier que les mots de passe correspondent
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      isValid = false;
      errorMessage = i18n.t('profile.changePassword.validation.mismatch');
    }

    // Afficher/masquer l'erreur
    if (errorMessage) {
      this.showError(errorMessage);
    } else {
      this.hideError();
    }

    // Activer/désactiver le bouton
    saveBtn.disabled = !isValid || newPassword.length === 0 || confirmPassword.length === 0;
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const saveBtn = form.querySelector('#save-password') as HTMLButtonElement;
    const saveText = form.querySelector('#password-text') as HTMLElement;
    const saveSpinner = form.querySelector('#password-spinner') as HTMLElement;

    // Show loading state
    saveBtn.disabled = true;
    saveText.textContent = i18n.t('profile.changePassword.saving');
    saveSpinner.classList.remove('hidden');
    this.hideError();

    try {
      const currentPassword = (form.querySelector('#current-password') as HTMLInputElement).value;
      const newPassword = (form.querySelector('#new-password') as HTMLInputElement).value;
      const confirmPassword = (form.querySelector('#confirm-new-password') as HTMLInputElement).value;
      
      // Validation côté client
      if (!currentPassword) {
        throw new Error(i18n.t('profile.changePassword.validation.required'));
      }

      if (newPassword.length < 8) {
        throw new Error(i18n.t('profile.changePassword.validation.minLength'));
      }

      if (newPassword !== confirmPassword) {
        throw new Error(i18n.t('profile.changePassword.validation.mismatch'));
      }

      // Appel à l'API pour changer le mot de passe
      await userService.changePassword(currentPassword, newPassword);
      
      // Succès
      this.close();
      this.onSuccess();
      
    } catch (error) {
      this.showError((error as Error).message);
    } finally {
      // Reset loading state
      saveBtn.disabled = false;
      saveText.textContent = i18n.t('profile.changePassword.save');
      saveSpinner.classList.add('hidden');
    }
  }

  private showError(message: string): void {
    if (!this.modal) return;
    
    const errorMessage = this.modal.querySelector('#password-error-message');
    const errorDescription = this.modal.querySelector('#password-error-description');
    
    if (errorMessage && errorDescription) {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');
    }
  }

  private hideError(): void {
    if (!this.modal) return;
    
    const errorMessage = this.modal.querySelector('#password-error-message');
    errorMessage?.classList.add('hidden');
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