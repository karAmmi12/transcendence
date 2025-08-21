import { i18n } from '@/services/i18nService';
import { authService } from '@services/authService';
import { AuthPageBase } from '@components/auth/AuthPageBase';
import { AuthFormInput } from '@components/auth/AuthFormInput';
import { AuthSubmitButton } from '@components/auth/AuthSubmitButton';

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

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input 
            id="remember-me" 
            name="remember-me" 
            type="checkbox" 
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 bg-gray-700 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-300">
            ${i18n.t('auth.login.rememberMe')}
          </label>
        </div>
        
        <div class="text-sm">
          <a href="#" id="forgot-password-link" class="text-primary-400 hover:text-primary-300">
            ${i18n.t('auth.login.forgotPassword')}
          </a>
        </div>
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
    loginText.textContent = i18n.t('auth.login.loading');
    loginSpinner.classList.remove('hidden');

    try {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      
      await authService.login(username, password);
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      loginText.textContent = i18n.t('auth.login.submit');
      loginSpinner.classList.add('hidden');
    }
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