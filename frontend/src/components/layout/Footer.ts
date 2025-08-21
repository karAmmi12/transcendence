import { i18n } from '@/services/i18nService';

export class Footer {
    private languageListener: (() => void) | null = null;

    mount(selector: string): void {
        const element = document.querySelector(selector);
        if (!element) return;

        this.render(element);
        this.bindEvents();

        // Nettoie l'ancien listener si besoin
        this.destroy();

        // Ajoute le listener pour le changement de langue
        this.languageListener = () => {
            this.render(element);
            this.bindEvents();
        };
        window.addEventListener('languageChanged', this.languageListener);
    }

    private render(element: Element): void {
        const currentYear = new Date().getFullYear();

        element.innerHTML = `
            <footer class="bg-gray-800 border-t border-gray-700 mt-auto">
                <div class="container mx-auto px-4 py-8">
                    <div class="grid md:grid-cols-4 gap-8">
                        <!-- Logo et description -->
                        <div class="col-span-1">
                            <h3 class="text-xl font-game font-bold text-primary-400 mb-4">
                                ft_transcendence
                            </h3>
                            <p class="text-gray-400 text-sm leading-relaxed">
                                ${i18n.t('footer.description')}
                            </p>
                        </div>
                        <!-- Liens de navigation -->
                        <div class="col-span-1">
                            <h4 class="text-lg font-semibold text-white mb-4">
                                ${i18n.t('footer.navigation.title')}
                            </h4>
                            <ul class="space-y-2">
                                <li>
                                    <a href="/" class="footer-link" data-i18n="nav.home">
                                        ${i18n.t('nav.home')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/game" class="footer-link" data-i18n="nav.play">
                                        ${i18n.t('nav.play')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/tournaments" class="footer-link">
                                        ${i18n.t('footer.navigation.tournaments')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/leaderboard" class="footer-link">
                                        ${i18n.t('footer.navigation.leaderboard')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <!-- Support -->
                        <div class="col-span-1">
                            <h4 class="text-lg font-semibold text-white mb-4">
                                ${i18n.t('footer.support.title')}
                            </h4>
                            <ul class="space-y-2">
                                <li>
                                    <a href="/help" class="footer-link">
                                        ${i18n.t('footer.support.help')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/faq" class="footer-link">
                                        ${i18n.t('footer.support.faq')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/contact" class="footer-link">
                                        ${i18n.t('footer.support.contact')}
                                    </a>
                                </li>
                                <li>
                                    <a href="/rules" class="footer-link">
                                        ${i18n.t('footer.support.rules')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <!-- Réseaux sociaux -->
                        <div class="col-span-1">
                            <h4 class="text-lg font-semibold text-white mb-4">
                                ${i18n.t('footer.social.title')}
                            </h4>
                            <div class="flex space-x-4">
                                <a href="#" class="social-link" title="Discord">
                                    <!-- ...SVG Discord... -->
                                </a>
                                <a href="#" class="social-link" title="Twitter">
                                    <!-- ...SVG Twitter... -->
                                </a>
                                <a href="#" class="social-link" title="GitHub">
                                    <!-- ...SVG GitHub... -->
                                </a>
                                <a href="#" class="social-link" title="YouTube">
                                    <!-- ...SVG YouTube... -->
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 text-center text-gray-500 text-sm">
                        &copy; ${currentYear} ft_transcendence. ${i18n.t('footer.allRightsReserved')}
                    </div>
                </div>
            </footer>
        `;
    }

    private bindEvents(): void {
        const links = document.querySelectorAll('.footer-link');
        links.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const href = (event.target as HTMLAnchorElement).getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
            });
        });

        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const href = (event.target as HTMLAnchorElement).getAttribute('href');
                if (href) {
                    window.open(href, '_blank');
                }
            });
        });
    }

    destroy(): void {
        if (this.languageListener) {
            window.removeEventListener('languageChanged', this.languageListener);
            this.languageListener = null;
        }
    }
}