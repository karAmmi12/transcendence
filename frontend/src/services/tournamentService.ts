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
}

export const tournamentService = new TournamentService();