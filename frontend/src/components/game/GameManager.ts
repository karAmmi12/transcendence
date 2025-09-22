import { Pong3D } from './Pong3D/Pong3D';
import type { GameManagerConfig } from '@/types/index.js';

export class GameManager
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private game: Pong3D | null = null;
  private config: GameManagerConfig;
  private startTime: number = 0;

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur du GameManager
   * @param config Configuration du gestionnaire de jeu
   */
  constructor(config: GameManagerConfig)
  {
    this.config = config;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Démarre le jeu selon la configuration
   */
  public async startGame(): Promise<void>
  {
    console.log(`🚀 Starting ${this.config.mode} game...`);
    
    try
    {
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
      if (this.config.onGameStart)
      {
        this.config.onGameStart();
      }

      // Démarrer le jeu
      this.startTime = Date.now();
      this.game.startGame();

    } catch (error)
    {
      console.error(`❌ Failed to start ${this.config.mode} game:`, error);
      throw error;
    }
  }

  /**
   * Met en pause ou reprend le jeu
   */
  public pauseGame(): void
  {
    if (this.game)
    {
      this.game.togglePause();
    }
  }

  /**
   * Retourne le statut actuel du jeu
   */
  public getGameStatus(): string
  {
    return this.game?.getGameStatus() || 'unknown';
  }

  /**
   * Détruit l'instance du jeu
   */
  public destroy(): void
  {
    if (this.game)
    {
      this.game.destroy();
      this.game = null;
    }
  }

  /**
   * Gère le redimensionnement du jeu
   */
  public handleResize(): void
  {
    if (this.game)
    {
      this.game.handleResize();
    }
  }

  /**
   * Gère les entrées mobiles
   * @param player Joueur concerné
   * @param direction Direction de l'entrée
   * @param pressed État de pression
   */
  public handleMobileInput(player: string, direction: string, pressed: boolean): void
  {
    if (this.game)
    {
      this.game.handleMobileInput(player, direction, pressed);
    }
  }

  /**
   * Active ou désactive les power-ups
   * @param enabled État d'activation
   */
  public togglePowerUps(enabled: boolean): void
  {
    if (this.game)
    {
      this.game.togglePowerUps(enabled);
      console.log(`🔋 Power-ups ${enabled ? 'enabled' : 'disabled'} via GameManager`);
    }
  }

  /**
   * Vérifie si les power-ups sont activés
   */
  public arePowerUpsEnabled(): boolean
  {
    return this.game?.arePowerUpsEnabled() || false;
  }

  // ==========================================
  // MÉTHODES PRIVÉES
  // ==========================================

  /**
   * Configure les callbacks du jeu selon le mode
   */
  private setupGameCallbacks(): void
  {
    if (!this.game) return;

    // Callback de fin de jeu unifié
    this.game.onGameEnd = (winner: string, scores: any, duration: number) =>
    {
      console.log(`🏁 ${this.config.mode} game ended:`, { winner, scores, duration });
      
      if (this.config.onGameEnd)
      {
        this.config.onGameEnd(winner, scores, duration);
      }
    };
  }
}