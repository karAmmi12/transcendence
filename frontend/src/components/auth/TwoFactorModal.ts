import { i18n } from '@/services/i18nService.js';
import { twoFactorService } from '../../services/twoFactorService.js';

export class TwoFactorModal {
  private modal: HTMLElement | null = null;

  constructor(
    private mode: 'enable' | 'disable' | 'login',
    private onSuccess: (code?: string) => void | Promise<void>,
    private onCancel?: () => void
  ) {}

  show(): void {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);
    
    // Animation d'ouverture
    setTimeout(() => {
      this.modal?.classList.remove('opacity-0');
      this.modal?.classList.add('opacity-100');
      const content = this.modal?.querySelector('.modal-content');
      content?.classList.remove('scale-95');
      content?.classList.add('scale-100');
    }, 10);

    this.bindEvents();
    
    // Focus sur le champ code
    setTimeout(() => {
      const codeInput = this.modal?.querySelector('#verification-code') as HTMLInputElement;
      codeInput?.focus();
    }, 100);
  }

  // private createModal(): HTMLElement {
  //   const modal = document.createElement('div');
  //   modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300';
    
  //   modal.innerHTML = `
  //     <div class="modal-content bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 transform scale-95 transition-transform duration-300">
  //       <!-- Header -->
  //       <div class="flex items-center justify-between mb-6">
  //         <h2 class="text-xl font-bold text-white">
  //           ${this.mode === 'enable' 
  //             ? i18n.t('profile.twoFactor.modal.enableTitle') 
  //             : i18n.t('profile.twoFactor.modal.disableTitle')
  //           }
  //         </h2>
  //         <button id="close-modal" class="text-gray-400 hover:text-white transition-colors">
  //           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
  //           </svg>
  //         </button>
  //       </div>

  //       <!-- Content -->
  //       <div class="mb-6">
  //         <p class="text-gray-300 mb-4">
  //           ${this.mode === 'enable' 
  //             ? i18n.t('profile.twoFactor.modal.enableDescription') 
  //             : i18n.t('profile.twoFactor.modal.disableDescription')
  //           }
  //         </p>
          
  //         <!-- Form -->
  //         <form id="verification-form">
  //           <div class="mb-4">
  //             <label for="verification-code" class="block text-sm font-medium text-gray-300 mb-2">
  //               ${i18n.t('profile.twoFactor.modal.codeLabel')}
  //             </label>
  //             <input 
  //               type="text" 
  //               id="verification-code" 
  //               class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //               placeholder="000000"
  //               maxlength="6"
  //               pattern="[0-9]{6}"
  //               required
  //             />
  //           </div>

  //           <!-- Error message -->
  //           <div id="error-message" class="hidden mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
  //             <p id="error-description" class="text-red-300 text-sm"></p>
  //           </div>

  //           <!-- Buttons -->
  //           <div class="flex gap-3">
  //             <button 
  //               type="button" 
  //               id="cancel-btn" 
  //               class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
  //             >
  //               ${i18n.t('common.cancel')}
  //             </button>
  //             <button 
  //               type="submit" 
  //               id="verify-btn" 
  //               class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  //             >
  //               <span id="verify-text">
  //                 ${this.mode === 'enable' 
  //                   ? i18n.t('profile.twoFactor.modal.enableButton') 
  //                   : i18n.t('profile.twoFactor.modal.disableButton')
  //                 }
  //               </span>
  //               <svg id="verify-spinner" class="hidden animate-spin h-4 w-4 ml-2 inline-block" fill="none" viewBox="0 0 24 24">
  //                 <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
  //                 <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
  //               </svg>
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     </div>
  //   `;

  //   return modal;
  // }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300';
    
    // ✅ Titres et descriptions selon le mode
    let title, description, buttonText;
    
    switch (this.mode) {
      case 'enable':
        title = i18n.t('profile.twoFactor.modal.enableTitle');
        description = i18n.t('profile.twoFactor.modal.enableDescription');
        buttonText = i18n.t('profile.twoFactor.modal.enableButton');
        break;
      case 'disable':
        title = i18n.t('profile.twoFactor.modal.disableTitle');
        description = i18n.t('profile.twoFactor.modal.disableDescription');
        buttonText = i18n.t('profile.twoFactor.modal.disableButton');
        break;
      case 'login':
        title = i18n.t('auth.twoFactor.title');
        description = i18n.t('auth.twoFactor.description');
        buttonText = i18n.t('auth.twoFactor.verify');
        break;
    }

    modal.innerHTML = `
      <div class="modal-content bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 transform scale-95 transition-transform duration-300">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white">${title}</h2>
          <button id="close-modal" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="mb-6">
          <p class="text-gray-300 mb-4">${description}</p>
          
          <!-- Form -->
          <form id="verification-form">
            <div class="mb-4">
              <label for="verification-code" class="block text-sm font-medium text-gray-300 mb-2">
                ${i18n.t('profile.twoFactor.modal.codeLabel')}
              </label>
              <input 
                type="text" 
                id="verification-code" 
                class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
                maxlength="6"
                pattern="[0-9]{6}"
                required
              />
            </div>

            <!-- Error message -->
            <div id="error-message" class="hidden mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
              <p id="error-description" class="text-red-300 text-sm"></p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3">
              <button 
                type="button" 
                id="cancel-btn" 
                class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ${i18n.t('common.cancel')}
              </button>
              <button 
                type="submit" 
                id="verify-btn" 
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span id="verify-text">${buttonText}</span>
                <svg id="verify-spinner" class="hidden animate-spin h-4 w-4 ml-2 inline-block" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    return modal;
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const verifyBtn = form.querySelector('#verify-btn') as HTMLButtonElement;
    const verifyText = form.querySelector('#verify-text') as HTMLElement;
    const verifySpinner = form.querySelector('#verify-spinner') as HTMLElement;
    const codeInput = form.querySelector('#verification-code') as HTMLInputElement;

    // Show loading state
    verifyBtn.disabled = true;
    verifyText.textContent = i18n.t('common.loading');
    verifySpinner.classList.remove('hidden');
    this.hideError();

    try {
      const code = codeInput.value;

      if (this.mode === 'login') {
        // ✅ Pour la connexion, passer le code directement à la callback
        await this.onSuccess(code);
        this.close();
      } else {
        // Pour enable/disable, utiliser twoFactorService comme avant
        let result;
        if (this.mode === 'enable') {
          result = await twoFactorService.verify2FA(code);
        } else {
          result = await twoFactorService.disable2FA(code);
        }

        if (result.success) {
          this.onSuccess();
          this.close();
        } else {
          throw new Error(result.message);
        }
      }
      
    } catch (error) {
      this.showError((error as Error).message);
    } finally {
      // Reset loading state
      if (this.modal)
      {
        verifyBtn.disabled = false;
        verifyText.textContent = this.mode === 'enable'
          ? i18n.t('profile.twoFactor.modal.enableButton')
          : this.mode === 'disable'
          ? i18n.t('profile.twoFactor.modal.disableButton')
          : i18n.t('auth.twoFactor.verify');
        verifySpinner.classList.add('hidden');
      }
    }
  }

  private bindEvents(): void {
    if (!this.modal) return;

    // Fermer le modal
    const closeBtn = this.modal.querySelector('#close-modal');
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    
    [closeBtn, cancelBtn].forEach(btn => {
      btn?.addEventListener('click', () => {
        this.onCancel?.();
        this.close();
      });
    });

    // Fermer en cliquant sur l'overlay
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.onCancel?.();
        this.close();
      }
    });

    // Validation du formulaire
    const form = this.modal.querySelector('#verification-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Validation en temps réel
    const codeInput = this.modal.querySelector('#verification-code') as HTMLInputElement;
    codeInput?.addEventListener('input', () => this.validateCode());
  }

  private validateCode(): void {
    if (!this.modal) return;

    const codeInput = this.modal.querySelector('#verification-code') as HTMLInputElement;
    const verifyBtn = this.modal.querySelector('#verify-btn') as HTMLButtonElement;
    
    const code = codeInput.value.replace(/\D/g, ''); // Garder seulement les chiffres
    codeInput.value = code;

    verifyBtn.disabled = code.length !== 6;
  }

  // private async handleSubmit(e: Event): Promise<void> {
  //   e.preventDefault();
    
  //   const form = e.target as HTMLFormElement;
  //   const verifyBtn = form.querySelector('#verify-btn') as HTMLButtonElement;
  //   const verifyText = form.querySelector('#verify-text') as HTMLElement;
  //   const verifySpinner = form.querySelector('#verify-spinner') as HTMLElement;
  //   const codeInput = form.querySelector('#verification-code') as HTMLInputElement;

  //   // Show loading state
  //   verifyBtn.disabled = true;
  //   verifyText.textContent = i18n.t('common.loading');
  //   verifySpinner.classList.remove('hidden');
  //   this.hideError();

  //   try {
  //     const code = codeInput.value;

  //     let result;
  //     if (this.mode === 'enable') {
  //       result = await twoFactorService.verify2FA(code);
  //     } else {
  //       result = await twoFactorService.disable2FA(code);
  //     }

  //     if (result.success) {
  //       this.onSuccess();
  //       this.close();
  //     } else {
  //       throw new Error(result.message);
  //     }
      
  //   } catch (error) {
  //     this.showError((error as Error).message);
  //   } finally {
  //     // Reset loading state
  //     verifyBtn.disabled = false;
  //     verifyText.textContent = this.mode === 'enable' 
  //       ? i18n.t('profile.twoFactor.modal.enableButton') 
  //       : i18n.t('profile.twoFactor.modal.disableButton');
  //     verifySpinner.classList.add('hidden');
  //   }
  // }

  private showError(message: string): void {
    if (!this.modal) return;
    
    const errorMessage = this.modal.querySelector('#error-message');
    const errorDescription = this.modal.querySelector('#error-description');
    
    if (errorMessage && errorDescription) {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');
    }
  }

  private hideError(): void {
    if (!this.modal) return;
    
    const errorMessage = this.modal.querySelector('#error-message');
    errorMessage?.classList.add('hidden');
  }

  public close(): void {
    if (!this.modal) return;

    // Animation de fermeture
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