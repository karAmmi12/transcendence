import * as BABYLON from '@babylonjs/core';
import { GameRenderer } from './GameRenderer.js';
import { GamePhysics } from './GamePhysics.js';
import { GameControls } from './GameControls.js';
import { matchService } from '@services/matchService.js';
import { GameEndModal, GameEndStats, GameEndCallbacks } from '@/components/game/GameEndModal.js';
import { GameThemes } from '../themes/GameThemes.js';
import { PowerUpManager } from '../powerups/PowerUpManager.js';
import { PowerUpType } from '../../../types/powerups.js';

export interface GameSettings {
  player1Name: string;
  player2Name: string;
  ballSpeed: 'slow' | 'medium' | 'fast';
  winScore: number;
  theme?: string;
  enableEffects?: boolean;
  powerUps?: boolean;
}

export interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  scores: { player1: number; player2: number };
  timer: number;
  winner?: 'player1' | 'player2';
}

export class Pong3D {
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


  //proprietes pour tracker le match
  protected matchStartTime : number = 0;
  protected isMatchDataSent : boolean = false;

  private gameEndModal: GameEndModal | null = null;

  private mode: 'local' | 'tournament' | 'remote' = 'local';

  public onGameEnd?: (winner: string, scores: any, duration : number) => void;

  constructor(canvasId: string, settings: GameSettings, isRemote = false, mode: 'local' | 'tournament' | 'remote' = 'local') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    
    this.settings = settings;
    this.isRemoteGame = isRemote;
    this.mode = mode;

    // Initialiser les themes
    GameThemes.initialize();
    
    console.log(`🎮 Initializing Pong3D in ${mode} mode on canvas:`, canvasId);
    
