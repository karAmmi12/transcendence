import type { User, MatchHistory } from '@/types/index.js';
import { TwoFactorRequiredError } from '@/types/index.js';
import { userService } from './userService.js';
import { Logger } from '@/utils/logger.js'; 

/**
 * Service de gestion de l'authentification utilisateur
 * Gère la connexion, l'inscription, la vérification d'état et l'accès aux données utilisateur
 */
export class AuthService {
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authChecked = false;
  
  // Configuration de l'URL de base selon l'environnement
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'  // Via le proxy nginx en production
    : `http://${location.hostname}:8000/api`; // Direct en développement

  // ==========================================
  // INITIALISATION ET CONFIGURATION
  // ==========================================

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor() {
    Logger.log('AuthService baseURL:', this.baseURL);
  }

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ==========================================
  // MÉTHODES D'AUTHENTIFICATION
  // ==========================================

  /**
   * Effectue la connexion d'un utilisateur
   * @param username Nom d'utilisateur
   * @param password Mot de passe
   * @returns Données utilisateur et token, ou erreur 2FA si nécessaire
   */
  public async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    // Vérifier si une authentification 2FA est requise
    if (response.status === 202 && data.requiresTwoFactor) {
      throw new TwoFactorRequiredError(data.message, data.userId);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Traiter l'URL de l'avatar si présente
    if (data.user && data.user.avatarUrl) {
      data.user.avatarUrl = userService.getAvatarUrl(data.user.avatarUrl);
    }

    this.currentUser = data.user;
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    return data;
  }

  /**
   * Effectue la connexion avec authentification 2FA
   * @param userId ID de l'utilisateur
   * @param code Code 2FA
   * @returns Données utilisateur et token
   */
  public async loginWith2FA(userId: number, code: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.baseURL}/auth/loginWith2FA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ userId, code })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '2FA login failed');
    }

    const data = await response.json();

    // Traiter l'URL de l'avatar si présente
    if (data.user && data.user.avatarUrl) {
      data.user.avatarUrl = userService.getAvatarUrl(data.user.avatarUrl);
    }
    
    this.currentUser = data.user;
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    return data;
  }

  /**
   * Effectue l'inscription d'un nouvel utilisateur
   * @param username Nom d'utilisateur
   * @param email Adresse email
   * @param password Mot de passe
   * @returns Données utilisateur et token
   */
  public async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    this.currentUser = data.user;
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    return data;
  }

  /**
   * Initie la connexion via Google OAuth
   */
  public initiateGoogleLogin(): void {
    Logger.log('Initiating Google OAuth...');
    window.location.href = `${this.baseURL}/auth/oauth/google`;
  }

  // ==========================================
  // GESTION DE LA SESSION
  // ==========================================

  /**
   * Vérifie si l'utilisateur est actuellement authentifié
   * @returns true si authentifié, false sinon
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Effectue la déconnexion de l'utilisateur
   */
  public async logout(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      Logger.error('Logout API call failed:', error);
    }    

    this.currentUser = null;
    localStorage.removeItem('authToken');
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
  }

  /**
   * Vérifie l'état d'authentification auprès du serveur
   * @returns true si authentifié, false sinon
   */
  public async checkAuthStatus(): Promise<boolean> {
    if (this.authChecked) {
      return this.currentUser !== null;
    }

    try {
      const response = await fetch(`${this.baseURL}/user/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();

        // Construire l'URL complète de l'avatar
        if (userData.avatarUrl) {
          userData.avatarUrl = userService.getAvatarUrl(userData.avatarUrl);
        }

        this.currentUser = userData;
        this.authChecked = true;
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        return true;
      } else if (response.status === 401) {
        Logger.log('🔐 User not authenticated');
        this.currentUser = null;
        this.authChecked = true;
        return false;
      } else {
        Logger.warn('⚠️ Auth check failed with status:', response.status);
        this.currentUser = null;
        this.authChecked = true;
        return false;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        Logger.warn('🌐 Network error during auth check (server might be down)');
      } else {
        Logger.warn('⚠️ Auth check error:', error);
      }
      
      this.currentUser = null;
      this.authChecked = true;
      return false;
    }
  }

  // ==========================================
  // ACCÈS AUX DONNÉES UTILISATEUR
  // ==========================================

  /**
   * Obtient l'utilisateur actuellement connecté
   * @returns Données de l'utilisateur ou null
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Obtient le profil d'un utilisateur (propre ou d'un autre)
   * @param userId ID de l'utilisateur (optionnel pour le profil propre)
   * @returns Données du profil ou null
   */
  public async getUserProfile(userId?: string | null): Promise<User | null> {
    try {
      const endpoint = userId ? `/auth/profile/${userId}` : '/auth/me';
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      Logger.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Obtient l'historique des matchs d'un utilisateur
   * @param userId ID de l'utilisateur (optionnel pour l'historique propre)
   * @returns Liste des matchs
   */
  public async getMatchHistory(userId?: string | null): Promise<MatchHistory[]> {
    try {
      const endpoint = userId ? `/users/${userId}/matches` : '/auth/me/matches';
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include'
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      Logger.error('Failed to fetch match history:', error);
      return [];
    }
  }

  /**
   * Recharge les données de l'utilisateur actuel depuis le serveur
   * @returns Données utilisateur mises à jour ou null
   */
  public async loadCurrentUser(): Promise<User | null> {
    try {
      if (!this.isAuthenticated()) return null;
      
      const response = await fetch(`${this.baseURL}/user/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData;
        return userData;
      }
      
      return null;
    } catch (error) {
      Logger.error('Failed to load current user:', error);
      return null;
    }
  }

  /**
   * Met à jour l'utilisateur actuel en mémoire
   * @param user Nouvelles données utilisateur
   */
  public updateCurrentUser(user: User): void {
    this.currentUser = user;
    Logger.log('🔄 Current user updated in authService:', user);
  }
}

export const authService = AuthService.getInstance();