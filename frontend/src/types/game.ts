export interface GameState {
  id: string;
  player1Id: string;
  player2Id: string | null;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  };
  paddles: {
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
  score: {
    player1: number;
    player2: number;
  };
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  gameWidth: number;
  gameHeight: number;
  lastUpdate: number;
  winnerId?: string;
}