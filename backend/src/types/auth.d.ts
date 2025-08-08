export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
  identifier: string; //siuu email ou username pour l'instant
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    isOnline?: boolean;
    twoFactorEnabled?: boolean;
    createdAt?: string;
    stats?: UserStats;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
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

// interface pour recupe info de la db
interface UserFromDB {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isOnline: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
}