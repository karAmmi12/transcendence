import { i18n } from '@/services/i18nService';

export class OAuthButtons {
  render(): string {
    return `
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
    `;
  }

  bindEvents(onOAuth: (provider: string) => void): void {
    document.getElementById('oauth-42')?.addEventListener('click', () => {
      onOAuth('42');
    });

    document.getElementById('oauth-google')?.addEventListener('click', () => {
      onOAuth('google');
    });
  }
}