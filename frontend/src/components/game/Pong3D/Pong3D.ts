import * as BABYLON from '@babylonjs/core';
import { GameRenderer } from './GameRenderer.js';
import { GamePhysics } from './GamePhysics.js';
import { GameControls } from './GameControls.js';
import { matchService } from '@services/matchService.js';
import { GameEndModal, convertToModalStats } from '@/components/game/GameEndModal.js';
import { GameThemes } from '../themes/GameThemes.js';
import { PowerUpManager } from '../powerups/PowerUpManager.js';
import { i18n } from '@/services/i18nService.js';
import type { GameSettings, GameState, GameEndStats, GameEndCallbacks } from '@/types/index.js';
import { PowerUpType } from '@/types/index.js';

export class Pong3D
{
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================

  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;

  // Composants modulaires
  protected renderer: GameRenderer;
  protected physics: GamePhysics;
  protected controls: GameControls;

  // État du jeu
  protected gameState: GameState = {
    status: 'waiting',
    scores: { player1: 0, player2: 0 },
    timer: 0
  };

  protected settings: GameSettings;
  protected isRemoteGame: boolean;

  protected powerUpManager: PowerUpManager;

  // Propriétés pour tracker le match
  protected matchStartTime: number = 0;
  protected isMatchDataSent: boolean = false;

  private gameEndModal: GameEndModal | null = null;

  private mode: 'local' | 'tournament' | 'remote' = 'local';

  public onGameEnd?: (winner: string, scores: any, duration: number) => void;

  // ==========================================
  // CONSTRUCTEUR
  // ==========================================

  /**
   * Constructeur de la classe Pong3D
   * @param canvasId ID du canvas HTML
   * @param settings Paramètres du jeu
   * @param isRemote Indique si c'est un jeu distant
   * @param mode Mode de jeu (local, tournament, remote)
   */
  constructor(canvasId: string, settings: GameSettings, isRemote = false, mode: 'local' | 'tournament' | 'remote' = 'local')
  {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas)
    {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }

    this.settings = settings;
    this.isRemoteGame = isRemote;
    this.mode = mode;

    // Initialiser les thèmes
    GameThemes.initialize();

    console.log(`🎮 Initializing Pong3D in ${mode} mode on canvas:`, canvasId);

