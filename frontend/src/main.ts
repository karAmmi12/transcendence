

import './styles/main.css'
import { App } from './app'
import { Router } from './router'
import { i18n } from '@services/i18n'

class Main {
  private app: App
  private router: Router

  constructor() {
    this.router = new Router()
    this.app = new App(this.router)
    this.init()
  }

  private init(): void {
    // Initialisation de l'application
    this.app.mount('#app')

    // Gestion de la navigation dans le navigateur
    window.addEventListener('popstate', () => {
      this.router.handleRoute()
    })

    // Gestion des événements de navigation personnalisés
    window.addEventListener('navigate', (e: Event) => {
      const path = (e as CustomEvent).detail 
      this.router.navigate(path)
    })

    // Gestion de la route initiale
    this.router.handleRoute()

    console.log('🚀 ft_transcendence frontend started!')
  }
}

// Démarrer l'application après le chargement des traductions
i18n.translationsLoaded.then(() => {
  new Main()
})