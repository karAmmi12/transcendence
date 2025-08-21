import { i18n } from '@/services/i18nService';

export interface SubmitButtonConfig {
  id: string;
  textKey: string;
  loadingTextKey: string;
}

export class AuthSubmitButton {
  constructor(private config: SubmitButtonConfig) {}

  render(): string {
    return `
      <div>
        <button 
          type="submit" 
          id="${this.config.id}"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span id="${this.config.id}-spinner" class="hidden absolute left-3 top-1/2 transform -translate-y-1/2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </span>
          <span id="${this.config.id}-text">${i18n.t(this.config.textKey)}</span>
        </button>
      </div>
    `;
  }
}