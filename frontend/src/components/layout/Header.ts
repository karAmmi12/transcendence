// export class Header {
//   mount(selector: string): void {
//     const element = document.querySelector(selector)
//     if (!element) return

//     element.innerHTML = `
//       <nav class="bg-gray-800 shadow-lg">
//         <div class="container mx-auto px-4">
//           <div class="flex justify-between items-center h-16">
//             <div class="flex items-center space-x-4">
//               <h1 class="text-2xl font-game font-bold text-primary-400">
//                 ft_transcendence
//               </h1>
//             </div>
            
//             <div class="hidden md:flex items-center space-x-6">
//               <a href="/" class="nav-link">Home</a>
//               <a href="/game" class="nav-link">Play</a>
//               <a href="/profile" class="nav-link">Profile</a>
//               <a href="/login" class="nav-link">Login</a>
//                 <a href="/settings" class="nav-link">Settings</a>
//             </div>
            
//             <button id="mobile-menu-btn" class="md:hidden text-white">
//               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
//               </svg>
//             </button>
//           </div>
          
//           <div id="mobile-menu" class="hidden md:hidden pb-4">
//             <a href="/" class="block py-2 nav-link">Home</a>
//             <a href="/game" class="block py-2 nav-link">Play</a>
//             <a href="/profile" class="block py-2 nav-link">Profile</a>
//             <a href="/login" class="block py-2 nav-link">Login</a>
//             <a href="/settings" class="block py-2 nav-link">Settings</a>
//           </div>
//         </div>
//       </nav>
//     `

//     this.bindEvents()
//   }

//   private bindEvents(): void {
//     // Mobile menu toggle
//     const menuBtn = document.getElementById('mobile-menu-btn')
//     const mobileMenu = document.getElementById('mobile-menu')
    
//     menuBtn?.addEventListener('click', () => {
//       mobileMenu?.classList.toggle('hidden')
//     })

//     // Navigation links
//     document.querySelectorAll('.nav-link').forEach(link => {
//       link.addEventListener('click', (e) => {
//         e.preventDefault()
//         const href = (e.target as HTMLAnchorElement).getAttribute('href')
//         if (href) {
//           window.dispatchEvent(new CustomEvent('navigate', { detail: href }))
//         }
//       })
//     })
//   }
// }
import { i18n } from '@services/i18n';

export class Header {
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
        const currentLanguage = i18n.getCurrentLanguage();
        element.innerHTML = `
            <nav class="bg-gray-800 shadow-lg">
                <div class="container mx-auto px-4">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-2xl font-game font-bold text-primary-400">
                                ft_transcendence
                            </h1>
                        </div>
                        
                        <div class="hidden md:flex items-center space-x-6">
                            <a href="/" class="nav-link" data-i18n="nav.home">${i18n.t('nav.home')}</a>
                            <a href="/game" class="nav-link" data-i18n="nav.play">${i18n.t('nav.play')}</a>
                            <a href="/profile" class="nav-link" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
                            <a href="/login" class="nav-link" data-i18n="nav.login">${i18n.t('nav.login')}</a>
                            
                            <!-- Sélecteur de langue -->
                            <div class="relative">
                                <button id="language-selector" class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                                    <span class="text-xl">${this.getFlagEmoji(currentLanguage)}</span>
                                    <span class="uppercase text-sm font-medium">${currentLanguage}</span>
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                                
                                <div id="language-dropdown" class="absolute right-0 mt-2 w-32 bg-gray-700 rounded-md shadow-lg opacity-0 invisible transition-all duration-200 z-50">
                                    <div class="py-1">
                                        <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="en">
                                            <span class="text-lg">🇺🇸</span>
                                            <span>English</span>
                                        </button>
                                        <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="fr">
                                            <span class="text-lg">🇫🇷</span>
                                            <span>Français</span>
                                        </button>
                                        <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="it">
                                            <span class="text-lg">🇮🇹</span>
                                            <span>Italiano</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button id="mobile-menu-btn" class="md:hidden text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>

                    <div id="mobile-menu" class="hidden md:hidden pb-4">
                        <a href="/" class="block py-2 nav-link" data-i18n="nav.home">${i18n.t('nav.home')}</a>
                        <a href="/game" class="block py-2 nav-link" data-i18n="nav.play">${i18n.t('nav.play')}</a>
                        <a href="/profile" class="block py-2 nav-link" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
                        <a href="/login" class="block py-2 nav-link" data-i18n="nav.login">${i18n.t('nav.login')}</a>
                    </div>
                </div>
            </nav>
        `;
    }

    private bindEvents(): void {
        // Mobile menu toggle
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        menuBtn?.addEventListener('click', () => {
            mobileMenu?.classList.toggle('hidden');
        });

        // Language selector
        const languageSelector = document.getElementById('language-selector');
        const languageDropdown = document.getElementById('language-dropdown');
        
        languageSelector?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (languageDropdown?.classList.contains('opacity-0')) {
                languageDropdown.classList.remove('opacity-0', 'invisible');
                languageDropdown.classList.add('opacity-100', 'visible');
            } else {
                languageDropdown?.classList.add('opacity-0', 'invisible');
                languageDropdown?.classList.remove('opacity-100', 'visible');
            }
        });

        // Language options
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = (e.currentTarget as HTMLElement).dataset.lang;
                if (lang) {
                    i18n.setLanguage(lang);
                    languageDropdown?.classList.add('opacity-0', 'invisible');
                    languageDropdown?.classList.remove('opacity-100', 'visible');
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            languageDropdown?.classList.add('opacity-0', 'invisible');
            languageDropdown?.classList.remove('opacity-100', 'visible');
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = (e.target as HTMLAnchorElement).getAttribute('href');
                if (href) {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: href }));
                }
            });
        });
    }

    private getFlagEmoji(lang: string): string {
        const flags = {
            'en': '🇺🇸',
            'fr': '🇫🇷',
            'it': '🇮🇹'
        };
        return flags[lang as keyof typeof flags] || '🇺🇸';
    }


    destroy(): void {
        if (this.languageListener) {
        window.removeEventListener('languageChanged', this.languageListener);
        this.languageListener = null;
        }
    }
}