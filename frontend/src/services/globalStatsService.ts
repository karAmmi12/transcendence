import type { GlobalStats } from '@/types/index.js';

export class GlobalStatsService {
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'  // Via le proxy nginx
    : `http://${location.hostname}:8000/api`; // Direct en dev

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Récupère les statistiques globales de la plateforme
   * @returns Statistiques globales ou valeurs par défaut en cas d'erreur
   */
  async getGlobalStats(): Promise<GlobalStats> {
    try {
      console.log('Fetching global stats from:', `${this.baseURL}/home/stats`);
      
      const response = await fetch(`${this.baseURL}/home/stats`, {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log('Global stats response status:', response.status);
      
      if (response.ok) {
        const stats: GlobalStats = await response.json();
        console.log('Global stats received:', stats);
        return stats;
      } else {
        console.error('Global stats API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
      
      // Valeurs par défaut en cas d'erreur
      return {
        totalPlayers: 0,
        totalGames: 0,
        onlinePlayers: 0
      };
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      return {
        totalPlayers: 0,
        totalGames: 0,
        onlinePlayers: 0
      };
    }
  }
}

export const globalStatsService = new GlobalStatsService();