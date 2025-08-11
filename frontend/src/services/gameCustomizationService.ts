import { GameSettings, PowerUp, GameMap, GameCustomization } from '../types/gameCustomization.js';

class GameCustomizationService {
  private readonly STORAGE_KEY = 'gameSettings';
  private defaultSettings: GameSettings = {
    gameMode: 'classic',
    selectedMap: 'classic',
    enabledPowerUps: [],
    visualEffects: {
      particles: true,
      ballTrail: false,
      screenShake: false,
      soundEffects: true
    },
    gameplay: {
      ballSpeed: 4,
      paddleSpeed: 5,
      scoreLimit: 5,
      powerUpSpawnRate: 0.1
    }
  };

  private availablePowerUps: PowerUp[] = [
    {
      id: 'speed_boost',
      name: 'Speed Boost',
      description: 'Increase your paddle speed for 10 seconds',
      icon: '⚡',
      effect: 'speed_boost',
      duration: 10000,
      cooldown: 30000
    },
    {
      id: 'big_paddle',
      name: 'Big Paddle',
      description: 'Increase paddle size for 15 seconds',
      icon: '🏓',
      effect: 'paddle_size',
      duration: 15000,
      cooldown: 45000
    },
    {
      id: 'multi_ball',
      name: 'Multi Ball',
      description: 'Split the ball into 3 balls',
      icon: '⚽',
      effect: 'multi_ball',
      duration: 20000,
      cooldown: 60000
    }
  ];

  private availableMaps: GameMap[] = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional Pong arena',
      preview: '/images/maps/classic.png',
      backgroundColor: '#000000',
      ballTrail: false
    },
    {
      id: 'neon',
      name: 'Neon Arena',
      description: 'Futuristic arena with neon effects',
      preview: '/images/maps/neon.png',
      backgroundColor: '#0a0a0a',
      ballTrail: true
    },
    {
      id: 'obstacles',
      name: 'Obstacle Course',
      description: 'Arena with moving obstacles',
      preview: '/images/maps/obstacles.png',
      obstacles: [
        { x: 300, y: 150, width: 20, height: 100, type: 'moving' },
        { x: 480, y: 150, width: 20, height: 100, type: 'moving' }
      ],
      backgroundColor: '#1a1a2e',
      ballTrail: false
    }
  ];

  getSettings(): GameSettings {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return { ...this.defaultSettings, ...JSON.parse(stored) };
    }
    return this.defaultSettings;
  }

  saveSettings(settings: Partial<GameSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
    
    // Émettre un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('gameSettingsChanged', { 
      detail: newSettings 
    }));
  }

  resetToDefault(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('gameSettingsChanged', { 
      detail: this.defaultSettings 
    }));
  }

  getAvailablePowerUps(): PowerUp[] {
    return this.availablePowerUps;
  }

  getAvailableMaps(): GameMap[] {
    return this.availableMaps;
  }

  getPowerUpById(id: string): PowerUp | undefined {
    return this.availablePowerUps.find(p => p.id === id);
  }

  getMapById(id: string): GameMap | undefined {
    return this.availableMaps.find(m => m.id === id);
  }
}

export const gameCustomizationService = new GameCustomizationService();