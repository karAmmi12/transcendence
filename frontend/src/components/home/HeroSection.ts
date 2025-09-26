import { i18n } from '@/services/i18nService.js';

export class HeroSection {
  render(): string {
    return `
      <div class="text-center mb-12 md:mb-16">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-game mb-4 md:mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent leading-tight">
          ${i18n.t('app.title')}
        </h1>
        <p class="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
          ${i18n.t('home.description')}
        </p>
      </div>
    `;
  }
}