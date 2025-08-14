import { User } from '../types/index.js';


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

  // public async getCurrentUser(): Promise<User | null> {
  //   if (this.currentUser) {
  //     return this.currentUser;
  //   }

  //   const token = localStorage.getItem('authToken');
  //   if (!token) {
  //     return null;
  //   }

  //   try {
  //     const response = await fetch(`${this.baseURL}/auth/me`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.ok) {
  //       this.currentUser = await response.json();
  //       return this.currentUser;
  //     }
  //   } catch (error) {
  //     console.error('Failed to get current user:', error);
  //   }

  //   return null;
  // }

  public initiateGoogleLogin(): void 
  {
    // Rediriger vers l'endpoint OAuth Google du backend
    console.log('Initiating Google OAuth... SIUUUUUUU');
    window.location.href = `${this.baseURL}/auth/oauth/google`;
  }

  public async getUserProfile(userId?: string): Promise<User | null> {
    try {
      const url = userId ? `${this.baseURL}/users/${userId}` : `${this.baseURL}/auth/me`;
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }

    return null;
  }

  public async getMatchHistory(userId?: string): Promise<MatchHistory[]> {
    try {
      const url = userId ? `${this.baseURL}/users/${userId}/matches` : `${this.baseURL}/auth/me/matches`;
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get match history:', error);
    }

    return [];
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
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
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        credentials : 'include'
      });

      console.log('Response status:', response.status);

      if (response.ok)
      {
        this.currentUser = await response.json();
        console.log('✅ User authenticated:', this.currentUser.username);
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        return true;
      } else {
        console.log('❌ Auth check failed:', response.status);
      }

    }catch (error) {
      console.error('Failed to check auth status:', error);

    } 
    this.currentUser = null;
    console.log('🚫 User not authenticated');
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    return false;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }


}

export const authService = AuthService.getInstance();