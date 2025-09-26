import { Router } from './router'
import { Header } from '@components/layout/Header'
import { Footer } from '@components/layout/Footer'

export class App {
  private router: Router //instanciation du routeur pour la navigation SPA
  private header: Header  //instanciation de l'en-tête
  private footer: Footer  //instanciation du pied de page

  
  constructor(router: Router) { 
    this.router = router
    this.header = new Header()
    this.footer = new Footer()
  } 

  mount(selector: string): void {
    const appElement = document.querySelector(selector)
    if (!appElement) {
      throw new Error(`Element with selector ${selector} not found`)
    }

    // Creer le contenu de l'application
    appElement.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <header id="header"></header>
        <main id="main-content" class="flex-1 container mx-auto px-4 py-8">
          <div id="page-content"></div>
        </main>
        <footer id="footer"></footer>
      </div>
    `


    
    this.header.mount('#header')
    this.footer.mount('#footer')
  }
}


