// ==========================================
// PAGE DE CONNEXION - Gestion de l'authentification utilisateur
// ==========================================
// Permet aux utilisateurs de se connecter avec support 2FA et OAuth

// ==========================================
// IMPORTS
// ==========================================
import { i18n } from '@/services/i18nService';
import { authService } from '@services/authService';
import { AuthPageBase } from '@components/auth/AuthPageBase';
import { AuthFormInput } from '@components/auth/AuthFormInput';
import { AuthSubmitButton } from '@components/auth/AuthSubmitButton';

// ==========================================
// IMPORTS SPÉCIALISÉS
// ==========================================
import { TwoFactorModal } from '../components/auth/TwoFactorModal.js';
import { TwoFactorRequiredError } from '../types/errors.js';

// ==========================================
// CLASSE PRINCIPALE
// ==========================================
export class LoginPage extends AuthPageBase
{
  // ==========================================
  // 🔧 PROPRIÉTÉS PRIVÉES
  // ==========================================

  // Composants d'interface
  private submitButton: AuthSubmitButton;

  // ==========================================
  // 🏗️ CONSTRUCTEUR & INITIALISATION
  // ==========================================

  constructor()
  {
    super();
    this.submitButton = new AuthSubmitButton({
      id: 'login-submit',
      textKey: 'auth.login.submit',
      loadingTextKey: 'auth.login.loading'
    });
  }

  // ==========================================
  // MÉTHODES DE CONFIGURATION
  // ==========================================

  protected getTitle(): string
  {
    return i18n.t('auth.login.title');
  }

  // ==========================================
  // MÉTHODES DE RENDU
  // ==========================================

  protected renderForm(): string
  {
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

  protected renderFooterLinks(): string
  {
    return `
      <div class="text-center">
        <span class="text-gray-400">${i18n.t('auth.login.noAccount')}</span>
        <a href="#" id="register-link" class="ml-2 text-primary-400 hover:text-primary-300">
          ${i18n.t('auth.login.signUp')}
        </a>
      </div>
    `;
  }

  // ==========================================
  // GESTION DES ÉVÉNEMENTS
  // ==========================================

  protected bindEvents(): void
  {
    super.bindEvents();

    // Événements spécifiques à la connexion
    document.getElementById('register-link')?.addEventListener('click', (e) =>
    {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/register' }));
    });

    document.getElementById('forgot-password-link')?.addEventListener('click', (e) =>
    {
      e.preventDefault();
      // TODO: Implémenter la fonctionnalité mot de passe oublié
    });
  }

  // ==========================================
  // GESTION DE L'AUTHENTIFICATION
  // ==========================================

  protected async handleFormSubmit(formData: FormData): Promise<void>
  {
    const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;
    const loginText = document.getElementById('login-submit-text') as HTMLSpanElement;
    const loginSpinner = document.getElementById('login-submit-spinner') as HTMLElement;

    // Afficher l'état de chargement
    submitBtn.disabled = true;
    loginText.textContent = i18n.t('common.loading');
    loginSpinner.classList.remove('hidden');

    try
    {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      await authService.login(username, password);

      // Si on arrive ici, la connexion s'est bien passée sans 2FA
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));

    }
    catch (error)
    {
      if (error instanceof TwoFactorRequiredError)
      {
        // ✅ 2FA requis - ouvrir le modal
        this.handle2FARequired(error.userId);
      }
      else
      {
        this.errorMessage.show((error as Error).message);
        throw error;
      }
    }
    finally
    {
      // Réinitialiser l'état de chargement
      submitBtn.disabled = false;
      loginText.textContent = i18n.t('auth.login.loginButton');
      loginSpinner.classList.add('hidden');
    }
  }

  // ==========================================
  // GESTION DE L'AUTHENTIFICATION À DEUX FACTEURS
  // ==========================================

  private handle2FARequired(userId: number): void
  {
    const modal = new TwoFactorModal(
      'login', // Mode pour la connexion
      async (code: string) =>
      {
        try
        {
          await authService.loginWith2FA(userId, code);
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
        }
        catch (error)
        {
          throw new Error((error as Error).message);
        }
      },
      () =>
      {
        // Callback d'annulation - retour au formulaire de connexion
        console.log('2FA annulé');
      }
    );

    modal.show();
  }
}