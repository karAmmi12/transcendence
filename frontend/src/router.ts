// Import des dépendances nécessaires pour le routage

import { authService } from '@services/authService';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { GamePage } from '@pages/GamePage';
import { ProfilePage } from '@pages/ProfilePage';
import { TournamentCreatePage } from '@pages/TournamentCreatePage';
import { TournamentPage } from '@pages/TournamentPage';
import { NotFoundPage } from '@pages/NotFoundPage'; // ✅ Nouvel import
import type { Route } from '@/types/index.js';

// Classe principale gérant le routage de l'application
export class Router 
{
  // Propriété stockant la page actuelle pour la nettoyer lors d'un changement
  private currentPage: any = null;

  // Tableau des routes définies dans l'application
  private routes: Route[] = [
    {
      path: '/',
      component: () => new HomePage(),
      title: 'Home - ft_transcendence',
      requiresAuth: false
    },
    {
      path: '/login',
      component: () => new LoginPage(),
      title: 'Login - ft_transcendence',
      requiresAuth: false
    },
    {
      path: '/register',
      component: () => new RegisterPage(),
      title: 'Register - ft_transcendence',
      requiresAuth: false
    },
    {
      path: '/game',
      component: () => new GamePage(),
      title: 'Pong 3D - ft_transcendence',
      requiresAuth: false
    },
    {
      path: '/profile',
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
      requiresAuth: false
    },
    {
      path: '/tournament/:id',
      component: () => new TournamentPage(),
      title: 'Tournament - ft_transcendence',
      requiresAuth: false
    }
  ];

  // ✅ Route 404 par défaut
  private get notFoundRoute(): Route {
    return {
      path: '*',
      component: () => new NotFoundPage(),
      title: '404 - Page Not Found - ft_transcendence',
      requiresAuth: false
    };
  }

  // Méthode pour naviguer vers une nouvelle route
  async navigate(path: string): Promise<void> 
  {
    // Émettre un événement avant la navigation pour permettre des actions préparatoires
    window.dispatchEvent(new CustomEvent('beforeNavigate', { detail: path }));
    
    // Mettre à jour l'historique du navigateur
    history.pushState({}, '', path);
    
    // Traiter la nouvelle route
    await this.handleRoute();
  }

  // Méthode principale pour gérer le chargement et l'affichage d'une route
  async handleRoute(): Promise<void> 
  {
    // Récupérer le chemin actuel depuis l'URL
    const path = window.location.pathname;
    
    // Recherche d'une route exacte correspondant au chemin
    let matchedRoute = this.routes.find(r => r.path === path);
    
    // Si aucune route exacte trouvée, essayer de matcher avec des paramètres dynamiques
    if (!matchedRoute) 
    {
      for (const route of this.routes) 
      {
        if (route.path.includes(':')) 
        {
          // Convertir le pattern de route en expression régulière
          const pathPattern = route.path.replace(/:[^/]+/g, '([^/]+)'); 
          const regex = new RegExp(`^${pathPattern}$`);
          if (regex.test(path))
          {
            matchedRoute = route;
            break;
          }
        }
      }
    }
    
    // ✅ Si aucune route trouvée, utiliser la page 404
    const route = matchedRoute || this.notFoundRoute;
    
    // Vérifier l'authentification si nécessaire
    if (route.requiresAuth) 
    {
      const isAuthenticated = await authService.checkAuthStatus();
      if (!isAuthenticated) 
      {
        // Rediriger vers la page de connexion
        this.navigate('/login');
        return;
      }
    }
    
    // Rediriger vers l'accueil si un utilisateur connecté accède à login/register
    if ((path === '/login' || path === '/register')) 
    {
      const isAuthenticated = await authService.checkAuthStatus();
      if (isAuthenticated) 
      {
        this.navigate('/');
        return;
      }
    }
    
    // Mettre à jour le titre de la page
    document.title = route.title;
    
    // Nettoyer la page précédente si elle existe
    if (this.currentPage && typeof this.currentPage.destroy === 'function')
    {
      this.currentPage.destroy();
    }
    
    // Instancier et monter le nouveau composant
    const component = route.component();
    this.currentPage = component;
    component.mount('#page-content');
  }

  // Méthode d'initialisation du routeur
  init(): void 
{
    // Écouter les changements d'historique (boutons précédent/suivant du navigateur)
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Écouter les événements de navigation personnalisés
    window.addEventListener('navigate', (event: CustomEvent) => {
      this.navigate(event.detail);
    });

    // Charger la route initiale au démarrage
    this.handleRoute();
  }
}