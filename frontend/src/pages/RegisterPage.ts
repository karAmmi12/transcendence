import { i18n } from '@services/i18n';
import { authService } from '@services/auth';

export class RegisterPage {
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
              ${i18n.t('auth.register.title')}
            </h2>
          </div>
          
          <!-- Message d'erreur -->
          <div id="error-message" class="hidden bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative">
            <span id="error-description"></span>
          </div>

          <form id="register-form" class="mt-8 space-y-6">
            <div class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.register.username')}
                </label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.register.usernamePlaceholder')}"
                />
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.register.email')}
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.register.emailPlaceholder')}"
                />
              </div>
              
              <div>
                <label for="password" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.register.password')}
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.register.passwordPlaceholder')}"
                />
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-300">
                  ${i18n.t('auth.register.confirmPassword')}
                </label>
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="${i18n.t('auth.register.confirmPasswordPlaceholder')}"
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                id="register-submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span id="register-spinner" class="hidden absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                <span id="register-text">${i18n.t('auth.register.registerButton')}</span>
              </button>
            </div>

            <div class="text-center">
              <span class="text-gray-400">${i18n.t('auth.register.haveAccount')}</span>
              <a href="#" id="login-link" class="ml-2 text-primary-400 hover:text-primary-300">
                ${i18n.t('auth.register.signIn')}
              </a>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const form = document.getElementById('register-form') as HTMLFormElement;
    const submitBtn = document.getElementById('register-submit') as HTMLButtonElement;
    const registerText = document.getElementById('register-text') as HTMLSpanElement;
    const registerSpinner = document.getElementById('register-spinner') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLElement;

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Show loading state
      submitBtn.disabled = true;
      registerText.textContent = i18n.t('common.loading');
      registerSpinner.classList.remove('hidden');
      errorMessage.classList.add('hidden');

      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      try {
        // Validation côté client
        if (password !== confirmPassword) {
          throw new Error(i18n.t('auth.errors.passwordMismatch'));
        }

        // Appel à l'API Fastify via le service
        await authService.register(username, email, password);
        
        // Rediriger vers le dashboard
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/' }));
        
      } catch (error) {
        this.showError((error as Error).message);
      } finally {
        // Reset loading state
        submitBtn.disabled = false;
        registerText.textContent = i18n.t('auth.register.registerButton');
        registerSpinner.classList.add('hidden');
      }
    });

    // Links
    document.getElementById('login-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
    });
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