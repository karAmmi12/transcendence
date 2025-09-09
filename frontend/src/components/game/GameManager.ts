import { Pong3D } from './Pong3D/Pong3D';
import { GameSettings } from './Pong3D/Pong3D.js';

export interface GameManagerConfig {
  mode: 'local' | 'tournament' | 'remote';
  canvasId: string;
  settings: GameSettings;
  onGameEnd?: (winner: string, scores: any, duration: number) => void;
  onGameStart?: () => void;
}

export class GameManager {
  private game: Pong3D | null = null;
  private config: GameManagerConfig;
  private startTime: number = 0;

  constructor(config: GameManagerConfig) {
    this.config = config;
  }

  public async startGame(): Promise<void> {
    console.log(`🚀 Starting ${this.config.mode} game...`);
    
    try {
      // Initialiser le jeu
      this.game = new Pong3D(
        this.config.canvasId, 
        this.config.settings, 
        this.config.mode === 'remote',
        this.config.mode // Passer le mode au jeu
      );

      // Configurer les callbacks selon le mode
      this.setupGameCallbacks();

      // Callback de démarrage si défini
      if (this.config.onGameStart) {
        this.config.onGameStart();
      }

      // Démarrer le jeu
      this.startTime = Date.now();
      this.game.startGame();

    } catch (error) {
      console.error(`❌ Failed to start ${this.config.mode} game:`, error);
      throw error;
    }
  }

  private setupGameCallbacks(): void {
    if (!this.game) return;

    // Callback de fin de jeu unifié
    this.game.onGameEnd = (winner: string, scores: any, duration: number) => {
      console.log(`🏁 ${this.config.mode} game ended:`, { winner, scores, duration });
      
      if (this.config.onGameEnd) {
        this.config.onGameEnd(winner, scores, duration);
      }
    };
  }

  public pauseGame(): void {
    if (this.game) {
      this.game.togglePause();
    }
  }

  public getGameStatus(): string {
    return this.game?.getGameStatus() || 'unknown';
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
  }

  public handleResize(): void {
    if (this.game) {
      this.game.handleResize();
    }
  }

  // Méthodes spécifiques aux contrôles mobiles
  public handleMobileInput(player: string, direction: string, pressed: boolean): void {
    if (this.game) {
      this.game.handleMobileInput(player, direction, pressed);
    }
  }


  public togglePowerUps(enabled: boolean): void {
    if (this.game) {
      this.game.togglePowerUps(enabled);
      console.log(`🔋 Power-ups ${enabled ? 'enabled' : 'disabled'} via GameManager`);
    }
  }

  public arePowerUpsEnabled(): boolean {
    return this.game?.arePowerUpsEnabled() || false;
  }

}