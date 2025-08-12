import { i18n } from '@services/i18n';
import { authService } from '@services/auth';

export class HomePage {
    private languageListener: (() => void) | null = null;
    private authListener: (() => void) | null = null;

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

        // ✅ NOUVEAU : Ajouter le listener pour les changements d'authentification
        this.authListener = () => {
            this.render(element);
            this.bindEvents();
        };
        window.addEventListener('authStateChanged', this.authListener);

        this.bindEvents();
    }

    private render(element: Element): void {
        const isAuthenticated = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        console.log('Rendering HomePage:', { isAuthenticated, currentUser });

        element.innerHTML = `
            <div class="text-center">
                <h1 class="text-6xl font-game font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ${isAuthenticated && currentUser 
                        ? `${i18n.t('home.welcome')} ${currentUser.username}!` 
                        : i18n.t('home.welcome')
                    }
                </h1>
                
                <p class="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                    ${i18n.t('home.description')}
                </p>

                ${isAuthenticated ? this.renderUserStats() : ''}

                <div class="grid md:grid-cols-4 gap-8 mb-12">
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🏓</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.multiplayer.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.multiplayer.description')}</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🎮</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.singleplayer.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.singleplayer.description')}</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">🏆</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.tournaments.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.tournaments.description')}</p>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <div class="text-4xl mb-4">💬</div>
                        <h3 class="text-xl font-semibold mb-2">${i18n.t('home.features.chat.title')}</h3>
                        <p class="text-gray-400">${i18n.t('home.features.chat.description')}</p>
                    </div>
                </div>

                ${this.renderActionButtons(isAuthenticated)}
            </div>
        `;
    }

    private renderUserStats(): string {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.stats) return '';

        return `
            <div class="bg-gray-800 p-6 rounded-lg mb-8 max-w-4xl mx-auto">
                <h2 class="text-2xl font-semibold mb-4 text-primary-400">${i18n.t('home.stats.title', 'Your Stats')}</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <div class="text-2xl font-bold text-green-400">${currentUser.stats.wins}</div>
                        <div class="text-gray-400 text-sm">${i18n.t('home.stats.wins', 'Wins')}</div>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <div class="text-2xl font-bold text-red-400">${currentUser.stats.losses}</div>
                        <div class="text-gray-400 text-sm">${i18n.t('home.stats.losses', 'Losses')}</div>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-400">${currentUser.stats.winRate}%</div>
                        <div class="text-gray-400 text-sm">${i18n.t('home.stats.winRate', 'Win Rate')}</div>
                    </div>
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <div class="text-2xl font-bold text-purple-400">#${currentUser.stats.rank}</div>
                        <div class="text-gray-400 text-sm">${i18n.t('home.stats.rank', 'Rank')}</div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderActionButtons(isAuthenticated: boolean): string {
        if (isAuthenticated) {
            return `
                <div class="space-x-4">
                    <button id="play-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.play')}
                    </button>
                    <button id="profile-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('nav.profile')}
                    </button>
                    <button id="tournaments-btn" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.tournaments', 'Tournaments')}
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="space-x-4">
                    <button id="login-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.login')}
                    </button>
                    <button id="register-btn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        ${i18n.t('home.buttons.register', 'Sign Up')}
                    </button>
                    
                </div>
            `;
        }
    }

    private bindEvents(): void {
        const isAuthenticated = authService.isAuthenticated();

        if (isAuthenticated) {
            // Boutons pour utilisateur connecté
            document.getElementById('play-btn')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
            });

            document.getElementById('profile-btn')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
            });

            document.getElementById('tournaments-btn')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/tournaments' }));
            });
        } else {
            // Boutons pour utilisateur non connecté
            document.getElementById('login-btn')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
            });

            document.getElementById('register-btn')?.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/register' }));
            });

        }
    }

    destroy(): void {
        // Cleanup des listeners
        if (this.languageListener) {
            window.removeEventListener('languageChanged', this.languageListener);
            this.languageListener = null;
        }
        
        if (this.authListener) {
            window.removeEventListener('authStateChanged', this.authListener);
            this.authListener = null;
        }
    }
}