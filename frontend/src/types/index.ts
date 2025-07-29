export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  stats: UserStats;
  createdAt: string;
  lastLogin?: string;
  twoFactorEnabled: boolean;
}

export interface UserStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  rank: number;
  highestScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Ajouter cette interface manquante :
export interface MatchHistory {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: {
    player: number;
    opponent: number;
  };
  date: string;
  duration?: number;
  gameMode?: 'classic' | 'ai' | 'tournament';
}

// Ajouter le type Language manquant :
export type Language = 'en' | 'fr' | 'it' | 'ar' | 'kab' | 'kab-tfng' | 'sg';