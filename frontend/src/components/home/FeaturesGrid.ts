import { i18n } from '@services/i18n';

export class FeaturesGrid {
  render(): string {
    return `
      <div class="grid md:grid-cols-4 gap-8 mb-12">
        ${this.renderFeature('🏓', 'multiplayer')}
        ${this.renderFeature('🎮', 'singleplayer')}
        ${this.renderFeature('🏆', 'tournaments')}
        ${this.renderFeature('💬', 'chat')}
      </div>
    `;
  }

  private renderFeature(icon: string, key: string): string {
    return `
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 border border-gray-700 hover:border-primary-500">
        <div class="text-4xl mb-4 text-center">${icon}</div>
        <h3 class="text-xl font-semibold mb-2 text-center">${i18n.t(`home.features.${key}.title`)}</h3>
        <p class="text-gray-400 text-center">${i18n.t(`home.features.${key}.description`)}</p>
      </div>
    `;
  }
}