    this.initEngine();
    this.initComponents();
    this.bindEvents();
  }

  // ==========================================
  // MÉTHODES PRIVÉES D'INITIALISATION
  // ==========================================

  /**
   * Initialise le moteur Babylon.js
   */
  private initEngine(): void
  {
    // Créer le moteur Babylon.js
    this.engine = new BABYLON.Engine(this.canvas, true, {
      adaptToDeviceRatio: true,
      antialias: true
    });

    // Créer la scène
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);

    // Gérer le redimensionnement
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  /**
   * Initialise les composants du jeu
   */
  private initComponents(): void
  {
    console.log('🔧 Initializing game components...');

    // Initialiser les composants avec les bons paramètres
    this.renderer = new GameRenderer(this.scene, this.canvas, this.settings.theme || 'classic');
    this.physics = new GamePhysics(this.settings);
    this.controls = new GameControls();

    // Initialiser le gestionnaire de power-ups
    this.powerUpManager = new PowerUpManager(this.scene);

    // Activer les power-ups si demandé dans les settings
    if (this.settings.powerUps)
    {
      this.powerUpManager.enable();
      console.log('🔋 Power-ups activated!');
    }

    // Démarrer la boucle de rendu
    this.startRenderLoop();
  }

  /**
   * Démarre la boucle de rendu
   */
  private startRenderLoop(): void
  {
    this.engine.runRenderLoop(() => {
      if (this.gameState.status === 'playing')
      {
        this.updateGame();
      }
      this.scene.render();
    });
  }

  // ==========================================
  // MÉTHODES PUBLIQUES DE CONTRÔLE DU JEU
  // ==========================================

  /**
   * Démarre le jeu
   */
  public startGame(): void
  {
    console.log('🚀 Starting game...');

    if (this.isRemoteGame)
    {
      this.connectToServer();
    } else
    {
      this.startLocalGame();
    }
  }

  /**
   * Met en pause ou reprend le jeu
   */
  public togglePause(): void
  {
    if (this.gameState.status === 'playing')
    {
      this.gameState.status = 'paused';
      this.updateGameStatus(i18n.t('game.status.paused'));
    } else if (this.gameState.status === 'paused')
    {
      this.gameState.status = 'playing';
      this.updateGameStatus(i18n.t('game.status.resumed'));
    }
  }

  /**
   * Retourne le statut actuel du jeu
   * @returns Statut du jeu
   */
  public getGameStatus(): string
  {
    return this.gameState.status;
  }

  /**
   * Change le thème du jeu
   * @param themeId ID du thème
   */
  public changeTheme(themeId: string): void
  {
    if (this.renderer)
    {
      this.renderer.changeTheme(themeId);
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
    this.controls.handleMobileInput(player, direction, pressed);
  }

  /**
   * Gère le redimensionnement
   */
  public handleResize(): void
  {
    this.engine.resize();
    this.renderer.adjustCameraForScreen();
  }

  /**
   * Active ou désactive les power-ups
   * @param enabled État d'activation
   */
  public togglePowerUps(enabled: boolean): void
  {
    this.settings.powerUps = enabled;

    if (this.powerUpManager)
    {
      if (enabled)
      {
        this.powerUpManager.enable();
        console.log('🔋 Power-ups enabled');
      } else
      {
        this.powerUpManager.disable();
        console.log('🚫 Power-ups disabled');
      }
    }
  }

  /**
   * Vérifie si les power-ups sont activés
   * @returns True si activés
   */
  public arePowerUpsEnabled(): boolean
  {
    return this.settings.powerUps || false;
  }

  /**
   * Détruit l'instance du jeu
   */
  public destroy(): void
  {
    console.log('🗑️ Destroying Pong3D...');

    this.clearAllEffectIndicators();

    // Nettoyer le gestionnaire de power-ups
    if (this.powerUpManager)
    {
      this.powerUpManager.dispose();
    }

    // Fermer le modal de fin de partie s'il est ouvert
    if (this.gameEndModal)
    {
      this.gameEndModal.close();
      this.gameEndModal = null;
    }

    this.controls.destroy();
    this.renderer.destroy();

    if (this.engine)
    {
      this.engine.dispose();
    }

    window.removeEventListener('resize', () => {});
  }

  // ==========================================
  // MÉTHODES PROTÉGÉES DE MISE À JOUR
  // ==========================================

  /**
   * Met à jour l'état du jeu
   */
  protected updateGame(): void
  {
    // Vérifier que le renderer est initialisé
    if (!this.renderer.isInitialized())
    {
      console.warn('🚨 Renderer not fully initialized yet');
      return;
    }

    // Mettre à jour les contrôles avec les effets actifs
    const paddleInputs = this.getModifiedInputs();

    this.applyPhysicsEffects();

    // Mettre à jour la physique avec les effets actifs
    const physicsUpdate = this.physics.update(paddleInputs);

    // Mettre à jour les power-ups
    const deltaTime = this.engine.getDeltaTime() / 1000;
    this.powerUpManager.update(deltaTime);

    // Vérifier les collisions avec les power-ups
    this.checkPowerUpCollisions(physicsUpdate.positions.ball);

    // Mettre à jour le rendu
    this.renderer.updatePositions(physicsUpdate.positions);

    // Vérifier les événements de jeu
    if (physicsUpdate.events.goal)
    {
      this.handleGoal(physicsUpdate.events.goal.scorer);
    }

    // Mettre à jour le timer
    this.updateTimer();

    // Mettre à jour l'interface
    this.updateUI();
  }

  /**
   * Applique les effets physiques des power-ups
   */
  protected applyPhysicsEffects(): void
  {
    if (!this.powerUpManager)
      return;

    const activeEffects = this.powerUpManager.getActiveEffects();
    console.log(`🔮 Active effects count: ${activeEffects.size}`);

    // Réinitialiser les valeurs par défaut
    this.physics.resetSpeed();
    this.physics.resetPaddleSpeed();
    this.renderer.resetPaddleSize();

    // Calculer les multiplicateurs actuels
    const sizeMultipliers = { player1: 1.0, player2: 1.0 };

    // Appliquer les effets de modification
    for (const effect of activeEffects.values())
    {
      console.log(`🔥 Applying effect: ${effect.type} for ${effect.targetPlayer}`);

      switch (effect.type)
      {
        case PowerUpType.PADDLE_SIZE:
          sizeMultipliers[effect.targetPlayer] = 1.4;
          this.renderer.applyPaddleSizeModifier(effect.targetPlayer, 1.4);
          break;

        case PowerUpType.FREEZE_OPPONENT:
          const frozenPlayer = effect.targetPlayer === 'player1' ? 'player2' : 'player1';
          this.physics.applyPaddleSpeedModifier(frozenPlayer, 0);
          break;
      }
    }

    // Synchroniser les multiplicateurs de taille avec la physique
    this.physics.setPaddleSizeMultipliers(sizeMultipliers);
  }

  /**
   * Démarre un jeu local
   */
  protected startLocalGame(): void
  {
    this.updateGameStatus(i18n.t('game.status.starting_local'));
    this.physics.reset();

    // Démarrer le tracking du match
    this.matchStartTime = Date.now();
    this.isMatchDataSent = false;
    this.startCountdown();
  }

  /**
   * Termine le jeu
   * @param winner Joueur gagnant
   */
  protected endGame(winner: 'player1' | 'player2'): void
  {
    this.gameState.status = 'finished';
    this.gameState.winner = winner;

    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    const loserName = winner === 'player1' ? this.settings.player2Name : this.settings.player1Name;

    console.log(`🏁 Game finished! Winner: ${winnerName}`);

    // Nettoyer tous les indicateurs d'effets actifs
    this.clearAllEffectIndicators();

    // Si c'est un tournoi (callback défini), ne pas afficher le modal
    if (this.onGameEnd)
    {
      const duration = (Date.now() - this.matchStartTime) / 1000;
      console.log('🏆 Tournament match ended, calling callback');
      this.onGameEnd(winnerName, this.gameState.scores, duration);
    }

    // Afficher le modal seulement en mode local
    if (this.mode === 'local')
    {
      console.log('🎮 Local game - showing end modal');
      this.showGameEndModal(winner, winnerName, loserName);
    } else
    {
      console.log(`🏆 ${this.mode} game - modal handled by parent component`);
    }

    // Envoyer les données du match si c'est une partie locale (pas un tournoi)
    if (this.mode === 'local' && !this.isMatchDataSent)
    {
      this.sendMatchDataToBackend();
    }
  }

  /**
   * Met à jour l'interface utilisateur
   */
  protected updateUI(): void
  {
    // Mettre à jour les scores (compatible avec les deux modes)
    const p1Score = document.getElementById('player1-score') || document.getElementById('tournament-player1-score');
    const p2Score = document.getElementById('player2-score') || document.getElementById('tournament-player2-score');

    if (p1Score)
      p1Score.textContent = this.gameState.scores.player1.toString();
    if (p2Score)
      p2Score.textContent = this.gameState.scores.player2.toString();

    // Mettre à jour les noms des joueurs
    const p1Name = document.getElementById('player1-name') || document.getElementById('tournament-player1-name');
    const p2Name = document.getElementById('player2-name') || document.getElementById('tournament-player2-name');

    if (p1Name)
      p1Name.textContent = this.settings.player1Name;
    if (p2Name)
      p2Name.textContent = this.settings.player2Name;

    // Mettre à jour les scores desktop
    const scoresDesktop = document.getElementById('game-scores');
    if (scoresDesktop)
    {
      scoresDesktop.textContent = `${this.gameState.scores.player1} - ${this.gameState.scores.player2}`;
    }

    // Mettre à jour les scores mobiles avec noms
    const scoresMobile = document.getElementById('game-scores-mobile');
    if (scoresMobile)
    {
      scoresMobile.textContent = `${this.settings.player1Name} ${this.gameState.scores.player1} - ${this.gameState.scores.player2} ${this.settings.player2Name}`;
    }

    // Mettre à jour l'affichage des effets actifs
    this.updateActiveEffectsDisplay();
  }

  /**
   * Met à jour le statut du jeu affiché
   * @param status Nouveau statut
   */
  protected updateGameStatus(status: string): void
  {
    // Chercher les éléments de statut dans les deux modes
    const statusEl = document.getElementById('game-status') || document.getElementById('tournament-game-status');
    if (statusEl)
    {
      statusEl.textContent = status;
    }

    // Mettre à jour le statut mobile
    const statusMobile = document.getElementById('game-status-mobile') || document.getElementById('tournament-game-status-mobile');
    if (statusMobile)
    {
      statusMobile.textContent = status;
    }
  }

  // ==========================================
  // MÉTHODES PRIVÉES DE GESTION DES ÉVÉNEMENTS
  // ==========================================

  /**
   * Attache les événements
   */
  private bindEvents(): void
  {
    // Déléguer la gestion des événements au composant Controls
    this.controls.bindKeyboardEvents();

    // Gérer la pause
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space')
      {
        e.preventDefault();
        this.togglePause();
      }
    });
  }

  /**
   * Obtient les entrées modifiées par les effets
   * @returns Entrées modifiées
   */
  private getModifiedInputs(): any
  {
    const baseInputs = this.controls.getInputs();
    const activeEffects = this.powerUpManager.getActiveEffects();

    // Créer une copie pour éviter la mutation
    const modifiedInputs = JSON.parse(JSON.stringify(baseInputs));

    // Appliquer les effets de modification des contrôles
    for (const effect of activeEffects.values())
    {
      const targetPlayer = effect.targetPlayer;
      const oppositePlayer = targetPlayer === 'player1' ? 'player2' : 'player1';

      switch (effect.type)
      {
        case PowerUpType.REVERSE_CONTROLS:
          // Inverser les contrôles de l'adversaire
          const temp = modifiedInputs[oppositePlayer].up;
          modifiedInputs[oppositePlayer].up = modifiedInputs[oppositePlayer].down;
          modifiedInputs[oppositePlayer].down = temp;
          break;

        case PowerUpType.FREEZE_OPPONENT:
          // Geler l'adversaire
          modifiedInputs[oppositePlayer].up = false;
          modifiedInputs[oppositePlayer].down = false;
          break;
      }
    }

    return modifiedInputs;
  }

  /**
   * Vérifie les collisions avec les power-ups
   * @param ballPosition Position de la balle
   */
  private checkPowerUpCollisions(ballPosition: { x: number; y: number; z: number }): void
  {
    if (!this.powerUpManager)
      return;

    const collidedPowerUp = this.powerUpManager.checkCollision(ballPosition);

    if (collidedPowerUp)
    {
      console.log(`🎯 Power-up collision detected: ${collidedPowerUp.type} at`, ballPosition);

      // Déterminer le joueur en fonction de la direction de la balle
      const ballVelocity = this.physics.getBallVelocity();
      let targetPlayer: 'player1' | 'player2';

      if (ballVelocity.x > 0)
      {
        // La balle va vers la droite → poussée par player1 (paddle gauche)
        targetPlayer = 'player1';
      } else
      {
        // La balle va vers la gauche → poussée par player2 (paddle droite)
        targetPlayer = 'player2';
      }

      console.log(`🎯 Ball velocity: ${ballVelocity.x}, assigning power-up to: ${targetPlayer}`);

      // Activer le power-up
      this.powerUpManager.activatePowerUp(collidedPowerUp.id, targetPlayer);

     
    }
  }

  /**
   * Gère un but marqué
   * @param scorer Joueur qui a marqué
   */
  private handleGoal(scorer: 'player1' | 'player2'): void
  {
    this.gameState.scores[scorer]++;

    console.log(`🥅 Goal by ${scorer}! Score: ${this.gameState.scores.player1}-${this.gameState.scores.player2}`);

    // Vérifier la fin de partie
    if (this.gameState.scores[scorer] >= this.settings.winScore)
    {
      this.endGame(scorer);
    } else
    {
      // Réinitialiser pour le prochain round
      this.physics.reset();
      setTimeout(() => this.physics.launchBall(), 2000);
    }
  }

  /**
   * Démarre le compte à rebours
   */
  private startCountdown(): void
  {
    let count = 3;
    this.updateGameStatus(i18n.t('game.status.starting_in', { count: count.toString() }));

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0)
      {
        this.updateGameStatus(i18n.t('game.status.starting_in', { count: count.toString() }));
      } else
      {
        clearInterval(countdownInterval);
        this.gameState.status = 'playing';
        this.updateGameStatus(i18n.t('game.status.go'));
        this.physics.launchBall();
      }
    }, 1000);
  }

  /**
   * Met à jour le timer
   */
  private updateTimer(): void
  {
    this.gameState.timer += this.engine.getDeltaTime() / 1000;

    const minutes = Math.floor(this.gameState.timer / 60);
    const seconds = Math.floor(this.gameState.timer % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Mettre à jour les timers dans les deux modes
    const timerEl = document.querySelector('#game-timer .text-lg, #game-timer .text-2xl') ||
                   document.querySelector('#tournament-game-timer .text-lg, #tournament-game-timer .text-2xl');
    if (timerEl) timerEl.textContent = timeString;

    const timerDisplayEl = document.getElementById('game-timer-display') ||
                          document.getElementById('tournament-game-timer-display');
    if (timerDisplayEl) timerDisplayEl.textContent = timeString;

    // Mettre à jour le timer mobile
    const timerMobile = document.getElementById('game-timer-mobile');
    if (timerMobile) timerMobile.textContent = timeString;
  }

  /**
   * Met à jour l'affichage des effets actifs
   */
  private updateActiveEffectsDisplay(): void
  {
    if (!this.powerUpManager)
      return;

    const activeEffects = this.powerUpManager.getActiveEffects();

    // Nettoyer l'affichage précédent
    const existingEffects = document.querySelectorAll('.active-effect-indicator');
    existingEffects.forEach(el => el.remove());

    // Afficher les effets actifs
    for (const effect of activeEffects.values())
    {
      this.createEffectIndicator(effect);
    }
  }

  /**
   * Crée un indicateur d'effet actif
   * @param effect Effet à afficher
   */
  private createEffectIndicator(effect: any): void
  {
    const indicator = document.createElement('div');
    indicator.className = `
      active-effect-indicator fixed z-40
      bg-black/70 text-white px-3 py-1 rounded-lg text-sm
      transition-all duration-300
    `;

    const timeLeft = Math.ceil((effect.startTime + effect.duration - Date.now()) / 1000);

    indicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        <span>${this.getEffectName(effect.type)}</span>
        <span class="text-xs text-gray-300">${timeLeft}s</span>
      </div>
    `;

    // Positionner l'indicateur à côté du joueur concerné
    const playerInfo = document.getElementById(`${effect.targetPlayer}-info`) ||
                      document.getElementById(`tournament-${effect.targetPlayer}-info`);
    const canvas = document.getElementById('game-canvas') ||
                  document.getElementById('tournament-game-canvas');

    if (playerInfo && canvas)
    {
      const playerRect = playerInfo.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const indicatorWidth = 120;
      const indicatorHeight = 30;

      let left: number;
      let top: number;

      // Déterminer le joueur qui subit réellement l'effet visible
      let affectedPlayer = effect.targetPlayer;

      // Pour les effets qui affectent l'adversaire, afficher de son côté
      if (effect.type === PowerUpType.REVERSE_CONTROLS || effect.type === PowerUpType.FREEZE_OPPONENT)
      {
        affectedPlayer = effect.targetPlayer === 'player1' ? 'player2' : 'player1';
      }

      // Obtenir la position du joueur affecté
      const affectedPlayerInfo = document.getElementById(`${affectedPlayer}-info`) ||
                                document.getElementById(`tournament-${affectedPlayer}-info`);
      if (affectedPlayerInfo)
      {
        const affectedRect = affectedPlayerInfo.getBoundingClientRect();

        // Ajuster les offsets selon le mode pour éviter les débordements
        const isTournament = this.mode === 'tournament';
        const offsetX = isTournament ? 5 : 10;

        if (affectedPlayer === 'player1')
        {
          // Positionner à droite du joueur 1 (affecté)
          left = affectedRect.right + offsetX;
          top = affectedRect.top + (affectedRect.height / 2) - (indicatorHeight / 2);
        } else
        {
          // Positionner à gauche du joueur 2 (affecté)
          left = affectedRect.left - indicatorWidth - offsetX;
          top = affectedRect.top + (affectedRect.height / 2) - (indicatorHeight / 2);
        }
      } else
      {
        // Fallback vers la logique originale
        if (effect.targetPlayer === 'player1')
        {
          left = playerRect.right + 10;
          top = playerRect.top + (playerRect.height / 2) - (indicatorHeight / 2);
        } else
        {
          left = playerRect.left - indicatorWidth - 10;
          top = playerRect.top + (playerRect.height / 2) - (indicatorHeight / 2);
        }
      }

      // Contraintes plus strictes avec marge pour éviter les débordements
      const margin = 5;
      left = Math.max(canvasRect.left + margin, Math.min(left, canvasRect.right - indicatorWidth - margin));
      top = Math.max(canvasRect.top + margin, Math.min(top, canvasRect.bottom - indicatorHeight - margin));

      indicator.style.left = `${left}px`;
      indicator.style.top = `${top}px`;
    } else
    {
      // Fallback si les éléments ne sont pas trouvés
      const side = effect.targetPlayer === 'player1' ? 'left-4' : 'right-4';
      indicator.className += ` ${side} top-32`;
    }

    document.body.appendChild(indicator);
  }

  /**
   * Obtient le nom d'affichage d'un effet
   * @param type Type d'effet
   * @returns Nom d'affichage
   */
  private getEffectName(type: PowerUpType): string
  {
    const names = {
      [PowerUpType.PADDLE_SIZE]: '📏',
      [PowerUpType.REVERSE_CONTROLS]: '🔄',
      [PowerUpType.FREEZE_OPPONENT]: '❄️'
    };
    return names[type] || type;
  }

  /**
   * Affiche le modal de fin de partie
   * @param winner Joueur gagnant
   * @param winnerName Nom du gagnant
   * @param loserName Nom du perdant
   */
  protected showGameEndModal(winner: 'player1' | 'player2', winnerName: string, loserName: string): void
  {
    // Masquer le timer et autres éléments de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay)
    {
      gameOverlay.style.display = 'none';
    }

    // Calculer les statistiques du match
    const matchDuration = Math.floor(this.gameState.timer);
    const totalScore = this.gameState.scores.player1 + this.gameState.scores.player2;
    const winnerScore = this.gameState.scores[winner];
    const loserScore = winner === 'player1' ? this.gameState.scores.player2 : this.gameState.scores.player1;

    // Créer les statistiques pour le modal
    const stats: GameEndStats = {
      winner: winner,
      loser: winner === 'player1' ? 'player2' : 'player1',
      finalScore: { winner: winnerScore, loser: loserScore },
      duration: matchDuration.toString(),
      gameMode: this.isRemoteGame ? 'remote' : 'local',
      winnerName,
      loserName,
      winnerScore,
      loserScore,
      matchDuration,
      totalScore,
      winScore: this.settings.winScore
    };

    // Créer les callbacks pour le modal
    const callbacks: GameEndCallbacks = {
      onPlayAgain: () => this.restartGame(),
      onBackToMenu: () => this.backToMenu(),
      onViewStats: () => this.showMatchStats()
    };

    // Créer et afficher le modal
    this.gameEndModal = new GameEndModal(convertToModalStats(stats), callbacks);
    this.gameEndModal.show();
  }

  /**
   * Redémarre le jeu
   */
  private restartGame(): void
  {
    console.log('🔄 Restarting game...');

    // Réafficher l'overlay de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay)
    {
      gameOverlay.style.display = 'block';
    }

    // Réinitialiser l'état du jeu
    this.gameState = {
      status: 'waiting',
      scores: { player1: 0, player2: 0 },
      timer: 0
    };

    // Réinitialiser les propriétés de tracking
    this.isMatchDataSent = false;

    // Redémarrer le jeu
    this.startGame();
  }

  /**
   * Retourne au menu
   */
  private backToMenu(): void
  {
    console.log('🏠 Going back to menu...');

    // Naviguer vers la page de sélection de mode
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
  }

  /**
   * Affiche les statistiques du match
   */
  private showMatchStats(): void
  {
    console.log('📊 Showing match statistics...');

    // Naviguer vers la page de profil/statistiques
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
  }

  /**
   * Envoie les données du match terminé au backend
   */
  private async sendMatchDataToBackend(): Promise<void>
  {
    try
    {
      // Marquer comme envoyé pour éviter les doublons
      this.isMatchDataSent = true;

      // Calculer la durée du match en secondes
      const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);

      const matchData = {
        player1: this.settings.player1Name,
        player2: this.settings.player2Name,
        score1: this.gameState.scores.player1,
        score2: this.gameState.scores.player2,
        duration
      };

      console.log('📊 Match data to send:', matchData);

      await matchService.sendLocalMatchData(
        matchData.player1,
        matchData.player2,
        matchData.score1,
        matchData.score2,
        matchData.duration
      );

      console.log('✅ Match data sent successfully');

    } catch (error)
    {
      console.error('❌ Failed to send match data:', error);
      // Remettre le flag à false en cas d'erreur pour permettre une nouvelle tentative
      this.isMatchDataSent = false;
    }
  }

  /**
   * Nettoie tous les indicateurs d'effets
   */
  private clearAllEffectIndicators(): void
  {
    const existingEffects = document.querySelectorAll('.active-effect-indicator');
    existingEffects.forEach(el => {
      el.remove();
    });
  }

  /**
   * Se connecte au serveur pour les jeux distants
   */
  private connectToServer(): void
  {
    console.log('🌐 Connecting to server...');
    this.updateGameStatus(i18n.t('game.status.connecting_server'));
  }
}