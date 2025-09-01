class MatchService {
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'
    : `http://${location.hostname}:8000/api`;

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
      const authToken = document.cookie.includes('accessToken');
      if (!authToken) {
        console.log('👤 No authenticated user, skipping match data submission');
        return;
      }

      console.log('📊 Sending local match data to backend...');
      
      // Créer et terminer le match en une seule opération
      await this.createAndFinishLocalMatch(player1, player2, score1, score2, duration);
      
      console.log('✅ Local match data sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send local match data:', error);
      // Ne pas bloquer l'expérience utilisateur si l'envoi échoue
    }
  }
}

export const matchService = new MatchService();