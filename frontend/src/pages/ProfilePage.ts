import { i18n } from '@services/i18n';

export class ProfilePage {
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
    };
    window.addEventListener('languageChanged', this.languageListener);
  }

  private render(element: Element): void {
    element.innerHTML = `
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-8">${i18n.t('profile.title')}</h1>
        <p class="text-gray-300">${i18n.t('profile.stats.title')}</p>
      </div>
    `;
  }

  destroy(): void {
    if (this.languageListener) {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }
}