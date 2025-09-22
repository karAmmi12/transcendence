import type { GameSettings, ObjectPositions } from '@/types/index.js';
import { Logger } from '@/utils/logger.js'; 

export interface PaddleInputs
{
  player1: { up: boolean; down: boolean };
  player2: { up: boolean; down: boolean };
}

export interface PhysicsUpdate
{
  positions: ObjectPositions;
  events: {
    goal?: { scorer: 'player1' | 'player2' };
    collision?: boolean;
  };
}

export class GamePhysics
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private settings: GameSettings;

  // Positions des objets
  private positions: ObjectPositions = {
    player1Paddle: { x: -4.5, z: 0 },
    player2Paddle: { x: 4.5, z: 0 },
    ball: { x: 0, y: 0.15, z: 0 }
  };

  // Physique de la balle
  private ballVelocity = { x: 0, z: 0 };
  private ballSpeed = 0.05;
  private paddleSpeed = 0.1;

  private basePaddleSpeed = 0.1;
  private paddleSpeedMultipliers = {
    player1: 1.0,
    player2: 1.0
  };

  private paddleSizeMultipliers = {
    player1: 1.0,
    player2: 1.0
  };

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur de la classe GamePhysics
   * @param settings Paramètres du jeu
   */
  constructor(settings: GameSettings)
  {
    this.settings = settings;
    this.setBallSpeed(settings.ballSpeed);
    this.basePaddleSpeed = this.paddleSpeed;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE MISE À JOUR
  // ==========================================

  /**
   * Met à jour la physique du jeu
   * @param inputs Entrées des paddles
   * @returns Mise à jour de la physique
   */
  public update(inputs: PaddleInputs): PhysicsUpdate
  {
    const events: PhysicsUpdate['events'] = {};

    // Mettre à jour les paddles avec les modificateurs actifs
    this.updatePaddles(inputs);

    // Mettre à jour la balle avec les modificateurs actifs
    this.updateBall();

    // Vérifier les collisions
    if (this.checkCollisions())
    {
      events.collision = true;
    }

    // Vérifier les buts
    const goalScorer = this.checkGoals();
    if (goalScorer)
    {
      events.goal = { scorer: goalScorer };
    }

    return {
      positions: { ...this.positions },
      events
    };
  }

  // ==========================================
  // MÉTHODES PUBLIQUES D'ACCÈS AUX DONNÉES
  // ==========================================

  /**
   * Obtient la vélocité de la balle
   * @returns Vélocité de la balle
   */
  public getBallVelocity(): { x: number; z: number }
  {
    return { ...this.ballVelocity };
  }

  /**
   * Obtient les positions actuelles
   * @returns Positions des objets
   */
  public getPositions(): ObjectPositions
  {
    return { ...this.positions };
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE MODIFICATEURS
  // ==========================================

  /**
   * Applique un modificateur de vitesse au paddle
   * @param player Joueur concerné
   * @param multiplier Multiplicateur de vitesse
   */
  public applyPaddleSpeedModifier(player: 'player1' | 'player2', multiplier: number): void
  {
    this.paddleSpeedMultipliers[player] = multiplier;
    Logger.log(`🏓 ${player} paddle speed multiplier: ${multiplier}`);
  }

  /**
   * Réinitialise la vitesse de la balle
   */
  public resetSpeed(): void
  {
    this.setBallSpeed(this.settings.ballSpeed);
  }

  /**
   * Obtient la vitesse du paddle
   * @returns Vitesse du paddle
   */
  public getPaddleSpeed(): number
  {
    return this.paddleSpeed;
  }

  /**
   * Définit la vitesse du paddle
   * @param speed Nouvelle vitesse
   */
  public setPaddleSpeed(speed: number): void
  {
    this.paddleSpeed = speed;
  }

  /**
   * Applique un modificateur de vitesse à la balle
   * @param multiplier Multiplicateur de vitesse
   */
  public applySpeedModifier(multiplier: number): void
  {
    this.ballSpeed *= multiplier;
  }

  /**
   * Réinitialise la vitesse du paddle
   * @param player Joueur optionnel
   */
  public resetPaddleSpeed(player?: 'player1' | 'player2'): void
  {
    if (player)
    {
      this.paddleSpeedMultipliers[player] = 1.0;
    } else
    {
      this.paddleSpeedMultipliers.player1 = 1.0;
      this.paddleSpeedMultipliers.player2 = 1.0;
    }
  }

  /**
   * Synchronise les multiplicateurs de taille des paddles
   * @param multipliers Multiplicateurs de taille
   */
  public setPaddleSizeMultipliers(multipliers: { player1: number; player2: number }): void
  {
    this.paddleSizeMultipliers = { ...multipliers };
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE CONTRÔLE DU JEU
  // ==========================================

  /**
   * Réinitialise les positions
   */
  public reset(): void
  {
    this.positions = {
      player1Paddle: { x: -4.5, z: 0 },
      player2Paddle: { x: 4.5, z: 0 },
      ball: { x: 0, y: 0.15, z: 0 }
    };
    this.ballVelocity = { x: 0, z: 0 };
  }

  /**
   * Lance la balle
   */
  public launchBall(): void
  {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.5;

    this.ballVelocity.x = direction * this.ballSpeed;
    this.ballVelocity.z = angle * this.ballSpeed;
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE CONFIGURATION
  // ==========================================

  /**
   * Définit la vitesse de la balle selon le paramètre
   * @param speed Vitesse choisie
   */
  private setBallSpeed(speed: 'slow' | 'medium' | 'fast'): void
  {
    switch (speed)
    {
      case 'slow': this.ballSpeed = 0.03; break;
      case 'medium': this.ballSpeed = 0.05; break;
      case 'fast': this.ballSpeed = 0.08; break;
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE MISE À JOUR
  // ==========================================

  /**
   * Met à jour les positions des paddles
   * @param inputs Entrées des joueurs
   */
  private updatePaddles(inputs: PaddleInputs): void
  {
    const maxZ = 2.2;
    const minZ = -2.2;

    // Calculer la vitesse avec multiplicateur
    const player1Speed = this.basePaddleSpeed * this.paddleSpeedMultipliers.player1;
    const player2Speed = this.basePaddleSpeed * this.paddleSpeedMultipliers.player2;

    // Paddle joueur 1
    if (inputs.player1.up && this.positions.player1Paddle.z < maxZ)
    {
      this.positions.player1Paddle.z += player1Speed;
    }
    if (inputs.player1.down && this.positions.player1Paddle.z > minZ)
    {
      this.positions.player1Paddle.z -= player1Speed;
    }

    // Paddle joueur 2
    if (inputs.player2.up && this.positions.player2Paddle.z < maxZ)
    {
      this.positions.player2Paddle.z += player2Speed;
    }
    if (inputs.player2.down && this.positions.player2Paddle.z > minZ)
    {
      this.positions.player2Paddle.z -= player2Speed;
    }
  }

  /**
   * Met à jour la position de la balle
   */
  private updateBall(): void
  {
    // Déplacer la balle
    this.positions.ball.x += this.ballVelocity.x;
    this.positions.ball.z += this.ballVelocity.z;

    // Rebond sur les murs haut/bas
    if (this.positions.ball.z > 2.8 || this.positions.ball.z < -2.8)
    {
      this.ballVelocity.z *= -1;
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE DÉTECTION
  // ==========================================

  /**
   * Vérifie les collisions avec les paddles
   * @returns True si collision détectée
   */
  private checkCollisions(): boolean
  {
    const ball = this.positions.ball;
    const p1 = this.positions.player1Paddle;
    const p2 = this.positions.player2Paddle;

    // Calculer les zones de collision en tenant compte des multiplicateurs
    const basePaddleHeight = 0.8;
    const player1Height = basePaddleHeight * this.paddleSizeMultipliers.player1;
    const player2Height = basePaddleHeight * this.paddleSizeMultipliers.player2;

    // Collision avec paddle joueur 1
    if (ball.x <= -4.2 && ball.x >= -4.8 &&
        Math.abs(ball.z - p1.z) < player1Height)
    {
      this.ballVelocity.x *= -1.1;
      this.ballVelocity.z += (ball.z - p1.z) * 0.1;
      return true;
    }

    // Collision avec paddle joueur 2
    if (ball.x >= 4.2 && ball.x <= 4.8 &&
        Math.abs(ball.z - p2.z) < player2Height)
    {
      this.ballVelocity.x *= -1.1;
      this.ballVelocity.z += (ball.z - p2.z) * 0.1;
      return true;
    }

    return false;
  }

  /**
   * Vérifie si un but a été marqué
   * @returns Joueur qui a marqué ou null
   */
  private checkGoals(): 'player1' | 'player2' | null
  {
    if (this.positions.ball.x > 5)
    {
      return 'player1'; // Joueur 1 marque
    } else if (this.positions.ball.x < -5)
    {
      return 'player2'; // Joueur 2 marque
    }
    return null;
  }
}