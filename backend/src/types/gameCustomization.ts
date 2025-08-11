export interface GameSettings {
  gameMode: 'classic' | 'custom';
  selectedMap: string;
  enabledPowerUps: string[];
  visualEffects: {
    particles: boolean;
    ballTrail: boolean;
    screenShake: boolean;
    soundEffects: boolean;
  };
  gameplay: {
    ballSpeed: number;
    paddleSpeed: number;
    scoreLimit: number;
    powerUpSpawnRate: number;
  };
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: string;
  duration: number;
  cooldown: number;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  obstacles?: Obstacle[];
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving';
}