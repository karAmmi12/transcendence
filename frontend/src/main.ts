

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
    // Initialize the application
    this.app.mount('#app')

    // Handle browser navigation
    window.addEventListener('popstate', () => {
      this.router.handleRoute()
    })

    // Handle custom navigation events
    window.addEventListener('navigate', (e: Event) => {
      const path = (e as CustomEvent).detail
      this.router.navigate(path)
    })

    // Initial route handling
    this.router.handleRoute()

    console.log('🚀 ft_transcendence frontend started!')
  }
}

// Start the application after translations are loaded
i18n.translationsLoaded.then(() => {
  new Main()
})