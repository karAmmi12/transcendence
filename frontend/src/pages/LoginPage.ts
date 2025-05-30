

import { i18n } from '@services/i18n';

export class LoginPage {

    private languageListener: (() => void) | null = null;

    mount(selector: string): void {
        const element = document.querySelector(selector);
        if (!element) return;

        this.render(element);

        this.render(element);

        // Nettoie l'ancien listener si besoin
        this.destroy();

        // Ajoute le listener pour le changement de langue
        this.languageListener = () => {
            this.render(element);
        };

        // Écouter les changements de langue
        window.addEventListener('languageChanged', this.languageListener);
        this.bindEvents();
    }

    private render(element: Element): void {
        element.innerHTML = `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 class="text-3xl font-game font-bold text-center mb-6 text-primary-400">
                        ${i18n.t('auth.login.title')}
                    </h2>

                    <form id="login-form" class="space-y-6">
                        <div>
                            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
                                ${i18n.t('auth.login.username')}
                            </label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                required
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="${i18n.t('auth.login.usernamePlaceholder')}"
                            >
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                                ${i18n.t('auth.login.password')}
                            </label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                required
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="${i18n.t('auth.login.passwordPlaceholder')}"
                            >
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <input 
                                    id="remember-me" 
                                    name="remember-me" 
                                    type="checkbox" 
                                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-gray-700"
                                >
                                <label for="remember-me" class="ml-2 block text-sm text-gray-300">
                                    ${i18n.t('auth.login.rememberMe')}
                                </label>
                            </div>

                            <div class="text-sm">
                                <a href="#" class="font-medium text-primary-400 hover:text-primary-300" id="forgot-password-link">
                                    ${i18n.t('auth.login.forgotPassword')}
                                </a>
                            </div>
                        </div>

                        <div>
                            <button 
                                type="submit" 
                                id="login-submit"
                                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                                <span id="login-text">${i18n.t('auth.login.submit')}</span>
                                <svg id="login-spinner" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Divider -->
                        <div class="mt-6">
                            <div class="relative">
                                <div class="absolute inset-0 flex items-center">
                                    <div class="w-full border-t border-gray-600"></div>
                                </div>
                                <div class="relative flex justify-center text-sm">
                                    <span class="px-2 bg-gray-800 text-gray-400">${i18n.t('auth.login.or')}</span>
                                </div>
                            </div>
                        </div>

                        <!-- OAuth buttons -->
                        <div class="mt-6 space-y-3">
                            <button 
                                type="button" 
                                id="oauth-42"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                            >
                                <span class="mr-2">🎓</span>
                                ${i18n.t('auth.login.oauth42')}
                            </button>

                            <button 
                                type="button" 
                                id="oauth-google"
                                class="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                            >
                                <span class="mr-2">🔍</span>
                                ${i18n.t('auth.login.google')}
                            </button>
                        </div>
                    </form>

                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-400">
                            ${i18n.t('auth.login.noAccount')}
                            <a href="/register" class="font-medium text-primary-400 hover:text-primary-300" id="register-link">
                                ${i18n.t('auth.login.signUp')}
                            </a>
                        </p>
                    </div>
                </div>

                <!-- Error message -->
                <div id="error-message" class="mt-4 p-4 bg-red-900 border border-red-700 rounded-md hidden">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-400" id="error-title">
                                ${i18n.t('auth.errors.loginFailed')}
                            </h3>
                            <div class="mt-2 text-sm text-red-300" id="error-description">
                            </div>
                        </div>
                    </div>
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
            const credentials = {
                username: formData.get('username') as string,
                password: formData.get('password') as string,
                rememberMe: formData.get('remember-me') === 'on'
            };

            try {
                // Simuler l'appel API
                await this.simulateLogin(credentials);
                
                // Rediriger vers le dashboard
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/dashboard' }));
                
            } catch (error) {
                this.showError(error as string);
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
            window.dispatchEvent(new CustomEvent('navigate', { detail: '/forgot-password' }));
        });
    }

    private async simulateLogin(credentials: any): Promise<void> {
        // Simulation d'un délai d'API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulation de validation
        if (!credentials.username || !credentials.password) {
            throw i18n.t('auth.errors.missingFields');
        }
        
        if (credentials.username === 'error') {
            throw i18n.t('auth.errors.invalidCredentials');
        }
        
        // Succès simulé
        console.log('Login successful:', credentials);
    }

    private handleOAuth(provider: string): void {
        console.log(`OAuth login with ${provider}`);
        // Ici vous implémenterez la logique OAuth
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
        // Cleanup if needed
        if (this.languageListener) {
            window.removeEventListener('languageChanged', this.languageListener);
            this.languageListener = null;
        }
    }
}