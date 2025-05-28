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
    
    // Update page title
    document.title = route.title
    
    // Cleanup previous page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }
    
    // Create and mount new page
    this.currentPage = new route.component()
    this.currentPage.mount('#page-content')
  }
}