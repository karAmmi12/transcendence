

import './styles/main.css'
import { App } from './app'
import { Router } from './router'
import { i18n } from '@services/i18n'
// import { MobileTestUtils } from './utils/MobileTestUtils'
// import { ResponsiveTest } from './utils/ResponsiveTest'
import { authService } from './services/auth'

class Main {
  private app: App
  private router: Router

  constructor() {
    this.router = new Router()
    this.app = new App(this.router)
    this.init()
  }

  private async init(): Promise<void> {

    await authService.checkAuthStatus();

    // Initialisation de l'application
    this.app.mount('#app');
    this.router.init();

    // Gestion de la navigation dans le navigateur
    // window.addEventListener('popstate', () => {
    //   this.router.handleRoute()
    // })

    // //initialiser les outils de test responsive
    // if (import.meta.env.DEV) {
    //   this.initDevelopmentTools();
    // }

  

    // Gestion des événements de navigation personnalisés
    // window.addEventListener('navigate', (e: Event) => {
    //   const path = (e as CustomEvent).detail 
    //   this.router.navigate(path)
    // })

    // Gestion de la route initiale
    // this.router.handleRoute()

    console.log('🚀 ft_transcendence frontend started!')
  }

//   private async initDevelopmentTools(): Promise<void> {
//     try {
//       const { MobileTestUtils } = await import('./utils/MobileTestUtils');
      
//       // Ajouter les boutons de test
//       MobileTestUtils.addResponsiveTestButton();
//       MobileTestUtils.addViewportInfo();
//       MobileTestUtils.simulateDeviceOrientation();

//       // Test automatique après le chargement
//       setTimeout(async () => {
//         console.log('🧪 Running automatic responsive check...');
//         const { ResponsiveTest } = await import('./utils/ResponsiveTest');
//         const tester = new ResponsiveTest();
        
//         // Test rapide sur les breakpoints principaux
//         const quickTests = [
//           { name: 'mobile', width: 375, height: 667 },
//           { name: 'tablet', width: 768, height: 1024 },
//           { name: 'desktop', width: 1280, height: 720 }
//         ];

//         for (const test of quickTests) {
//           // Tester seulement les aspects critiques
//           console.log(`Quick test: ${test.name} (${test.width}x${test.height})`);
//         }
//       }, 2000);
      
//     } catch (error) {
//       console.warn('Development tools failed to load:', error);
//     }
  
// }
}

// Démarrer l'application après le chargement des traductions
i18n.translationsLoaded.then(async () => {
  new Main()
});