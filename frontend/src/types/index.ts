export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null; //siuuu remettre par defaut
  isOnline?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLogin?: string;
  googleId?: string; 
  stats?: UserStats;
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

export interface LoginData {
  username: string;
  password: string;
  // rememberMe?: boolean;
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

export interface Friend {
  id: number;
  username: string;
  avatar_url?: string | null;
  isOnline: boolean;
  lastSeen?: string;
  friendshipDate: string;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface FriendshipStatus {
  isFriend: boolean;
  isPending: boolean;
  isRequestSent: boolean;
  isRequestReceived: boolean;
  requestId?: number;
}

// Ajouter le type Language manquant :
export type Language = 'en' | 'fr' | 'it' | 'ar' | 'kab' | 'kab-tfng' | 'sg';

