import type { GameSettings } from './game.js';

export interface Tournament {
  id: string;
  name: string;
  participants: string[];
  bracket: TournamentMatch[];
  status: 'waiting' | 'in_progress' | 'completed';
  winnerId?: string;
  createdAt: string;
  settings: GameSettings;
  currentRound: number;
  totalRounds: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
  score?: {
    player1: number;
    player2: number;
  };
  status: 'pending' | 'in_progress' | 'completed';
  scheduledAt?: string;
  completedAt?: string;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  finalMatch?: TournamentMatch;
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
}