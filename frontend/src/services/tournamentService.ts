class TournamentService {
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api'
    : `http://${location.hostname}:8000/api`;

  async createTournament(participants: string[]): Promise<any> {
    const response = await fetch(`${this.baseURL}/tournament/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ participants }) // ✅ Envoyer un objet avec la propriété participants
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

  async finishMatch(
    tournamentId: number,
    matchNumber: number,
    player1: string,
    player2: string,
    score1: number,
    score2: number,
    duration: number
  ): Promise<any> {
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
        duration
      })
    });

    if (!response.ok) {
      throw new Error('Failed to finish match');
    }

    return await response.json();
  }
}

export const tournamentService = new TournamentService();