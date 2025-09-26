export interface GameCustomization {
  id: string;
  name: string;
  description: string;
  category: 'powerup' | 'map' | 'visual' | 'gameplay';
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: 'speed_boost' | 'paddle_size' | 'multi_ball' | 'slow_opponent';
  duration: number;
  cooldown: number;
}

export interface GameMap {
  id: string;
  name: string;
  description: string;
  preview: string;
  obstacles?: Obstacle[];
  backgroundColor: string;
  ballTrail: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving';
}

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