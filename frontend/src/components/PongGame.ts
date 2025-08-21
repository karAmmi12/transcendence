import { GameState } from '../types/game.js'; // Changé de @/types/game.js
import { i18n } from '../services/i18nService.js'; // Changé de @/services/i18n.js

export class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket | null = null;
  private gameState: GameState | null = null;
  private playerId: string;
  private keys: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(canvasId: string, playerId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.playerId = playerId;
    
    this.setupCanvas();
    this.bindEvents();
  }

  
  private setupCanvas(): void {
    this.canvas = document.getElementById('pong-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.ctx = this.canvas.getContext('2d')!;
    
    // Rendre le canvas responsive
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Ajouter les contrôles tactiles pour mobile
    this.setupTouchControls();
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const maxWidth = containerRect.width - 32; // Marges
    const maxHeight = window.innerHeight * 0.6; // 60% de la hauteur de l'écran

    // Calculer les dimensions en gardant le ratio 16:9
    let width = maxWidth;
    let height = width * (9/16);

    // Si trop haut, ajuster par la hauteur
    if (height > maxHeight) {
      height = maxHeight;
      width = height * (16/9);
    }

    // Minimum pour la jouabilité
    const minWidth = 320;
    const minHeight = 180;

    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);

    // Sur mobile, utiliser un ratio plus carré
    if (window.innerWidth <= 768) {
      height = width * (3/4); // Ratio 4:3 pour mobile
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    console.log(`Canvas resized to: ${width}x${height}`);
  }

  private setupTouchControls(): void {
    // Ajouter des boutons de contrôle tactile pour mobile
    if (window.innerWidth <= 768) {
      this.addTouchControls();
    }

    // Contrôles de swipe
    let startY = 0;
    let currentY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      startY = touch.clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      currentY = touch.clientY;
      
      const deltaY = currentY - startY;
      this.handleTouchMove(deltaY);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      startY = 0;
      currentY = 0;
    }, { passive: false });
  }

  private addTouchControls(): void {
    const container = this.canvas.parentElement;
    if (!container || document.getElementById('touch-controls')) return;

    const touchControls = document.createElement('div');
    touchControls.id = 'touch-controls';
    touchControls.className = 'flex justify-between mt-4 md:hidden';
    touchControls.setAttribute('data-touch-control', 'true');

    touchControls.innerHTML = `
      <button 
        id="touch-up" 
        class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg active:bg-blue-800 touch-manipulation"
        style="min-width: 60px; min-height: 60px;"
      >
        ↑
      </button>
      <div class="text-center text-gray-400 text-sm flex items-center px-4">
        ${i18n.t('game.controls.instructions')}
      </div>
      <button 
        id="touch-down" 
        class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg active:bg-blue-800 touch-manipulation"
        style="min-width: 60px; min-height: 60px;"
      >
        ↓
      </button>
    `;

    container.appendChild(touchControls);

    // Événements pour les boutons tactiles
    const upBtn = document.getElementById('touch-up');
    const downBtn = document.getElementById('touch-down');

    upBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys['w'] = true;
    });

    upBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys['w'] = false;
    });

    downBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys['s'] = true;
    });

    downBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys['s'] = false;
    });
  }

  private handleTouchMove(deltaY: number): void {
    // Convertir le mouvement tactile en mouvement de paddle
    const sensitivity = 0.5;
    const moveAmount = deltaY * sensitivity;
    
    if (this.gameState?.paddles?.player1) {
      const newY = this.gameState.paddles.player1.y + moveAmount;
      const maxY = this.canvas.height - this.gameState.paddles.player1.height;
      
      this.gameState.paddles.player1.y = Math.max(0, Math.min(newY, maxY));
    }
  }

  private bindEvents(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.handleInput();
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.handleInput();
    });
  }

  private handleInput(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    let direction: 'up' | 'down' | 'stop' = 'stop';

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      direction = 'up';
    } else if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      direction = 'down';
    }

    this.ws.send(JSON.stringify({
      type: 'player_input',
      direction
    }));
  }

  public connect(): void {
    // Construire l'URL WebSocket correctement
    // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // const host = window.location.host;
    // const wsUrl = `${protocol}//${host}/api/game/ws`;
    
    // console.log('Attempting to connect to:', wsUrl);
    // this.showMessage('Connecting to server...');

    // Connexion directe au backend (sans nginx)
    const wsUrl = 'ws://localhost:8000/api/game/ws';
    
    console.log('Direct backend connection:', wsUrl);
    this.ws = new WebSocket(wsUrl);
  

    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.reconnectAttempts = 0;
      this.showMessage('Connected! Looking for opponent...');
      this.joinGame();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('Disconnected from game server', event.code, event.reason);
      this.showMessage('Disconnected from server');
      
      // Tentative de reconnexion
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          this.connect();
        }, 2000);
      } else {
        this.showMessage('Connection failed. Please refresh the page.');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.showMessage('Connection error');
    };
  }

  private joinGame(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending join_game message for player:', this.playerId);
      this.ws.send(JSON.stringify({
        type: 'join_game',
        playerId: this.playerId
      }));
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'waiting_for_player':
        this.gameState = message.data;
        this.showWaitingMessage();
        this.render();
        break;

      case 'game_started':
        this.gameState = message.data;
        this.hideWaitingMessage();
        this.render();
        break;

      case 'game_update':
        this.gameState = message.data;
        this.render();
        break;

      case 'player_left':
        this.showMessage('Opponent left the game');
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private render(): void {
    if (!this.gameState) return;

    // Effacer le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dessiner les raquettes
    this.ctx.fillStyle = '#fff';
    
    // Raquette joueur 1
    this.ctx.fillRect(
      this.gameState.paddles.player1.x,
      this.gameState.paddles.player1.y,
      this.gameState.paddles.player1.width,
      this.gameState.paddles.player1.height
    );

    // Raquette joueur 2
    this.ctx.fillRect(
      this.gameState.paddles.player2.x,
      this.gameState.paddles.player2.y,
      this.gameState.paddles.player2.width,
      this.gameState.paddles.player2.height
    );

    // Dessiner la balle
    this.ctx.beginPath();
    this.ctx.arc(
      this.gameState.ball.x,
      this.gameState.ball.y,
      this.gameState.ball.radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Dessiner la ligne centrale
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Afficher le score
    this.drawScore();

    // Afficher le message de fin si nécessaire
    if (this.gameState.status === 'finished') {
      this.showGameEnd();
    }
  }

  private drawScore(): void {
    if (!this.gameState) return;

    this.ctx.font = '48px Orbitron, monospace';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';

    // Score joueur 1
    this.ctx.fillText(
      this.gameState.score.player1.toString(),
      this.canvas.width / 4,
      60
    );

    // Score joueur 2
    this.ctx.fillText(
      this.gameState.score.player2.toString(),
      (this.canvas.width * 3) / 4,
      60
    );
  }

  private showWaitingMessage(): void {
    const message = document.getElementById('game-message');
    if (message) {
      message.textContent = 'Waiting for opponent...';
      message.classList.remove('hidden');
    }
  }

  private hideWaitingMessage(): void {
    const message = document.getElementById('game-message');
    if (message) {
      message.classList.add('hidden');
    }
  }

  private showMessage(text: string): void {
    const message = document.getElementById('game-message');
    if (message) {
      message.textContent = text;
      message.classList.remove('hidden');
    }
    
    // Aussi afficher sur le canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px Orbitron, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
  }

  private showGameEnd(): void {
    if (!this.gameState) return;

    const isWinner = this.gameState.winnerId === this.playerId;
    const message = isWinner ? 'You Win!' : 'You Lose!';
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = isWinner ? '#00ff00' : '#ff0000';
    this.ctx.font = '48px Orbitron, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.send(JSON.stringify({
        type: 'leave_game'
      }));
      this.ws.close();
    }
  }
}