export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface LoginData {
  username: string; //siuu email ou username pour l'instant(identifier)
  password: string;
}

// Type pour req.user défini par le middleware
export interface AuthenticatedUser {
    userId: number;
    username: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserData;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export interface UserData {
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

export interface UserTwoFactor {
  id: number;
  email: string
  twoFactorEnabled: boolean;
  googleId: string;
}

export interface UserStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

// interface pour recupe info de la db
export interface UserFromDB {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isOnline: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
  googleId?: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface GoogleUserData {
    email: string;
    name: string;
    picture?: string;
    sub: string;
}

// export interface UpdateProfileData {
//   username?: string;
//   email?: string;
// }

export interface UpdateResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

export interface ChangePassword {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorCode {
    code: string;
    expiresAt: Date;
}