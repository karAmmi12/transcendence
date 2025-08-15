import { User, Friend, FriendshipStatus, FriendRequest } from '../types/index';

export class FriendService {
  private static instance: FriendService;
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : `http://${location.hostname}:8000/api`;

  public static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  /**
   * Rechercher des utilisateurs par nom
   */
  public async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseURL}/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Obtenir le statut d'amitié avec un utilisateur
   */
  public async getFriendshipStatus(userId: number): Promise<FriendshipStatus> {
    try {
      const response = await fetch(`${this.baseURL}/friends/status/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return {
        isFriend: false,
        isPending: false,
        isRequestSent: false,
        isRequestReceived: false
      };
    } catch (error) {
      console.error('Failed to get friendship status:', error);
      return {
        isFriend: false,
        isPending: false,
        isRequestSent: false,
        isRequestReceived: false
      };
    }
  }

  /**
   * Envoyer une demande d'ami
   */
  public async sendFriendRequest(userId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  }

  /**
   * Accepter une demande d'ami
   */
  public async acceptFriendRequest(requestId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/request/${requestId}/accept`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  /**
   * Refuser une demande d'ami
   */
  public async declineFriendRequest(requestId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/request/${requestId}/decline`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  }

  /**
   * Supprimer un ami
   */
  public async removeFriend(userId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/friends/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  }

  /**
   * Obtenir la liste des amis
   */
  public async getFriends(): Promise<Friend[]> {
    try {
      const response = await fetch(`${this.baseURL}/friends`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to get friends:', error);
      return [];
    }
  }

  /**
   * Obtenir les demandes d'amis en attente
   */
  public async getPendingRequests(): Promise<FriendRequest[]> {
    try {
      const response = await fetch(`${this.baseURL}/friends/requests/pending`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return [];
    }
  }
}

export const friendService = FriendService.getInstance();