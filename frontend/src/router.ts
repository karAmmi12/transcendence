import { ROUTES } from './utils/constants';
import { authService } from '@services/authService';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
// import { GamePage } from '@pages/GamePage';
import { ProfilePage } from '@pages/ProfilePage';
import { TournamentCreatePage } from '@pages/TournamentCreatePage';
// import { TournamentPage } from '@pages/TournamentPage';

interface Route {
  path: string;
  component: () => any; // Changé en fonction qui retourne une instance
  title: string;
  requiresAuth: boolean;
}

export class Router {
  private routes: Route[] = [
    {
      path: ROUTES.HOME,
      component: () => new HomePage(), // Instanciation avec new
      title: 'Home - ft_transcendence',
      requiresAuth: false
    },
    {
      path: ROUTES.LOGIN,
      component: () => new LoginPage(),
      title: 'Login - ft_transcendence',
      requiresAuth: false
    },
    {
      path: ROUTES.REGISTER,
      component: () => new RegisterPage(),
      title: 'Register - ft_transcendence',
      requiresAuth: false
    },
    // {
    //   path: ROUTES.GAME,
    //   component: () => new GamePage(),
    //   title: 'Game - ft_transcendence',
    //   requiresAuth: true
    // },
    {
      path: ROUTES.PROFILE,
      component: () => new ProfilePage(),
      title: 'Profile - ft_transcendence',
      requiresAuth: true
    },
    {
      path: '/profile/:id',
      component: () => new ProfilePage(),
      title: 'Profile - ft_transcendence',
      requiresAuth: true
    },
    {
      path: '/tournament/create',
      component: () => new TournamentCreatePage(),
      title: 'Create Tournament - ft_transcendence',
      requiresAuth: false // Accessible aux invités aussi
    }
    // ,
    // {
    //   path: ROUTES.TOURNAMENT,
    //   component: () => new TournamentPage(),
    //   title: 'Tournament - ft_transcendence',
    //   requiresAuth: true
    // }
  ];

  async navigate(path: string): Promise<void> {
    history.pushState({}, '', path);
    await this.handleRoute();
  }

  async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    
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
      const isAuthenticated = await authService.checkAuthStatus();
      if (!isAuthenticated) {
        this.navigate('/login');
        return;
      }
    }
    
    // Rediriger vers home si utilisateur connecté essaie d'accéder à login/register
    if ((path === '/login' || path === '/register')) {
      const isAuthenticated = await authService.checkAuthStatus();
      if (isAuthenticated) {
        this.navigate('/');
        return;
      }
    }
    
    // Mise à jour du titre de la page
    document.title = route.title;
    
    // Charger et monter la page
    const component = route.component(); // Maintenant ça retourne une instance
    component.mount('#page-content');
  }

  init(): void {
    // Gérer les changements d'URL
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Gérer la navigation par événement custom
    window.addEventListener('navigate', (event: CustomEvent) => {
      this.navigate(event.detail);
    });

    // Charger la route initiale
    this.handleRoute();
  }
}