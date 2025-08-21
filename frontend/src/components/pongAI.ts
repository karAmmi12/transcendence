import { AIGameService } from '@services/aiGameService.js';
import { GameState } from '@/types/game.js';
import { i18n } from '@/services/i18nService.js';

export class PongAI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private aiGameService: AIGameService;
  private gameState: GameState | null = null;
  private keys: { [key: string]: boolean } = {};
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private isPlaying: boolean = false;

  constructor(canvasId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.aiGameService = new AIGameService();
    this.difficulty = difficulty;
    
    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.border = '2px solid white';
    this.canvas.style.backgroundColor = '#111';
  }

  private setupEventListeners(): void {
    // Contrôles clavier
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Contrôles souris
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isPlaying) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      
      // Convertir la position de la souris en position du paddle
      const paddleY = mouseY - 50; // 50 = height/2 du paddle
      this.aiGameService.updatePlayerPaddle(paddleY);
    });
  }

  async startGame(): Promise<void> {
    try {
      this.gameState = await this.aiGameService.createGame(this.difficulty);
      this.isPlaying = true;
      
      // Démarrer la boucle de jeu
      this.aiGameService.startGameLoop((gameState) => {
        this.gameState = gameState;
        this.render();
        this.handleInput();
      });
      
      this.showMessage(`${i18n.t('game.status.playing')} - ${i18n.t('game.difficulty.' + this.difficulty)}`);
    } catch (error) {
      console.error('Error starting AI game:', error);
      this.showMessage(i18n.t('game.errors.connectionFailed'));
    }
  }

  private handleInput(): void {
    if (!this.gameState || !this.isPlaying) return;

    const paddle = this.gameState.paddles.player1;
    const speed = 8;
    
    if (this.keys['w'] || this.keys['arrowup']) {
      const newY = Math.max(0, paddle.y - speed);
      this.aiGameService.updatePlayerPaddle(newY);
    }
    
    if (this.keys['s'] || this.keys['arrowdown']) {
      const newY = Math.min(this.gameState.gameHeight - paddle.height, paddle.y + speed);
      this.aiGameService.updatePlayerPaddle(newY);
    }
  }

  private render(): void {
    if (!this.gameState) return;

    // Nettoyer le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner le terrain
    this.drawField();

    // Dessiner les paddles
    this.drawPaddle(this.gameState.paddles.player1, '#00ff00'); // Vert pour le joueur
    this.drawPaddle(this.gameState.paddles.player2, '#ff0000'); // Rouge pour l'IA

    // Dessiner la balle
    this.drawBall(this.gameState.ball);

    // Dessiner le score
    this.drawScore();

    // Vérifier la fin de jeu
    if (this.gameState.status === 'finished') {
      this.showGameEnd();
    }
  }

  private drawField(): void {
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = '#444';
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawPaddle(paddle: any, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  }

  private drawBall(ball: any): void {
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
  }

  private drawScore(): void {
    this.ctx.font = '48px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    
    // Score du joueur
    this.ctx.fillText(
      this.gameState!.score.player1.toString(),
      this.canvas.width / 4,
      60
    );
    
    // Score de l'IA
    this.ctx.fillText(
      this.gameState!.score.player2.toString(),
      (this.canvas.width * 3) / 4,
      60
    );

    // Labels
    this.ctx.font = '16px Arial';
    this.ctx.fillText(i18n.t('game.score.you'), this.canvas.width / 4, 90);
    this.ctx.fillText('AI', (this.canvas.width * 3) / 4, 90);
  }

  private showGameEnd(): void {
    this.isPlaying = false;
    this.aiGameService.stopGameLoop();
    
    const isWin = this.gameState!.score.player1 > this.gameState!.score.player2;
    const message = isWin ? i18n.t('game.result.win') : i18n.t('game.result.loss');
    
    this.ctx.font = '32px Arial';
    this.ctx.fillStyle = isWin ? '#00ff00' : '#ff0000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(i18n.t('game.pressToRestart'), this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  private showMessage(message: string): void {
    const messageElement = document.getElementById('ai-game-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.classList.remove('hidden');
    }
  }

  async changeDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<void> {
    this.difficulty = difficulty;
    if (this.aiGameService.getGameId()) {
      await this.aiGameService.changeDifficulty(difficulty);
      this.showMessage(`${i18n.t('game.difficulty.changed')} ${i18n.t('game.difficulty.' + difficulty)}`);
    }
  }

  async endGame(): Promise<void> {
    this.isPlaying = false;
    await this.aiGameService.endGame();
    this.gameState = null;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  disconnect(): void {
    this.endGame();
  }
}