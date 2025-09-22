// Auth types
export type {
  User,
  UserStats,
  LoginData,
  RegisterData,
  TwoFactorResponse,
  MatchHistory
} from './auth.js';

export { TwoFactorRequiredError } from './auth.js';

// Game types
export type {
  GameSettings,
  GameState,
  GameManagerConfig,
  GameObjects,
  ObjectPositions,
  GameEndStats,
  GameEndCallbacks
} from './game.js';

// Theme types
export type {
  ThemeConfig,
  MaterialConfig
} from './theme.js';

// PowerUp types
export type {
  PowerUp,
  ActiveEffect,
  PowerUpConfig,
  PowerUpEffects
} from './powerups.js';

// Social types
export type {
  Friend,
  FriendRequest,
  FriendshipStatus
} from './social.js';

// Profile types
export type {
  ProfileComponents
} from './profile.js';

// UI types
export type {
  ActionCallbacks,
  GameModeCallbacks,
  Translations,
  Language
} from './ui.js';

// Tournament types
export type {
  Tournament,
  TournamentMatch,
  TournamentBracket,
  TournamentRound
} from './tournament.js';

// Stats types
export type {
  GlobalStats
} from './stats.js';

// Router types
export type {
  Route
} from './router.js';

// Network types
export type {
  WebRTCConfig,
  GameMessage,
  ConnectionState,
  RemoteGameConfig
} from './network.js';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError
} from './api.js';

// Re-export enums
export { PowerUpType } from './powerups.js';