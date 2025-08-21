import { i18n } from '@/services/i18nService.js';
import type { User } from '../../types/index.js';

export class HeroSection {
  constructor(
    private isAuthenticated: boolean,
    private user: User | null
  ) {}

  render(): string {
    const title = this.isAuthenticated && this.user 
      ? `${i18n.t('home.welcome')} ${this.user.username}!`
      : i18n.t('home.welcome');

    return `
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-game font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
          ${title}
        </h1>
        <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          ${i18n.t('home.description')}
        </p>
      </div>
    `;
  }
}