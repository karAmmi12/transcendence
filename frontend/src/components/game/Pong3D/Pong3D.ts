import * as BABYLON from '@babylonjs/core';
import { GameRenderer } from './GameRenderer.js';
import { GamePhysics } from './GamePhysics.js';
import { GameControls } from './GameControls.js';

export interface GameSettings {
  player1Name: string;
  player2Name: string;
  ballSpeed: 'slow' | 'medium' | 'fast';
  winScore: number;
  enableEffects?: boolean;
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
  private renderer: GameRenderer;
  private physics: GamePhysics;
  private controls: GameControls;
  
  // État du jeu
  private gameState: GameState = {
    status: 'waiting',
    scores: { player1: 0, player2: 0 },
    timer: 0
  };
  
  private settings: GameSettings;
  private isRemoteGame: boolean;

  constructor(canvasId: string, settings: GameSettings, isRemote = false) {
    console.log('🎮 Initializing Pong3D...');
    
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found`);
    }
    
    this.settings = settings;
    this.isRemoteGame = isRemote;
    
    this.initEngine();
    this.initComponents();
    this.bindEvents();
    
    console.log('✅ Pong3D initialized successfully');
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

  private initComponents(): void {
    // Initialiser les composants
    this.renderer = new GameRenderer(this.scene, this.settings);
    this.physics = new GamePhysics(this.settings);
    this.controls = new GameControls();
    
    // Démarrer la boucle de rendu
    this.startRenderLoop();
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
    // Mettre à jour les contrôles
    const paddleInputs = this.controls.getInputs();
    
    // Mettre à jour la physique
    const physicsUpdate = this.physics.update(paddleInputs);
    
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

  private endGame(winner: 'player1' | 'player2'): void {
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    this.updateGameStatus(`🏆 ${winnerName} wins!`);
    
    console.log(`🏁 Game finished! Winner: ${winnerName}`);
  }

  private updateTimer(): void {
    this.gameState.timer += this.engine.getDeltaTime() / 1000;
    
    const minutes = Math.floor(this.gameState.timer / 60);
    const seconds = Math.floor(this.gameState.timer % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerEl = document.querySelector('#game-timer .text-2xl');
    if (timerEl) timerEl.textContent = timeString;
  }

  private updateUI(): void {
    // Mettre à jour les scores
    const p1Score = document.getElementById('player1-score');
    const p2Score = document.getElementById('player2-score');
    
    if (p1Score) p1Score.textContent = this.gameState.scores.player1.toString();
    if (p2Score) p2Score.textContent = this.gameState.scores.player2.toString();
  }

  private updateGameStatus(status: string): void {
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
      statusEl.textContent = status;
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

  private startLocalGame(): void {
    this.updateGameStatus('Démarrage du jeu...');
    this.physics.reset();
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

  public destroy(): void {
    console.log('🗑️ Destroying Pong3D...');
    
    this.controls.destroy();
    this.renderer.destroy();
    
    if (this.engine) {
      this.engine.dispose();
    }
    
    window.removeEventListener('resize', () => {});
  }
}