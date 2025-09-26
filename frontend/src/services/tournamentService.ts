class TournamentService {
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'
    : `http://${location.hostname}:8000/api`;

  async createTournament(participants: string[], gameSettings?: {
    ballSpeed: string;
    winScore: number;
    theme: string;
    powerUps: boolean;
  }): Promise<any> {
    const response = await fetch(`${this.baseURL}/tournament/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        participants,
        gameSettings // ✅ Ajouter les paramètres
      })
    });


    if (!response.ok) {
      throw new Error('Failed to create tournament');
    }

    const data = await response.json();
    return data.tournament;
  }



  async getTournament(tournamentId: number): Promise<any> {
    const response = await fetch(`${this.baseURL}/tournament/${tournamentId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get tournament');
    }

    return await response.json();
  }

  /**
   * Terminer un match de tournoi
   */
  async finishMatch(
    tournamentId: number,
    matchNumber: number,
    player1: string,
    player2: string,
    score1: number,
    score2: number,
    duration: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/tournament/${tournamentId}/matches/${matchNumber}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tournamentId,
          matchNumber,
          player1,
          player2,
          score1,
          score2,
          duration: Math.floor(duration)
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Tournament match finished:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to finish tournament match:', error);
      throw error;
    }
  }
}

export const tournamentService = new TournamentService();