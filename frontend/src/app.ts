import { Router } from './router'
import { Header } from '@components/layout/Header'
import { Footer } from '@components/layout/Footer'

export class App {
  private router: Router
  private header: Header
  private footer: Footer

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

    // Create main layout
    appElement.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <header id="header"></header>
        <main id="main-content" class="flex-1 container mx-auto px-4 py-8">
          <div id="page-content"></div>
        </main>
        <footer id="footer"></footer>
      </div>
    `

    // Mount components
    this.header.mount('#header')
    this.footer.mount('#footer')
  }
}