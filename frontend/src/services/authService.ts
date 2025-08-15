import { User } from '../types/index.js';
import { userService } from './userService.js';

export interface MatchHistory {
  id: string;
  opponent: string;
  score: { player: number; opponent: number };
  result: 'win' | 'loss';
  date: string;
  duration: number;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authChecked = false;
  // ✅ En production, utiliser le proxy nginx au lieu d'aller directement au backend
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'  // Via le proxy nginx
    : `http://${location.hostname}:8000/api`; // Direct en dev
  
  private constructor() {
    console.log('AuthService baseURL:', this.baseURL);

  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important pour les cookies de session
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    this.currentUser = data.user;

    window.dispatchEvent(new CustomEvent('authStateChanged'));// declencher l'event de changement d'etat
    
    return data;
  }

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



  public async logout(): Promise<void> {
    
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include' // ✅ Utiliser les cookies
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }    

    this.currentUser = null;
    localStorage.removeItem('authToken');
    window.dispatchEvent(new CustomEvent('authStateChanged')); // Déclencher l'événement de changement d'état
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/login' }));
  }

  public async checkAuthStatus(): Promise<boolean> {
    if (this.authChecked) {
      return this.currentUser !== null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        credentials: 'include' // Important pour les cookies
      });

      if (response.ok) {
        const userData = await response.json();

        // Construire l'url complète de l'avatar
        if (userData.avatar_url) {
          userData.avatar_url = userService.getAvatarUrl(userData.avatar_url);
        }

        this.currentUser = userData;
        this.authChecked = true;
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        return true;
      } else {
        this.currentUser = null;
        this.authChecked = true;
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.currentUser = null;
      this.authChecked = true;
      return false;
    }
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async getUserProfile(userId?: string | null): Promise<User | null> {
    try {
      const endpoint = userId ? `/auth/profile/${userId}` : '/auth/me';
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        credentials: 'include'
      });
    // Removed invalid return of boolean; method should return User or null

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

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
      console.error('Failed to fetch match history:', error);
      return [];
    }
  }



}

export const authService = AuthService.getInstance();