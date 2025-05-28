// export class Footer {
//   mount(selector: string): void {
//     const element = document.querySelector(selector)
//     if (!element) return

//     element.innerHTML = `
//       <footer class="bg-gray-900 text-gray-400 py-6 text-center">
//         <span>&copy; ${new Date().getFullYear()} ft_transcendence. All rights reserved.</span>
//       </footer>
//     `
//   }
// }

import { i18n } from '@services/i18n';

export class Footer {
    mount(selector: string): void {
        const element = document.querySelector(selector);
        if (!element) return;

        this.render(element);
        this.bindEvents();

        // Écouter les changements de langue
        document.addEventListener('languageChanged', () => {
            this.render(element);
            this.bindEvents();
        });
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
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0
                                        0-4.74 0c-.164-.386-.398-.875-.608-1.25a.074.074 0 0 0-.079-.037A19.791 19.791 0 0 0 3.683 4.37a.074.074 0 0 0-.055.09c.05.21.11.415.176.615a18.27 18.27 0 0 0 .01 4.74c-.066.2-.126.405-.176.615a.074.074 0 0 0 .055.09c1.34.39 2.75.69 4.285.9a18.27 18.27 0 0 0 .01-4.74c1.34-.39 2.75-.69 4.285-.9a18.27 18.27 0 0 0 .01 4.74c1.535-.21 2.945-.51 4.285-.9a19.791 19.791 0 0 0 .055-4zM12 .5C5.925 .5 .5 5.925 .5 12S5.925 23.5 12 23.5s11.5-5.425 11.5-11S18.075 .5 12 .5z"/>
                                        <path d="M8.5 10.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" title="Twitter">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.178-1.559-3.594-1.559-2.717 0-4.926 2.209-4.926 4.926 0 .386.045.762.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.733-.666 1.587-.666 2.489 0 1.718.873 3.232 2.188 4.118-.807-.026-1.566-.248-2.228-.616v0c0 .021 0 .042 0 .064 0 2.398 1.703 4.397 3.96 4.85-.415.112-.852.171-1.303.171-.317 0-.626-.031-.927-.086a4.935 4.935 0 0 0 46045a9.87 9.87 0 0 1-6 .207c1 .621 2 .928 3 .928
                                        3.588 0 6.604-2.974 6.604-6.604 0-.1 0-.201-.007-.301A4.72 4.72 0 0 0 22.5 8.59c-.885.389-1.83.654-2.825.775a4.926 4.926 0 0 0-8.384 4.482c-4.092-.205-7.719-2.165-10.148-5.144a4.822 4.822 0 0 0-.664 2.475c0 1.71.87 3.213 2.188 4.098a4.935 4.935 0 0 1-2.228-.616v0c0 .021 0 .042 0 .064a4.926 4.926 0 0 0 3.946 4.826c-.415.112-.852.171-1.303.171-.317 0-.626-.031-.927-.086a9.87 9.87 0 0 0 6 .207c1 .621 2 .928 3 .928C20.08 21.5 24 .5z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" title="GitHub">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.23c-3.338.726-4.033-1.617-4.033-1.617-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.807 1.305 3.492.997a2.49 2.49 0 0 1 .75-1.557c-2.665-.306-5.467-1.334-5.467-5.93a4.63 4.63 0 0 1 1.233-3.208c-.123-.303-.534-1.524.117-3.176a10.45 10.45 0 0 1 3 .114c2 .114 4 .114 6 .114s4-.114 6-.114a10.45 10.45 0 0 1 3-.114c0 .114-.117 .303-.117 .303a4.63 4.63 0 0 1 1.233 3.208c0 .114-.117 .303-.117 .303a5
                                        .467 5.467 0 0 1-5.467 5.93c.306.261.546.726.546 1.557v2.23c0 .303.192.69.793.577A11.95 11.95 0 0 0 24 12c0-6.627-5.373-12-12-12zM9.333 18c-.667 0-1-.333-1-1s.333-1 1-1 1 .333 1 1-.333 1-1 1zm5.334 0c-.667 0-1-.333-1-1s.333-1 1-1 1 .333 1 1-.333 1-1 1z"/>
                                    </svg>
                                </a>
                                <a href="#" class="social-link" title="YouTube">
                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186c-.27-1.01-1.06-1.8-2.07-2.07C19.5 4 12 4 12 4s-7.5 0-9.43.116c-1.01.27-1.8 1.06-2.07 2.07C0 8.5 0 12 0 12s0 3.5.116 5.43c.27 1.01 1.06 1.8 2.07 2.07C4 20 12 20 12 20s7.5 0 9.43-.116c1.01-.27 1.8-1.06 2.07-2.07C24 15.5 24 12 24 12s0-3.5-.116-5.43zM9.75 15V9l6 3-6 3z"/>
                                    </svg>
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
        // Cleanup event listeners if needed
        const links = document.querySelectorAll('.footer-link');
        links.forEach(link => {
            link.removeEventListener('click', () => {});
        });

        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.removeEventListener('click', () => {});
        });
    }
}