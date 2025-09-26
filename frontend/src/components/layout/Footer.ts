import { i18n } from '@/services/i18nService';

export class Footer {
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
        const currentYear = new Date().getFullYear();

        element.innerHTML = `
            <footer class="bg-gray-800 border-t border-gray-700 mt-auto">
                <div class="container mx-auto px-4 py-6">
                    <div class="text-center">
                        <!-- Logo et description -->
                        <h3 class="text-lg font-game font-bold text-primary-400 mb-2">
                            ft_transcendence
                        </h3>
                        <p class="text-gray-400 text-sm mb-4">
                            ${i18n.t('footer.description')}
                        </p>
                        
                        <!-- Copyright -->
                        <div class="pt-4 border-t border-gray-700 text-gray-500 text-sm">
                            &copy; ${currentYear} ft_transcendence. ${i18n.t('footer.allRightsReserved')}
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    destroy(): void {
        if (this.languageListener) {
            window.removeEventListener('languageChanged', this.languageListener);
            this.languageListener = null;
        }
    }
}