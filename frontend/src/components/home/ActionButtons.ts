import { i18n } from '@/services/i18nService';
import type { ActionCallbacks } from '@/types/index.js';

export class ActionButtons
{
  /**
   * Constructeur des boutons d'action
   * @param isAuthenticated Si l'utilisateur est authentifié
   * @param callbacks Callbacks pour les actions
   */
  constructor(private isAuthenticated: boolean, private callbacks: ActionCallbacks)
  {
  }


  /**
   * Rend les boutons d'action
   */
  render(): string
  {
    if (this.isAuthenticated)
    {
      return `
        <div class="flex flex-wrap justify-center gap-4">
          <button id="play-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
            ${i18n.t('home.buttons.play')}
          </button>
          <button id="profile-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
            ${i18n.t('nav.profile')}
          </button>
          <button id="tournaments-btn" class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
            ${i18n.t('home.buttons.tournaments')}
          </button>
        </div>
      `;
    } else
    {
      return `
        <div class="flex flex-wrap justify-center gap-4">
          <button id="login-btn" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
            ${i18n.t('home.buttons.login')}
          </button>
          <button id="register-btn" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:transform hover:scale-105 shadow-lg">
            ${i18n.t('home.buttons.register')}
          </button>
        </div>
      `;
    }
  }

  /**
   * Attache les événements aux boutons
   */
  bindEvents(): void
  {
    if (this.isAuthenticated)
    {
      document.getElementById('play-btn')?.addEventListener('click', this.callbacks.onPlay || (() => {}));
      document.getElementById('profile-btn')?.addEventListener('click', this.callbacks.onProfile || (() => {}));
      document.getElementById('tournaments-btn')?.addEventListener('click', this.callbacks.onTournaments || (() => {}));
    } else
    {
      document.getElementById('login-btn')?.addEventListener('click', this.callbacks.onLogin || (() => {}));
      document.getElementById('register-btn')?.addEventListener('click', this.callbacks.onRegister || (() => {}));
    }
  }
}