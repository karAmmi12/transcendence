export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  stats: UserStats;
}

export interface UserStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

export interface GameState {
  id: string;
  player1: User;
  player2: User;
  score: { player1: number; player2: number; };
  status: 'waiting' | 'playing' | 'finished';
  ball: { x: number; y: number; vx: number; vy: number; };
  paddles: { 
    player1: { y: number; }; 
    player2: { y: number; }; 
  };
}

export interface Page {
  render(): HTMLElement;
  destroy?(): void;
}