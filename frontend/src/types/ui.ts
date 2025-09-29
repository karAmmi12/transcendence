export interface ActionCallbacks {
  onLocalGame: () => void;
  onRemoteGame: () => void;
  onTournament: () => void;
  onLogin?: () => void;
  onPlay?: () => void;
  onProfile?: () => void;
  onTournaments?: () => void;
  onRegister?: () => void;
  onEditProfile?: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
}

export interface GameModeCallbacks {
  onLocalGame: () => void;
  onRemoteGame: () => void;
  onTournament: () => void;
  onLogin?: () => void;
}

export interface Translations {
  [key: string]: any;
}

export type Language = 'en' | 'fr' | 'it' | 'es' | 'kab' | 'kab-tfng' | 'ar' | 'sg';