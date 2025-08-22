import type { GlobalStats } from '@components/home/GlobalStatsCard';

class GlobalStatsService {
  async getGlobalStats(): Promise<GlobalStats> {
    try {
      // TODO: Remplacer par un vrai appel API
      const response = await fetch('/api/home/stats');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    }

    // Mock data en attendant
    return this.getMockGlobalStats();
  }

  private getMockGlobalStats(): GlobalStats {
    return {
      totalPlayers: 15420,
      totalGames: 78934,
      onlinePlayers: 234,
      activeTournaments: 12
    };
  }
}

export const globalStatsService = new GlobalStatsService();