    this.initEngine();
    this.initComponents();
    this.bindEvents();
  }


  private initEngine(): void {
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

  // private initComponents(): void {
  //   // Initialiser les composants
  //   this.renderer = new GameRenderer(this.scene, this.settings);
  //   this.physics = new GamePhysics(this.settings);
  //   this.controls = new GameControls();
    
  //   // Démarrer la boucle de rendu
  //   this.startRenderLoop();
  // }

  private initComponents(): void {
    console.log('🔧 Initializing game components...');
    
    // Initialiser les composants avec les bons paramètres
    this.renderer = new GameRenderer(this.scene, this.canvas, this.settings.theme || 'classic');
    this.physics = new GamePhysics(this.settings);
    this.controls = new GameControls();


    //initialiser le gestionnaire de power ups
    this.powerUpManager = new PowerUpManager(this.scene);
    

    // Activer les power-ups si demandé dans les settings
    if (this.settings.powerUps) {
      this.powerUpManager.enable();
      console.log('🔋 Power-ups activated!');
    }
    
    // Démarrer la boucle de rendu
    this.startRenderLoop();
  }

  // Méthode pour changer de thème en cours de jeu
  public changeTheme(themeId: string): void {
    if (this.renderer) {
      this.renderer.changeTheme(themeId);
    }
  }


  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      if (this.gameState.status === 'playing') {
        this.updateGame();
      }
      this.scene.render();
    });
  }

  private updateGame(): void {
    // ✅ CORRECTION: Vérifier que le renderer est initialisé
    if (!this.renderer.isInitialized()) {
      console.warn('🚨 Renderer not fully initialized yet');
      return;
    }

    // Mettre à jour les contrôles avec les effets actifs
    const paddleInputs = this.getModifiedInputs();

    this.applyPhysicsEffects();
    
    // Mettre à jour la physique avec les effets actifs
    const physicsUpdate = this.physics.update(paddleInputs);
    
    // ✅ Mettre à jour les power-ups
    const deltaTime = this.engine.getDeltaTime() / 1000;
    this.powerUpManager.update(deltaTime);
    
    // ✅ Vérifier les collisions avec les power-ups
    this.checkPowerUpCollisions(physicsUpdate.positions.ball);
    
    // Mettre à jour le rendu
    this.renderer.updatePositions(physicsUpdate.positions);
    
    // Vérifier les événements de jeu
    if (physicsUpdate.events.goal) {
      this.handleGoal(physicsUpdate.events.goal.scorer);
    }
    
    // Mettre à jour le timer
    this.updateTimer();
    
    // Mettre à jour l'interface
    this.updateUI();
  }

  private applyPhysicsEffects(): void {
    if (!this.powerUpManager) return;
    
    const activeEffects = this.powerUpManager.getActiveEffects();
    console.log(`🔮 Active effects count: ${activeEffects.size}`);
    
    // Réinitialiser les valeurs par défaut
    this.physics.resetSpeed();
    this.physics.resetPaddleSpeed();
    this.renderer.resetPaddleSize();
    
    // Calculer les multiplicateurs actuels
    const sizeMultipliers = { player1: 1.0, player2: 1.0 };
    
    // Appliquer les effets de modification
    for (const effect of activeEffects.values()) {
      console.log(`🔥 Applying effect: ${effect.type} for ${effect.targetPlayer}`);
      
      switch (effect.type) {
        case PowerUpType.BALL_SLOW:
          this.physics.applySpeedModifier(0.6);
          break;
          
        case PowerUpType.SPEED_BOOST:
          this.physics.applyPaddleSpeedModifier(effect.targetPlayer, 1.5);
          break;
          
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
    
    // ✅ Synchroniser les multiplicateurs de taille avec la physique
    this.physics.setPaddleSizeMultipliers(sizeMultipliers);
  }

  private getModifiedInputs(): any {
    const baseInputs = this.controls.getInputs();
    const activeEffects = this.powerUpManager.getActiveEffects();
    
    // Créer une copie pour éviter la mutation
    const modifiedInputs = JSON.parse(JSON.stringify(baseInputs));
    
    // Appliquer les effets de modification des contrôles
    for (const effect of activeEffects.values()) {
      const targetPlayer = effect.targetPlayer;
      const oppositePlayer = targetPlayer === 'player1' ? 'player2' : 'player1';
      
      switch (effect.type) {
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
          
        case PowerUpType.SPEED_BOOST:
          // Augmenter la vitesse de réaction (simulé par des inputs plus sensibles)
          if (modifiedInputs[targetPlayer].up) {
            modifiedInputs[targetPlayer].up = true; // Plus réactif
          }
          if (modifiedInputs[targetPlayer].down) {
            modifiedInputs[targetPlayer].down = true;
          }
          break;
      }
    }
    
    return modifiedInputs;
  }

  private checkPowerUpCollisions(ballPosition: { x: number; y: number; z: number }): void {
    if (!this.powerUpManager) return;
    
    const collidedPowerUp = this.powerUpManager.checkCollision(ballPosition);
    
    if (collidedPowerUp) {
      console.log(`🎯 Power-up collision detected: ${collidedPowerUp.type} at`, ballPosition);
      
      // Déterminer quel joueur récupère le power-up (celui le plus proche)
      const targetPlayer = ballPosition.x < 0 ? 'player1' : 'player2';
      
      // Activer le power-up
      this.powerUpManager.activatePowerUp(collidedPowerUp.id, targetPlayer);
      
      // Afficher une notification
      this.showPowerUpNotification(collidedPowerUp.type, targetPlayer);
    }
  }

  private showPowerUpNotification(type: PowerUpType, player: 'player1' | 'player2'): void {
    // Obtenir le nom lisible du power-up
    const powerUpNames = {
      [PowerUpType.SPEED_BOOST]: 'Vitesse +',
      [PowerUpType.PADDLE_SIZE]: 'Grande Palette',
      [PowerUpType.BALL_SLOW]: 'Balle Lente',
      [PowerUpType.REVERSE_CONTROLS]: 'Contrôles Inversés',
      [PowerUpType.FREEZE_OPPONENT]: 'Gel Adversaire',
      [PowerUpType.INVISIBLE_BALL]: 'Balle Invisible',
      [PowerUpType.MULTI_BALL]: 'Multi-Balles'
    };

    const playerName = player === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    const powerUpName = powerUpNames[type] || type;
    
    // Créer une notification stylée
    const notification = document.createElement('div');
    notification.className = `
      fixed top-20 left-1/2 transform -translate-x-1/2 
      bg-gradient-to-r from-purple-600 to-blue-600 
      text-white px-6 py-3 rounded-lg z-50 
      transition-all duration-500 ease-in-out
      shadow-lg border-2 border-white/20
      animate-pulse
    `;
    
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">⚡</span>
        <span class="font-bold">${playerName}</span>
        <span>a récupéré</span>
        <span class="font-bold text-yellow-300">${powerUpName}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
      notification.style.transform = 'translate(-50%, 0) scale(1.1)';
    }, 100);
    
    // Animation de sortie et suppression
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -20px) scale(0.8)';
      setTimeout(() => notification.remove(), 300);
    }, 2700);
  }


  private handleGoal(scorer: 'player1' | 'player2'): void {
    this.gameState.scores[scorer]++;
    
    console.log(`🥅 Goal by ${scorer}! Score: ${this.gameState.scores.player1}-${this.gameState.scores.player2}`);
    
    // Vérifier la fin de partie
    if (this.gameState.scores[scorer] >= this.settings.winScore) {
      this.endGame(scorer);
    } else {
      // Réinitialiser pour le prochain round
      this.physics.reset();
      setTimeout(() => this.physics.launchBall(), 2000);
    }
  }

  protected endGame(winner: 'player1' | 'player2'): void {
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    const loserName = winner === 'player1' ? this.settings.player2Name : this.settings.player1Name;
    
    console.log(`🏁 Game finished! Winner: ${winnerName}`);

    // ✅ Si c'est un tournoi (callback défini), ne pas afficher le modal
    if (this.onGameEnd) {
      const duration = (Date.now() - this.matchStartTime) / 1000;
      console.log('🏆 Tournament match ended, calling callback');
      this.onGameEnd(winnerName, this.gameState.scores, duration);
    }

    // ✅ Afficher le modal seulement en mode local
    if (this.mode === 'local') {
      console.log('🎮 Local game - showing end modal');
      this.showGameEndModal(winner, winnerName, loserName);
    } else {
      console.log(`🏆 ${this.mode} game - modal handled by parent component`);
    }

    // Envoyer les données du match si c'est une partie locale (pas un tournoi)
    if (this.mode === 'local' && !this.isMatchDataSent) {
      this.sendMatchDataToBackend();
    }
  }

  protected showGameEndModal(winner: 'player1' | 'player2', winnerName: string, loserName: string): void {
    // Masquer le timer et autres éléments de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay) {
      gameOverlay.style.display = 'none';
    }

    // Calculer les statistiques du match
    const matchDuration = Math.floor(this.gameState.timer);
    const totalScore = this.gameState.scores.player1 + this.gameState.scores.player2;
    const winnerScore = this.gameState.scores[winner];
    const loserScore = winner === 'player1' ? this.gameState.scores.player2 : this.gameState.scores.player1;

    // Créer les statistiques pour le modal
    const stats: GameEndStats = {
      winnerName,
      loserName,
      winnerScore,
      loserScore,
      matchDuration,
      totalScore,
      gameMode: this.isRemoteGame ? 'remote' : 'local',
      winScore: this.settings.winScore
    };

    // Créer les callbacks pour le modal
    const callbacks: GameEndCallbacks = {
      onPlayAgain: () => this.restartGame(),
      onBackToMenu: () => this.backToMenu(),
      onViewStats: () => this.showMatchStats()
    };

    // Créer et afficher le modal
    this.gameEndModal = new GameEndModal(stats, callbacks);
    this.gameEndModal.show();
  }



  private restartGame(): void {
    console.log('🔄 Restarting game...');
    
    // Réafficher l'overlay de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay) {
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

  private backToMenu(): void {
    console.log('🏠 Going back to menu...');
    
    // Naviguer vers la page de sélection de mode
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
  }

  private showMatchStats(): void {
    console.log('📊 Showing match statistics...');
    
    // Naviguer vers la page de profil/statistiques
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
  }


  

  /**
   * Envoie les données du match terminé au backend
   */
  private async sendMatchDataToBackend(): Promise<void> {
    try {
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
      
    } catch (error) {
      console.error('❌ Failed to send match data:', error);
      // Remettre le flag à false en cas d'erreur pour permettre une nouvelle tentative
      this.isMatchDataSent = false;
    }
  }

  private updateTimer(): void {
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


  private updateUI(): void {
    // Mettre à jour les scores (compatible avec les deux modes)
    const p1Score = document.getElementById('player1-score') || document.getElementById('tournament-player1-score');
    const p2Score = document.getElementById('player2-score') || document.getElementById('tournament-player2-score');
    
    if (p1Score) p1Score.textContent = this.gameState.scores.player1.toString();
    if (p2Score) p2Score.textContent = this.gameState.scores.player2.toString();

    // Mettre à jour les scores mobiles
    const scoresMobile = document.getElementById('game-scores-mobile');
    if (scoresMobile) {
      scoresMobile.textContent = `${this.gameState.scores.player1} - ${this.gameState.scores.player2}`;
    }
    
    // ✅ Mettre à jour l'affichage des effets actifs
    this.updateActiveEffectsDisplay();
  }

  private updateActiveEffectsDisplay(): void {
    if (!this.powerUpManager) return;
    
    const activeEffects = this.powerUpManager.getActiveEffects();
    
    // Nettoyer l'affichage précédent
    const existingEffects = document.querySelectorAll('.active-effect-indicator');
    existingEffects.forEach(el => el.remove());
    
    // Afficher les effets actifs
    for (const effect of activeEffects.values()) {
      this.createEffectIndicator(effect);
    }
  }

  private createEffectIndicator(effect: any): void {
    const indicator = document.createElement('div');
    indicator.className = `
      active-effect-indicator fixed top-32 z-40
      bg-black/70 text-white px-3 py-1 rounded-lg text-sm
      transition-all duration-300
    `;
    
    const timeLeft = Math.ceil((effect.startTime + effect.duration - Date.now()) / 1000);
    const side = effect.targetPlayer === 'player1' ? 'left-4' : 'right-4';
    
    indicator.className += ` ${side}`;
    indicator.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        <span>${this.getEffectName(effect.type)}</span>
        <span class="text-xs text-gray-300">${timeLeft}s</span>
      </div>
    `;
    
    document.body.appendChild(indicator);
  }

  private getEffectName(type: PowerUpType): string {
    const names = {
      [PowerUpType.SPEED_BOOST]: 'Vitesse+',
      [PowerUpType.PADDLE_SIZE]: 'Grande Palette',
      [PowerUpType.BALL_SLOW]: 'Balle Lente',
      [PowerUpType.REVERSE_CONTROLS]: 'Contrôles Inversés',
      [PowerUpType.FREEZE_OPPONENT]: 'Gelé',
      [PowerUpType.INVISIBLE_BALL]: 'Balle Invisible',
      [PowerUpType.MULTI_BALL]: 'Multi-Balles'
    };
    return names[type] || type;
  }

  private updateGameStatus(status: string): void {
    // Chercher les éléments de statut dans les deux modes
    const statusEl = document.getElementById('game-status') || document.getElementById('tournament-game-status');
    if (statusEl) {
      statusEl.textContent = status;
    }
    
    // Mettre à jour le statut mobile
    const statusMobile = document.getElementById('game-status-mobile') || document.getElementById('tournament-game-status-mobile');
    if (statusMobile) {
      statusMobile.textContent = status;
    }
  }

  private bindEvents(): void {
    // Déléguer la gestion des événements au composant Controls
    this.controls.bindKeyboardEvents();
    
    // Gérer la pause
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      }
    });
  }

  // API publique
  public startGame(): void {
    console.log('🚀 Starting game...');
    
    if (this.isRemoteGame) {
      this.connectToServer();
    } else {
      this.startLocalGame();
    }
  }

  protected startLocalGame(): void {
    this.updateGameStatus('Démarrage du jeu...');
    this.physics.reset();

    //demarrer le tracking du match
    this.matchStartTime = Date.now();
    this.isMatchDataSent = false;
    this.startCountdown();
  }

  private startCountdown(): void {
    let count = 3;
    this.updateGameStatus(`Démarrage dans ${count}...`);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        this.updateGameStatus(`Démarrage dans ${count}...`);
      } else {
        clearInterval(countdownInterval);
        this.gameState.status = 'playing';
        this.updateGameStatus('Jeu en cours');
        this.physics.launchBall();
      }
    }, 1000);
  }

  public togglePause(): void {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
      this.updateGameStatus('Jeu en pause');
    } else if (this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
      this.updateGameStatus('Jeu en cours');
    }
  }

  public getGameStatus(): string {
    return this.gameState.status;
  }

  public handleMobileInput(player: string, direction: string, pressed: boolean): void {
    this.controls.handleMobileInput(player, direction, pressed);
  }

  public handleResize(): void {
    this.engine.resize();
    this.renderer.adjustCameraForScreen();
  }

  private connectToServer(): void {
    // TODO: Implémenter la connexion WebSocket
    console.log('🌐 Connecting to server...');
    this.updateGameStatus('Connexion au serveur...');
  }


  public togglePowerUps(enabled: boolean): void 
  {
    this.settings.powerUps = enabled;
    
    if (this.powerUpManager) {
      if (enabled) {
        this.powerUpManager.enable();
        console.log('🔋 Power-ups enabled');
      } else {
        this.powerUpManager.disable();
        console.log('🚫 Power-ups disabled');
      }
    }
  }

  public arePowerUpsEnabled(): boolean {
    return this.settings.powerUps || false;
  }

  public destroy(): void {
    console.log('🗑️ Destroying Pong3D...');

    // ✅ Nettoyer le gestionnaire de power-ups
    if (this.powerUpManager) {
      this.powerUpManager.dispose();
    }
    
    // Fermer le modal de fin de partie s'il est ouvert
    if (this.gameEndModal) {
      this.gameEndModal.close();
      this.gameEndModal = null;
    }
    
    this.controls.destroy();
    this.renderer.destroy();
    
    if (this.engine) {
      this.engine.dispose();
    }
    
    window.removeEventListener('resize', () => {});
  }
}