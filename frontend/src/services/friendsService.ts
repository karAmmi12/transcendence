import { User, Friend } from '@/types/index.js';
import { Logger } from '@/utils/logger.js';

export class FriendService {
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private static instance: FriendService;
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : `http://${location.hostname}:8000/api`;

  // ==========================================
  // INITIALISATION ET CONFIGURATION
  // ==========================================

  /**
   * Constructeur privé pour le pattern Singleton
   */
  private constructor() {}

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  // ==========================================
  // MÉTHODES DE RECHERCHE
  // ==========================================

  /**
   * Rechercher des utilisateurs par nom
   */
  public async searchUsers(query: string): Promise<User[]> {
    try {
      // Utiliser la route getAllUsers existante
      const response = await fetch(`${this.baseURL}/user/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const allUsers = await response.json();
        // Filtrer côté client
        return allUsers.filter((user: User) => 
          user.username.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // Limiter à 10 résultats
      }
      return [];
    } catch (error) {
      Logger.error('Failed to search users:', error);
      return [];
    }
  }

  // ==========================================
  // MÉTHODES DE GESTION DES AMIS
  // ==========================================

  /**
   * Envoyer une demande d'ami
   */
  public async sendFriendRequest(userId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      
      return response.ok;
    } catch (error) {
      Logger.error('Failed to send friend request:', error);
      return false;
    }
  }

  /**
   * Supprimer un ami
   */
  public async removeFriend(userId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/remove/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      Logger.error('Failed to remove friend:', error);
      return false;
    }
  }

  /**
   * Obtenir la liste des amis
   */
  public async getFriends(): Promise<Friend[]> {
    try {
      const response = await fetch(`${this.baseURL}/friends/list`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      Logger.error('Failed to get friends:', error);
      return [];
    }
  }
}

export const friendService = FriendService.getInstance();