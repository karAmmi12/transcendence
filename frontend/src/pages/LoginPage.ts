import { i18n } from '@/services/i18nService';
import { authService } from '@services/authService';
import { AuthPageBase } from '@components/auth/AuthPageBase';
import { AuthFormInput } from '@components/auth/AuthFormInput';
import { AuthSubmitButton } from '@components/auth/AuthSubmitButton';

import { TwoFactorModal } from '../components/auth/TwoFactorModal.js';
import { TwoFactorRequiredError } from '../types/errors.js';

export class LoginPage extends AuthPageBase {
  private submitButton: AuthSubmitButton;

  constructor() {
    super();
    this.submitButton = new AuthSubmitButton({
      id: 'login-submit',
      textKey: 'auth.login.submit',
      loadingTextKey: 'auth.login.loading'
    });
  }

  protected getTitle(): string {
    return i18n.t('auth.login.title');
  }

  protected renderForm(): string {
    const usernameInput = new AuthFormInput({
      id: 'username',
      name: 'username',
      type: 'text',
      required: true,
      label: i18n.t('auth.login.username'),
      placeholder: i18n.t('auth.login.usernamePlaceholder')
    });

    const passwordInput = new AuthFormInput({
      id: 'password',
      name: 'password',
      type: 'password',
      required: true,
      label: i18n.t('auth.login.password'),
      placeholder: i18n.t('auth.login.passwordPlaceholder')
    });

    return `
      <div class="space-y-4">
        ${usernameInput.render()}
        ${passwordInput.render()}
      </div>


      ${this.submitButton.render()}
    `;
  }



  protected async handleFormSubmit(formData: FormData): Promise<void> {
    const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;
    const loginText = document.getElementById('login-submit-text') as HTMLSpanElement;
    const loginSpinner = document.getElementById('login-submit-spinner') as HTMLElement;

    // Show loading state
    submitBtn.disabled = true;
    loginText.textContent = i18n.t('common.loading');
    loginSpinner.classList.remove('hidden');

    try {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      await authService.login(username, password);
      
      // Si on arrive ici, la connexion s'est bien passée sans 2FA
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
      
    } catch (error) {
      if (error instanceof TwoFactorRequiredError) {
        // ✅ 2FA requis - ouvrir le modal
        this.handle2FARequired(error.userId);
      } else {
        this.errorMessage.show((error as Error).message);
      }
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      loginText.textContent = i18n.t('auth.login.loginButton');
      loginSpinner.classList.add('hidden');
    }
  }

  // ✅ Nouvelle méthode pour gérer le 2FA
  private handle2FARequired(userId: number): void {
    const modal = new TwoFactorModal(
      'login', // Nouveau mode pour la connexion
      async (code: string) => {
        try {
          await authService.loginWith2FA(userId, code);
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
        } catch (error) {
          throw new Error((error as Error).message);
        }
      },
      () => {
        // Cancel callback - retour au formulaire de connexion
        console.log('2FA cancelled');
      }
    );
    
    modal.show();
  }

  protected renderFooterLinks(): string {
    return `
      <div class="text-center">
        <span class="text-gray-400">${i18n.t('auth.login.noAccount')}</span>
        <a href="#" id="register-link" class="ml-2 text-primary-400 hover:text-primary-300">
          ${i18n.t('auth.login.signUp')}
        </a>
      </div>
    `;
  }

  protected bindEvents(): void {
    super.bindEvents();

    // Additional events specific to login
    document.getElementById('register-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/register' }));
    });

    document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: Implement forgot password
    });
  }
}