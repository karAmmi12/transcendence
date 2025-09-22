import { i18n } from '@/services/i18nService';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';

export class Header
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private languageListener: (() => void) | null = null;

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Monte le header dans l'élément spécifié
   */
  mount(selector: string): void
  {
    const element = document.querySelector(selector);
    if (!element) return;

    this.render(element);
    this.bindEvents();

    // Nettoie l'ancien listener si besoin
    this.destroy();

    // Ajoute le listener pour le changement de langue
    this.languageListener = () =>
    {
      this.render(element);
      this.bindEvents();
    };
    window.addEventListener('languageChanged', this.languageListener);

    // ✅ Écouter les changements d'authentification avec un délai pour permettre la synchronisation
    window.addEventListener('authStateChanged', () =>
    {
        // Petit délai pour permettre la mise à jour des données utilisateur
        setTimeout(() =>
        {
            this.render(element);
            this.bindEvents();
        }, 100);
    });
  }

  /**
   * Nettoie les ressources du header
   */
  destroy(): void
  {
    if (this.languageListener)
    {
      window.removeEventListener('languageChanged', this.languageListener);
      this.languageListener = null;
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE RENDU
  // ==========================================

  /**
   * Rend le header
   */
  private render(element: Element): void
  {
    const currentLanguage = i18n.getCurrentLanguage();
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

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

            ${isAuthenticated && currentUser ? `
                <!-- Utilisateur connecté -->
                <a href="/profile" class="nav-link" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>

                <!-- Profil utilisateur avec avatar et nom -->
                <div class="flex items-center space-x-3 ml-4">
                  <div class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors header-user-profile">
                    <img
                      src="${userService.getAvatarUrl(currentUser.avatarUrl)}"
                      alt="${currentUser.username}"
                      class="w-8 h-8 rounded-full object-cover border-2 border-gray-600 hover:border-primary-500 transition-colors header-user-avatar"
                      onerror="this.src='/images/default-avatar.png'"
                    />
                    <span class="font-medium hidden lg:inline">${currentUser.username}</span>
                    <div class="w-2 h-2 ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full"></div>
                  </div>

                  <button id="logout-btn" class="nav-link text-red-400 hover:text-red-300 ml-2" data-i18n="nav.logout">
                    ${i18n.t('nav.logout')}
                  </button>
                </div>
            ` : `
                <!-- Utilisateur déconnecté -->
                <a href="/login" class="nav-link" data-i18n="nav.login">${i18n.t('nav.login')}</a>
            `}

            <!-- Sélecteur de langue -->
            <div class="relative">
                <button id="language-selector" class="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <span class="text-xl">${this.getFlagEmoji(currentLanguage)}</span>
                <span class="uppercase text-sm font-medium ${currentLanguage === 'kab-tfng' ? 'tifinagh-text' : ''}">${this.getLanguageDisplayName(currentLanguage)}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                </button>

                <div id="language-dropdown" class="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg opacity-0 invisible transition-all duration-200 z-50">
                <div class="py-1">
                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="en">
                    <span class="text-lg">🇬🇧</span>
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
                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="es">
                    <span class="text-lg">🇪🇸</span>
                    <span>Español</span>
                    </button>
                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="kab">
                    <span class="text-lg flex items-center">
                        <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" width="900px" height="600px" id="Berber_flag">
                        <g>
                            <rect fill="#0090DA" width="900" height="200"/>
                            <rect fill="#78BE20" y="200" width="900" height="200"/>
                            <rect fill="#FEDD00" y="400" width="900" height="200"/>
                            <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966 "/>
                            <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893l0 -0.000307692z"/>
                            <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                        </g>
                        </svg>
                    </span>
                    <span>Taqbaylit</span>
                    </button>

                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="kab-tfng">
                    <span class="text-lg flex items-center">
                        <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" width="900px" height="600px" id="Berber_flag_tfng">
                        <g>
                            <rect fill="#0090DA" width="900" height="200"/>
                            <rect fill="#78BE20" y="200" width="900" height="200"/>
                            <rect fill="#FEDD00" y="400" width="900" height="200"/>
                            <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966 "/>
                            <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893l0 -0.000307692z"/>
                            <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                        </g>
                        </svg>
                    </span>
                    <span class="tifinagh-text">ⵜⴰⵇⴱⴰⵢⵍⵉⵜ</span>
                    </button>

                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="ar">
                    <span class="text-lg">🇸🇦</span>
                    <span>العربية</span>
                    </button>
                    <button class="language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="sg">
                    <span class="text-lg">🇨🇫</span>
                    <span>Sango</span>
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

        <!-- Menu mobile -->
        <div id="mobile-menu" class="hidden md:hidden pb-4">
            <a href="/" class="block py-2 nav-link" data-i18n="nav.home">${i18n.t('nav.home')}</a>
            <a href="/game" class="block py-2 nav-link" data-i18n="nav.play">${i18n.t('nav.play')}</a>

            ${isAuthenticated && currentUser ? `
            <!-- Menu mobile - utilisateur connecté -->

            <!-- Profil utilisateur mobile -->
            <div class="flex items-center space-x-3 py-3 border-t border-gray-600 mt-2 pt-4 header-user-profile">
              <img
                src="${userService.getAvatarUrl(currentUser.avatarUrl)}"
                alt="${currentUser.username}"
                class="w-10 h-10 rounded-full object-cover border-2 border-gray-600 header-user-avatar"
                onerror="this.src='/images/default-avatar.png'"
              />
              <div class="flex-1">
                <div class="font-medium text-white">${currentUser.username}</div>
                <div class="flex items-center text-sm text-gray-400">
                  <div class="w-2 h-2 ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2"></div>
                  ${currentUser.isOnline ? i18n.t('common.online') : i18n.t('common.offline')}
                </div>
              </div>
            </div>

            <a href="/profile" class="block py-2 nav-link" data-i18n="nav.profile">${i18n.t('nav.profile')}</a>
            <button id="mobile-logout-btn" class="block py-2 nav-link text-red-400 hover:text-red-300 w-full text-left" data-i18n="nav.logout">
                ${i18n.t('nav.logout')}
            </button>
            ` : `
            <!-- Menu mobile - utilisateur déconnecté -->
            <a href="/login" class="block py-2 nav-link" data-i18n="nav.login">${i18n.t('nav.login')}</a>
            `}

            <!-- Sélecteur de langue mobile -->
            <div class="relative mt-4 border-t border-gray-600 pt-4">
                <button id="mobile-language-selector" class="flex items-center justify-between w-full py-2 text-gray-300 hover:text-white transition-colors">
                    <div class="flex items-center space-x-2">
                        <span class="text-lg">${this.getFlagEmoji(currentLanguage)}</span>
                        <span class="text-sm font-medium ${currentLanguage === 'kab-tfng' ? 'tifinagh-text' : ''}">${this.getLanguageDisplayName(currentLanguage)}</span>
                    </div>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>

                <div id="mobile-language-dropdown" class="hidden mt-2 bg-gray-700 rounded-md shadow-lg">
                    <div class="py-1">
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="en">
                            <span class="text-lg">🇬🇧</span>
                            <span>English</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="fr">
                            <span class="text-lg">🇫🇷</span>
                            <span>Français</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="it">
                            <span class="text-lg">🇮🇹</span>
                            <span>Italiano</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="es">
                            <span class="text-lg">🇪🇸</span>
                            <span>Español</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="kab">
                            <span class="text-lg flex items-center">
                                <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" width="900px" height="600px">
                                    <rect fill="#0090DA" width="900" height="200"/>
                                    <rect fill="#78BE20" y="200" width="900" height="200"/>
                                    <rect fill="#FEDD00" y="400" width="900" height="200"/>
                                    <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966 "/>
                                    <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893l0 -0.000307692z"/>
                                    <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                                </svg>
                            </span>
                            <span>Taqbaylit</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="kab-tfng">
                            <span class="text-lg flex items-center">
                                <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" width="900px" height="600px">
                                    <rect fill="#0090DA" width="900" height="200"/>
                                    <rect fill="#78BE20" y="200" width="900" height="200"/>
                                    <rect fill="#FEDD00" y="400" width="900" height="200"/>
                                    <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966 "/>
                                    <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893l0 -0.000307692z"/>
                                    <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                                </svg>
                            </span>
                            <span class="tifinagh-text">ⵜⴰⵇⴱⴰⵢⵍⵉⵜ</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="ar">
                            <span class="text-lg">🇸🇦</span>
                            <span>العربية</span>
                        </button>
                        <button class="mobile-language-option w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white flex items-center space-x-2" data-lang="sg">
                            <span class="text-lg">🇨🇫</span>
                            <span>Sango</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    `;
  }

  // ==========================================
  // MÉTHODES PRIVÉES D'ÉVÉNEMENTS
  // ==========================================

  /**
   * Attache les événements au header
   */
  private bindEvents(): void
  {
    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    menuBtn?.addEventListener('click', () =>
    {
        mobileMenu?.classList.toggle('hidden');
    });

    // Language selector
    const languageSelector = document.getElementById('language-selector');
    const languageDropdown = document.getElementById('language-dropdown');

    languageSelector?.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        if (languageDropdown?.classList.contains('opacity-0'))
        {
            languageDropdown.classList.remove('opacity-0', 'invisible');
            languageDropdown.classList.add('opacity-100', 'visible');
        } else
        {
            languageDropdown?.classList.add('opacity-0', 'invisible');
            languageDropdown?.classList.remove('opacity-100', 'visible');
        }
    });

    // Mobile language selector
    const mobileLanguageSelector = document.getElementById('mobile-language-selector');
    const mobileLanguageDropdown = document.getElementById('mobile-language-dropdown');

    mobileLanguageSelector?.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        mobileLanguageDropdown?.classList.toggle('hidden');
    });

    // langue options desktop
    document.querySelectorAll('.language-option').forEach(option =>
    {
        option.addEventListener('click', (e) =>
        {
            const lang = (e.currentTarget as HTMLElement).dataset.lang;
            if (lang)
            {
                console.log('Setting language to:', lang);
                i18n.setLanguage(lang as any);
                languageDropdown?.classList.add('opacity-0', 'invisible');
                languageDropdown?.classList.remove('opacity-100', 'visible');
            }
        });
    });

    // Langue options mobile
    document.querySelectorAll('.mobile-language-option').forEach(option =>
    {
        option.addEventListener('click', (e) =>
        {
            const lang = (e.currentTarget as HTMLElement).dataset.lang;
            if (lang)
            {
                console.log('Setting mobile language to:', lang);
                i18n.setLanguage(lang as any);
                mobileLanguageDropdown?.classList.add('hidden');
                mobileMenu?.classList.add('hidden'); // Fermer le menu mobile
            }
        });
    });

    // fermer les dropdowns en cliquant à l'extérieur
    document.addEventListener('click', () =>
    {
        languageDropdown?.classList.add('opacity-0', 'invisible');
        languageDropdown?.classList.remove('opacity-100', 'visible');
        mobileLanguageDropdown?.classList.add('hidden');
    });

    // Gerer la deconnexion
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    logoutBtn?.addEventListener('click', (e) =>
    {
        e.preventDefault();
        this.handleLogout();
    });
    mobileLogoutBtn?.addEventListener('click', (e) =>
    {
        e.preventDefault();
        this.handleLogout();
    });

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link =>
    {
        link.addEventListener('click', (e) =>
        {
            // Ne pas empecher les boutons de deconnexion
            if ((e.target as HTMLElement).id === 'logout-btn' || (e.target as HTMLElement).id === 'mobile-logout-btn')
            {
              return; // Laisser le handler de deconnexion s'occuper de ça
            }
            e.preventDefault();
            const href = (e.target as HTMLAnchorElement).getAttribute('href');
            if (href)
            {
                window.dispatchEvent(new CustomEvent('navigate', { detail: href }));
            }
        });
    });
  }

  /**
   * Gère la déconnexion
   */
  private handleLogout(): void
  {
    authService.logout();
  }

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Obtenir l'emoji du drapeau pour une langue
   */
  private getFlagEmoji(lang: string): string
  {
    const flags =
    {
        'en': '🇬🇧',
        'fr': '🇫🇷',
        'it': '🇮🇹',
        'es': '🇪🇸',
        'kab': `
                <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#0090DA" width="900" height="200"/>
                <rect fill="#78BE20" y="200" width="900" height="200"/>
                <rect fill="#FEDD00" y="400" width="900" height="200"/>
                <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966"/>
                <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893z"/>
                <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                </svg>
                `,
        'kab-tfng': `
                <svg class="inline w-6 h-6 align-middle" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
                <rect fill="#0090DA" width="900" height="200"/>
                <rect fill="#78BE20" y="200" width="900" height="200"/>
                <rect fill="#FEDD00" y="400" width="900" height="200"/>
                <polygon fill="#CC0033" points="429.675,477.64 458.13,507.721 466.26,97.9695 450,80.8966"/>
                <path fill="#CC0033" d="M657.315 515.851l54.4711 -23.5769c-104.877,-104.064 -165.039,-142.275 -264.225,-144.714 -126.015,8.94308 -208.128,59.3489 -243.087,159.348l24.3898 -4.87785c99.9991,-123.576 156.909,-109.755 220.323,-117.072 67.4791,2.43908 136.584,46.3409 208.128,130.893z"/>
                <path fill="#CC0033" d="M289.839 93.0917l-52.032 13.8209c50.4058,89.4298 122.763,143.901 215.445,147.966 122.763,0.812923 193.494,-82.1129 242.274,-156.909l-41.4631 12.1951c-78.8609,111.381 -164.226,115.446 -202.437,109.755 -64.2271,-4.87785 -117.072,-57.7231 -161.787,-126.828z"/>
                </svg>
                `,
        'ar': '🇸🇦',
        'sg': '🇨🇫'
    };
    return flags[lang as keyof typeof flags] || '🇺🇸';
  }

  /**
   * Obtenir le nom d'affichage de la langue
   */
  private getLanguageDisplayName(lang: string): string
  {
    const names =
    {
        'en': 'EN',
        'fr': 'FR',
        'it': 'IT',
        'es': 'ES',
        'kab': 'KAB',
        'kab-tfng': 'ⵜⴰⵇⴱⴰⵢⵍⵉⵜ',
        'ar': 'AR',
        'sg': 'SG'
    };
    return names[lang as keyof typeof names] || lang.toUpperCase();
  }
}