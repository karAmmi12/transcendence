import { User } from '../types/index.js';
import { i18n } from '@services/i18n';

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

    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      credentials: 'include', // Pour envoyer les cookies d'authentification
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || i18n.t('profile.edit.errors.updateFailed'));
    }

    const updatedUser = await response.json();
    
    return updatedUser;
  }

  /**
   * Récupère le profil d'un utilisateur
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
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique des matchs d'un utilisateur
   */
  public async getMatchHistory(userId?: string | null): Promise<any[]> {
    try {
      const endpoint = userId ? `/users/${userId}/matches` : '/users/me/matches';
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

  /**
   * Change le mot de passe
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/users/change-password`, {
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
}

export const userService = UserService.getInstance();