import * as BABYLON from '@babylonjs/core';

export interface GameSettings {
  ballSpeed: 'slow' | 'medium' | 'fast';
  winScore: number;
  theme: string;
  powerUps: boolean;
  player1Name?: string;
  player2Name?: string;
  paddleSpeed?: 'slow' | 'medium' | 'fast';
  enableEffects?: boolean;
}

export interface GameState {
  id?: string;
  player1Id?: string;
  player2Id?: string | null;
  ball?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  };
  paddles?: {
    player1: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    player2: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  score?: {
    player1: number;
    player2: number;
  };
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  gameWidth?: number;
  gameHeight?: number;
  lastUpdate?: number;
  winnerId?: string;
  timer?: number;
  scores?: { player1: number; player2: number };
  winner?: 'player1' | 'player2';
}

export interface GameManagerConfig {
  mode: 'local' | 'remote' | 'tournament';
  canvasId: string;
  canvas?: HTMLCanvasElement;
  settings: GameSettings;
  onGameStart?: () => void;
  onGameEnd?: (winner: string, scores: any, duration: number) => void;
}

export interface GameObjects {
  field: BABYLON.Mesh;
  ball: BABYLON.Mesh;
  player1Paddle: BABYLON.Mesh;
  player2Paddle: BABYLON.Mesh;
  borders: BABYLON.Mesh[];
}

export interface ObjectPositions {
  ball: BABYLON.Vector3 | { x: number; y: number; z: number };
  player1Paddle: BABYLON.Vector3 | { x: number; y?: number; z: number };
  player2Paddle: BABYLON.Vector3 | { x: number; y?: number; z: number };
}

export interface GameEndStats {
  winner: string;
  loser: string;
  finalScore: { winner: number; loser: number };
  duration: string;
  gameMode: string;
  totalShots?: number;
  maxSpeed?: number;
  winnerName?: string;
  loserName?: string;
  winnerScore?: number;
  loserScore?: number;
  matchDuration?: number;
  totalScore?: number;
  winScore?: number;
}

export interface GameEndCallbacks {
  onPlayAgain?: () => void;
  onBackToMenu: () => void;
  onViewStats?: () => void;
}