import './styles/main.css'
import { App } from './app'
import { Router } from './router'
import { i18n } from '@/services/i18nService'
import { BrowserTestUtils } from './utils/BrowserTestUtils';

import { authService } from './services/authService'
import { ApiConfig } from './config/api.js';
import { Logger } from '@/utils/logger.js'; 

// Debug de la configuration au démarrage
Logger.log('🚀 Application starting...');
ApiConfig.logUrls();

class Main 
{
  private app: App
  private router: Router

  constructor() 
  {
    this.router = new Router()
    this.app = new App(this.router)
    this.init()
  }

  private async init(): Promise<void> 
  {
    // Vérification de l'état d'authentification au démarrage
    await authService.checkAuthStatus();

    // Vérification de la compatibilité du navigateur
    const isCompatible = BrowserTestUtils.checkCriticalFeatures();
    if (!isCompatible) {
      Logger.warn('⚠️ Browser compatibility issues detected. Some features may not work properly.');
    }

    // Initialisation de l'application
    this.app.mount('#app');
    this.router.init();

    //Ajouter les outils de développement en mode dev
    if (import.meta.env.DEV) 
      this.initDevelopmentTools();

    Logger.log('🚀 ft_transcendence frontend started!')
  }

  private async initDevelopmentTools(): Promise<void> 
  {
    try 
    {
      // Ajouter le testeur de compatibilité navigateur
      BrowserTestUtils.addCompatibilityTestButton();
    
    } catch (error) {
      Logger.warn('Development tools failed to load:', error);
    }
  }
}

// Démarrer l'application après le chargement des traductions
i18n.translationsLoaded.then(async () => {
  new Main()
});