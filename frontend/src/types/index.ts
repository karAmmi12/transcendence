export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null; //siuuu remettre par defaut
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
  opponentAvatar?: string | null; // Nouveau champ pour l'avatar de l'adversaire
  result: 'win' | 'loss';
  score: {
    player: number;
    opponent: number;
  };
  date: string;
  duration?: number;
  gameMode?: 'local' | 'remote' | 'tournament';
}

// export interface MatchData {
//     id: number;
//     userId: number;
//     opponent: string;
//     result: string; // win | loss
//     score: {
//         player: number;
//         opponent: number;
//     }
//     date: string;
//     duration: string;
//     gameMode: string; // local | online | tournament
// }

export interface Friend {
  id: number;
  username: string;
  avatarUrl?: string | null;
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

