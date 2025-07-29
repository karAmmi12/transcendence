import { HomePage } from '@pages/HomePage'
import { LoginPage } from '@pages/LoginPage'
import { RegisterPage } from '@pages/RegisterPage'
import { GamePage } from '@pages/GamePage'
import { ProfilePage } from '@pages/ProfilePage'
import { SettingsPage } from '@pages/SettingsPage'

interface Route {
  path: string
  component: any
  title: string
  requiresAuth?: boolean
}

export class Router {
  private routes: Route[] = [
    { path: '/', component: HomePage, title: 'Home - ft_transcendence' },
    { path: '/login', component: LoginPage, title: 'Login - ft_transcendence' },
    { path: '/register', component: RegisterPage, title: 'Register - ft_transcendence' },
    { path: '/game', component: GamePage, title: 'Game - ft_transcendence', requiresAuth: true },
    { path: '/profile', component: ProfilePage, title: 'Profile - ft_transcendence', requiresAuth: true },
    { path: '/profile/:id', component: ProfilePage, title: 'Profile - ft_transcendence', requiresAuth: true },
    { path: '/settings', component: SettingsPage, title: 'Settings - ft_transcendence', requiresAuth: true }
  ]

  private currentPage: any = null 

  navigate(path: string): void {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  handleRoute(): void {
    const path = window.location.pathname
    
    // Gestion des routes avec paramètres
    let matchedRoute = this.routes.find(r => r.path === path);
    
    if (!matchedRoute) {
      // Essayer de matcher des routes avec paramètres
      for (const route of this.routes) {
        if (route.path.includes(':')) {
          const pathPattern = route.path.replace(/:[^/]+/g, '([^/]+)'); 
          const regex = new RegExp(`^${pathPattern}$`);
          if (regex.test(path)) {
            matchedRoute = route;
            break;
          }
        }
      }
    }
    
    const route = matchedRoute || this.routes[0];
    
    // Vérification de l'authentification
    if (route.requiresAuth) {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.navigate('/login');
        return;
      }
    }
    
    // Mise à jour du titre de la page
    document.title = route.title;
    
    // Nettoyage de l'ancienne page
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy()
    }
    
    // Créer une nouvelle instance de la page
    this.currentPage = new route.component()
    this.currentPage.mount('#page-content')
  }

  init(): void {
    // Écouter les changements d'URL
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Écouter les événements de navigation personnalisés
    window.addEventListener('navigate', (e: any) => {
      this.navigate(e.detail);
    });
    
    // Traiter la route initiale
    this.handleRoute();
  }
}