import { User } from '../types/index.js';
import { i18n } from '@/services/i18nService.js';

export class UserService {
  private static instance: UserService;
  // ✅ En production, utiliser le proxy nginx au lieu d'aller directement au backend
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'  // Via le proxy nginx
    : `http://${location.hostname}:8000/api`; // Direct en dev

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Construit l'URL complète pour un avatar
   */
  public getAvatarUrl(avatarPath: string | null | undefined): string {
    if (!avatarPath) {
      return '/images/default-avatar.png'; // Avatar par défaut
    }

    // Si c'est déjà une URL complète, la retourner
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    // Construire l'URL complète vers le backend
    const backendURL = process.env.NODE_ENV === 'production' 
      ? '' // En production, nginx proxy
      : `http://${location.hostname}:8000`; // Direct en dev
    
    return `${backendURL}${avatarPath}`;
  }

  /**
   * Met à jour le profil utilisateur
   */
  public async updateProfile(data: { username: string; email: string }, avatarFile?: File): Promise<User> {
    const formData = new FormData();
    
    // Ajouter les données du profil
    formData.append('username', data.username);
    formData.append('email', data.email);
    
    // Ajouter le fichier avatar si présent
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const response = await fetch(`${this.baseURL}/user/updateProfile`, {
      method: 'PUT',
      credentials: 'include', // Pour envoyer les cookies d'authentification
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || i18n.t('profile.edit.errors.updateFailed'));
    }

    const responseData = await response.json();
    
    // Retourner l'utilisateur mis à jour depuis la réponse
    return responseData.user;
  }

  /**
   * Récupère le profil d'un utilisateur
   */
  public async getUserProfile(userId?: string | null): Promise<User | null> {
    try {
      console.log('Fetching user profile for userId:', userId);
      const endpoint = userId ? `/user/profile/${userId}` : '/user/me';
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const user = await response.json();
        // Construire l'URL complète de l'avatar
        if (user.avatarUrl) {
          user.avatarUrl = this.getAvatarUrl(user.avatarUrl);
        }
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique des matchs d'un utilisateur
   */
  public async getMatchHistory(userId?: string | null): Promise<any[]> {
    try {
      const endpoint = userId ? `/user/${userId}/matches` : '/user/me/matches';
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include'
      });

      console.log('response from match history:', response);

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch match history:', error);
      return [];
    }
  }

  /**
   * Change le mot de passe
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/user/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || i18n.t('profile.errors.changePasswordFailed'));
    }
  }

  /**
   * Sauvegarder le thème préféré de l'utilisateur
   */

    public async saveUserTheme(theme: string): Promise<boolean> {
    try {
      console.log('🎨 Sending theme update request:', theme);
      
      const response = await fetch(`${this.baseURL}/user/updateTheme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ theme })
      });

      console.log('🎨 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown server error' }));
        console.error('❌ Theme save failed:', error);
        throw new Error(error.error || 'Failed to save theme');
      }

      const data = await response.json();
      console.log('✅ Theme save successful:', data);
      
      return true;
      
    } catch (error) {
      console.error('❌ Theme save error:', error);
      return false;
    }
  }


}

export const userService = UserService.getInstance();