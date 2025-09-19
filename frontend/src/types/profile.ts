export interface MatchHistory {
  id: string;
  opponent: string;
  opponentAvatar?: string | null;
  result: 'win' | 'loss';
  score: {
    player: number;
    opponent: number;
  };
  date: string;
  duration?: number;
  gameMode?: 'local' | 'remote' | 'tournament';
}

export interface ProfileComponents {
  header: any; // ProfileHeader
  stats: any;  // StatsCard
  history?: any; // MatchHistoryCard
  friends?: any; // FriendsSection
}