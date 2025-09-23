import type { PaddleInputs } from './GamePhysics.js';

export class GameControls
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private keys: { [key: string]: boolean } = {};
  private mobileInputs: { [key: string]: boolean } = {};

  // ==========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ==========================================

  private keydownHandler = (e: KeyboardEvent) => {
    const key = e.code.toLowerCase();
    
    // Empêcher le comportement par défaut pour les touches de jeu
    if (this.isGameKey(key)) 
    {
      e.preventDefault();
    }
    
    this.keys[key] = true;
  };

  private keyupHandler = (e: KeyboardEvent) => {
    const key = e.code.toLowerCase();
    
    // Empêcher le comportement par défaut pour les touches de jeu
    if (this.isGameKey(key)) 
    {
      e.preventDefault();
    }
    
    this.keys[key] = false;
  };

  // ==========================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ==========================================

  /**
   * Vérifie si une touche est utilisée pour le jeu
   * @param key Code de la touche en minuscules
   * @returns True si c'est une touche de jeu
   */
  private isGameKey(key: string): boolean 
  {
    const gameKeys = [
      'keyw', 'keys', 'keyi', 'keyk', // Touches WASD + IK
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright', // Flèches
      'space' // Espace pour pause
    ];
    return gameKeys.includes(key);
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE CONTRÔLE
  // ==========================================

  /**
   * Attache les événements clavier
   */
  public bindKeyboardEvents(): void
  {
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  /**
   * Obtient les entrées actuelles des paddles
   * @returns Entrées des paddles
   */
  public getInputs(): PaddleInputs
  {
    return {
      player1: {
        up: this.keys['keyw'] || this.keys['arrowup'] || this.mobileInputs['player1_up'] || false,
        down: this.keys['keys'] || this.keys['arrowdown'] || this.mobileInputs['player1_down'] || false
      },
      player2: {
        up: this.keys['keyi'] || this.mobileInputs['player2_up'] || false,
        down: this.keys['keyk'] || this.mobileInputs['player2_down'] || false
      }
    };
  }

  /**
   * Gère les entrées mobiles
   * @param player Joueur concerné
   * @param direction Direction de l'entrée
   * @param pressed État de pression
   */
  public handleMobileInput(player: string, direction: string, pressed: boolean): void
  {
    const key = `${player}_${direction}`;
    this.mobileInputs[key] = pressed;
  }

  /**
   * Détruit les contrôles et nettoie les événements
   */
  public destroy(): void
  {
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
  }
}