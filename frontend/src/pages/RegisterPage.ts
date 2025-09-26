import { i18n } from '@/services/i18nService';
import { authService } from '@services/authService';
import { AuthPageBase } from '@components/auth/AuthPageBase';
import { AuthFormInput } from '@components/auth/AuthFormInput';
import { AuthSubmitButton } from '@components/auth/AuthSubmitButton';

export class RegisterPage extends AuthPageBase {
  private submitButton: AuthSubmitButton;

  constructor() {
    super();
    this.submitButton = new AuthSubmitButton({
      id: 'register-submit',
      textKey: 'auth.register.registerButton',
      loadingTextKey: 'common.loading'
    });
  }

  protected getTitle(): string {
    return i18n.t('auth.register.title');
  }

  protected renderForm(): string {
    const usernameInput = new AuthFormInput({
      id: 'username',
      name: 'username',
      type: 'text',
      required: true,
      label: i18n.t('auth.register.username'),
      placeholder: i18n.t('auth.register.usernamePlaceholder')
    });

    const emailInput = new AuthFormInput({
      id: 'email',
      name: 'email',
      type: 'email',
      required: true,
      label: i18n.t('auth.register.email'),
      placeholder: i18n.t('auth.register.emailPlaceholder')
    });

    const passwordInput = new AuthFormInput({
      id: 'password',
      name: 'password',
      type: 'password',
      required: true,
      label: i18n.t('auth.register.password'),
      placeholder: i18n.t('auth.register.passwordPlaceholder')
    });

    const confirmPasswordInput = new AuthFormInput({
      id: 'confirmPassword',
      name: 'confirmPassword',
      type: 'password',
      required: true,
      label: i18n.t('auth.register.confirmPassword'),
      placeholder: i18n.t('auth.register.confirmPasswordPlaceholder')
    });

    return `
      <div class="space-y-4">
        ${usernameInput.render()}
        ${emailInput.render()}
        ${passwordInput.render()}
        ${confirmPasswordInput.render()}
      </div>

      ${this.submitButton.render()}
    `;
  }

  protected async handleFormSubmit(formData: FormData): Promise<void> {
    const submitBtn = document.getElementById('register-submit') as HTMLButtonElement;
    const registerText = document.getElementById('register-submit-text') as HTMLSpanElement;
    const registerSpinner = document.getElementById('register-submit-spinner') as HTMLElement;

    // Show loading state
    submitBtn.disabled = true;
    registerText.textContent = i18n.t('common.loading');
    registerSpinner.classList.remove('hidden');

    try {
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Validation côté client
      if (password !== confirmPassword) {
        throw new Error(i18n.t('auth.errors.passwordMismatch'));
      }

      await authService.register(username, email, password);
    } finally {
      // Reset loading state
      submitBtn.disabled = false;
      registerText.textContent = i18n.t('auth.register.registerButton');
      registerSpinner.classList.add('hidden');
    }
  }

  protected renderFooterLinks(): string {
    return `
      <div class="text-center">
        <span class="text-gray-400">${i18n.t('auth.register.haveAccount')}</span>
        <a href="#" id="login-link" class="ml-2 text-primary-400 hover:text-primary-300">
          ${i18n.t('auth.register.signIn')}
        </a>
      </div>
    `;
  }

  protected bindEvents(): void {
    super.bindEvents();

    // Additional events specific to register
    document.getElementById('login-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
    });
  }
}