import { authService } from "./authService";  
import { ApiConfig } from "../config/api";

class MatchService {
 private baseURL = ApiConfig.API_URL;
  /**
   * Crée et termine un match local en une seule opération
   */
  async createAndFinishLocalMatch(
    player1: string, 
    player2: string, 
    score1: number,
    score2: number,
    duration: number,
  ): Promise<any> {
    try {


      
      const response = await fetch(`${this.baseURL}/match/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          player1,
          player2,
          score1,
          score2,
          duration 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create local match');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create local match:', error);
      throw error;
    }
  }

  /**
   * Envoi des données de match pour un utilisateur connecté uniquement
   */
  async sendLocalMatchData(
    player1: string, 
    player2: string, 
    score1: number,
    score2: number,
    duration: number,
  ): Promise<void> {
    try {
      // Vérifier si un utilisateur est connecté
      const isAuthenticated = authService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, skipping match data send');
        return;
      }

      // Créer et terminer le match en une seule opération
      await this.createAndFinishLocalMatch(player1, player2, score1, score2, duration);
      
      console.log('✅ Local match data sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send local match data:', error);
      // Ne pas bloquer l'expérience utilisateur si l'envoi échoue
    }
  }

  /**
   * Envoi des données de match remote
   */
  async sendRemoteMatchData(
    opponentUserId: number,
    score1: number,
    score2: number,
    duration: number,
  ): Promise<void> {
    try {
      const isAuthenticated = authService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('🔒 User not authenticated, cannot send remote match data');
        return;
      }

      const response = await fetch(`${this.baseURL}/match/remote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          opponentUserId,
          score1,
          score2,
          duration 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create remote match');
      }

      console.log('✅ Remote match data sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send remote match data:', error);
      // Ne pas bloquer l'expérience utilisateur si l'envoi échoue
    }
  }
}

export const matchService = new MatchService();