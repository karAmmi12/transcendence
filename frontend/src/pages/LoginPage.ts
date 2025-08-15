import { i18n } from '@services/i18n';
import { authService } from '@services/authService';

export class LoginPage {
  private languageListener: (() => void) | null = null;

  mount(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element);

    // Nettoie l'ancien listener si besoin
    this.destroy();

    // Ajoute le listener pour le changement de langue
    this.languageListener = () => {
      this.render(element);
      this.bindEvents();
    };

    window.addEventListener('languageChanged', this.languageListener);
    this.bindEvents();
  }

  private render(element: Element): void {
    element.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
              ${i18n.t('auth.login.title')}
            </h2>
          </div>
          
          <!-- Message d'erreur -->
          <div id="error-message" class="hidden bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative">
            <span id="error-description"></span>
          </div>

          <form id="login-form" class="mt-8 space-y-6">
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.login.username')}
                </label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.login.usernamePlaceholder')}"
                />
              </div>
              
              <div>
                <label for="password" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.login.password')}
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.login.passwordPlaceholder')}"
                />
                
              </div>
              
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

            <div>
              <button 
                type="submit" 
                id="login-submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span id="login-spinner" class="hidden absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                <span id="login-text">${i18n.t('auth.login.submit')}</span>
              </button>
            </div>

            <!-- OAuth Buttons -->
            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-900 text-gray-400">${i18n.t('auth.login.or')}</span>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="oauth-42"
                  class="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600"
                >
                  ${i18n.t('auth.login.oauth42')}
                </button>
                
                <button
                  type="button"
                  id="oauth-google"
                  class="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600"
                >
                  ${i18n.t('auth.login.google')}
                </button>
              </div>
            </div>

            <div class="text-center">
              <span class="text-gray-400">${i18n.t('auth.login.noAccount')}</span>
              <a href="#" id="register-link" class="ml-2 text-primary-400 hover:text-primary-300">
                ${i18n.t('auth.login.signUp')}
              </a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const form = document.getElementById('login-form') as HTMLFormElement;
    const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;
    const loginText = document.getElementById('login-text') as HTMLSpanElement;
    const loginSpinner = document.getElementById('login-spinner') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLElement;

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show loading state
      submitBtn.disabled = true;
      loginText.textContent = i18n.t('auth.login.loading');
      loginSpinner.classList.remove('hidden');
      errorMessage.classList.add('hidden');

      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      try {
        // Appel à l'API Fastify via le service
        await authService.login(username, password);
        
        // Rediriger vers le dashboard
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
        
      } catch (error) {
        this.showError((error as Error).message);
      } finally {
        // Reset loading state
        submitBtn.disabled = false;
        loginText.textContent = i18n.t('auth.login.submit');
        loginSpinner.classList.add('hidden');
      }
    });

    // OAuth buttons
    document.getElementById('oauth-42')?.addEventListener('click', () => {
      this.handleOAuth('42');
    });

    document.getElementById('oauth-google')?.addEventListener('click', () => {
      this.handleOAuth('google');
    });

    // Links
    document.getElementById('register-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/register' }));
    });

    document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: Implement forgot password
    });
  }

  private handleOAuth(provider: string): void 
  {
    if (provider === 'google') 
      {
        console.log('SIUUUU INSIDE');
        // Utiliser le service AuthService pour Google OAuth
        authService.initiateGoogleLogin();
    }else
      console.log('OAuth Google echec');
  }

  private showError(message: string): void {
    const errorMessage = document.getElementById('error-message');
    const errorDescription = document.getElementById('error-description');
    
    if (errorMessage && errorDescription) {
      errorDescription.textContent = message;
      errorMessage.classList.remove('hidden');
    }
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}