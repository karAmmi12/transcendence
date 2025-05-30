import { HomePage } from '@pages/HomePage'
import { LoginPage } from '@pages/LoginPage'
import { GamePage } from '@pages/GamePage'
import { ProfilePage } from '@pages/ProfilePage'
import {SettingsPage} from '@pages/SettingsPage'

interface Route {
  path: string
  component: any
  title: string
}

export class Router {
  private routes: Route[] = [
    { path: '/', component: HomePage, title: 'Home - ft_transcendence' },
    { path: '/login', component: LoginPage, title: 'Login - ft_transcendence' },
    { path: '/game', component: GamePage, title: 'Game - ft_transcendence' },
    { path: '/profile', component: ProfilePage, title: 'Profile - ft_transcendence' },
    { path: '/settings', component: SettingsPage, title: 'Settings - ft_transcendence' }
  ]

  private currentPage: any = null 

  navigate(path: string): void {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  handleRoute(): void {
    const path = window.location.pathname
    const route = this.routes.find(r => r.path === path) || this.routes[0]
    
    // Mise à jour du titre de la page
    document.title = route.title
    
    // Nettoyage de l'ancienne page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }
    
    // Creer une nouvelle instance de la page
    this.currentPage = new route.component()
    this.currentPage.mount('#page-content')
  }
}