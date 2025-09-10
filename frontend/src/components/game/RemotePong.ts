import { Pong3D } from './Pong3D/Pong3D.js';
import { GameSettings } from './Pong3D/Pong3D.js';
import { authService } from '../../services/authService.js';
import { matchService } from '../../services/matchService.js';

export class RemotePong extends Pong3D {
  private signalingWS: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  
  private isHost: boolean = false;
  private playerId: string = '';
  private matchId: string = '';
  private opponentId: string = '';
  private opponentUsername: string = '';
  private opponentUserId: number | null = null;

  // Stocker les inputs du guest pour l'hôte
  private guestInputs = { up: false, down: false };

  constructor(canvasId: string, settings: GameSettings) {
    super(canvasId, settings, true, 'remote'); // isRemote = true, mode = 'remote'
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async startRemoteGame(): Promise<void> {
    console.log('🌐 Starting remote game...');
    this.updateGameStatus('Connexion au serveur...');
    
    try {
      await this.connectToSignalingServer();
      this.joinMatchmaking();
    } catch (error) {
      console.error('❌ Failed to start remote game:', error);
      this.updateGameStatus('Erreur de connexion');
    }
  }

  private async connectToSignalingServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // ✅ Utiliser l'IP de votre machine backend
      const wsUrl = 'ws://10.16.7.7:8001';
      console.log('🔗 Connecting to WebSocket:', wsUrl);
        
      this.signalingWS = new WebSocket(wsUrl);
      
      this.signalingWS.onopen = () => {
        console.log('✅ Connected to signaling server');
        resolve();
      };

      this.signalingWS.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.signalingWS.onclose = () => {
        console.log('❌ Signaling server disconnected');
        this.handleSignalingDisconnect();
      };

      this.signalingWS.onerror = (error) => {
        console.error('❌ Signaling server error:', error);
        reject(error);
      };

      // Timeout de connexion
      setTimeout(() => {
        if (this.signalingWS?.readyState !== WebSocket.OPEN) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  private joinMatchmaking(): void {
    if (!this.signalingWS) return;

    const currentUser = authService.getCurrentUser();
    const username = currentUser?.username || 'Guest';
    const userId = currentUser?.id;

    this.signalingWS.send(JSON.stringify({
      type: 'join_matchmaking',
      playerId: this.playerId,
      username: username,
      userId: userId
    }));

    this.updateGameStatus('Recherche d\'un adversaire...');
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    console.log('📨 Signaling message:', message.type);

    switch (message.type) {
      case 'waiting_opponent':
        this.updateGameStatus('En attente d\'un adversaire...');
        break;

      case 'match_found':
        this.matchId = message.matchId;
        this.isHost = message.role === 'host';
        this.opponentId = message.opponent.id;
        this.opponentUsername = message.opponent.username;
        this.opponentUserId = message.opponent.userId;
        
        console.log('🎯 Match found details:', {
          role: message.role,
          opponentUsername: this.opponentUsername,
          opponentUserId: this.opponentUserId
        });
        
        this.updateGameStatus(`Adversaire trouvé: ${message.opponent.username}`);
        await this.setupWebRTCConnection();
        break;

      case 'webrtc_offer':
        await this.handleWebRTCOffer(message);
        break;

      case 'webrtc_answer':
        await this.handleWebRTCAnswer(message);
        break;

      case 'webrtc_ice_candidate':
        await this.handleICECandidate(message);
        break;

      case 'opponent_disconnected':
        this.handleOpponentDisconnect();
        break;
    }
  }

  private async setupWebRTCConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Gérer les candidats ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingWS) {
        this.signalingWS.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate
        }));
      }
    };

    if (this.isHost) {
      // L'hôte crée le canal de données
      this.dataChannel = this.peerConnection.createDataChannel('gameData', {
        ordered: false,
        maxRetransmits: 0
      });
      this.setupDataChannelHandlers();

      // Créer et envoyer l'offre
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.signalingWS?.send(JSON.stringify({
        type: 'webrtc_offer',
        offer: offer
      }));
    } else {
      // L'invité attend le canal de données
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers();
      };
    }
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('🔗 WebRTC P2P connection established');
      
      if (this.isHost) {
        this.updateGameStatus('Démarrage du jeu...');
        this.startGameAsHost();
      } else {
        console.log('👥 Guest connected - starting as guest');
        this.updateGameStatus('Prêt à jouer !');
        
        // L'invité doit aussi démarrer son jeu local pour avoir les contrôles
        this.startLocalGameAsGuest();
      }
    };

    this.dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleP2PMessage(data);
    };

    this.dataChannel.onclose = () => {
      console.log('❌ P2P connection closed');
      this.handleOpponentDisconnect();
    };
  }

  private async handleWebRTCOffer(message: any): Promise<void> {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(message.offer);
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.signalingWS?.send(JSON.stringify({
      type: 'webrtc_answer',
      answer: answer
    }));
  }

  private async handleWebRTCAnswer(message: any): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(message.answer);
  }

  private async handleICECandidate(message: any): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(message.candidate);
  }

  private startGameAsHost(): void {
    console.log('🎮 Starting game as HOST');
    
    // Mettre à jour les noms des joueurs
    this.settings.player1Name = authService.getCurrentUser()?.username || 'Host';
    this.settings.player2Name = this.opponentUsername;
    
    // Démarrer le jeu local (l'hôte calcule la physique)
    this.startLocalGame();
    
    // Démarrer l'envoi des updates de jeu
    this.startGameUpdateLoop();
  }

  private startGameUpdateLoop(): void {
    if (!this.isHost) return;

    const sendUpdate = () => {
      if (this.dataChannel?.readyState === 'open') {
        const positions = this.physics.getPositions();
        
        const gameUpdate = {
          type: 'game_update',
          state: {
            ball: positions.ball,
            paddles: {
              player1Paddle: positions.player1Paddle,
              player2Paddle: positions.player2Paddle
            },
            scores: this.gameState.scores,
            timer: this.gameState.timer,
            status: this.gameState.status,
            winner: this.gameState.winner
          }
        };

        this.dataChannel.send(JSON.stringify(gameUpdate));
      }
      
      // Programmer le prochain envoi (60 FPS) seulement si le jeu n'est pas fini
      if (this.gameState.status !== 'finished') {
        requestAnimationFrame(sendUpdate);
      }
    };

    sendUpdate();
  }

  // Override de la méthode parent - seul l'hôte calcule la physique
  protected updateGame(): void {
    if (!this.isHost) {
      // L'invité lit ses inputs et les envoie, mais ne calcule pas la physique
      this.sendContinuousInputToHost();
      return;
    }
    
    // HÔTE : Modifier les inputs avant d'appeler le parent
    const hostInputs = this.controls.getInputs();
    
    // Créer des inputs modifiés : hôte contrôle player1, guest contrôle player2
    const modifiedInputs = {
      player1: hostInputs.player1, // L'hôte garde ses contrôles pour player1
      player2: this.guestInputs     // Le guest contrôle player2 via WebRTC
    };
    
    console.log('🎮 Host using inputs:', modifiedInputs);
    
    // Temporairement remplacer les inputs du système de contrôle
    const originalGetInputs = this.controls.getInputs;
    this.controls.getInputs = () => modifiedInputs;
    
    // Appeler la logique du parent avec les inputs modifiés
    super.updateGame();
    
    // Restaurer la méthode originale
    this.controls.getInputs = originalGetInputs;
  }

  private handleP2PMessage(data: any): void {
    switch (data.type) {
      case 'game_update':
        if (!this.isHost) {
          this.applyRemoteGameState(data.state);
        }
        break;

      case 'player_input':
        if (this.isHost) {
          this.applyRemoteInput(data.input);
        }
        break;
    }
  }

  private applyRemoteGameState(state: any): void {
    // Mettre à jour l'affichage avec l'état reçu de l'hôte
    this.renderer.updatePositions({
      player1Paddle: state.paddles.player1Paddle,
      player2Paddle: state.paddles.player2Paddle,
      ball: state.ball
    });

    this.gameState.scores = state.scores;
    this.gameState.timer = state.timer;
    this.gameState.status = state.status;
    this.gameState.winner = state.winner;
    
    // Mettre à jour l'affichage des scores et du timer pour le guest
    this.updateUI();

    // Vérifier la fin de partie
    if (state.status === 'finished') {
      console.log('🏁 Remote game ended for guest');
      this.handleRemoteGameEnd();
    }
  }

  private applyRemoteInput(input: any): void {
    // L'hôte met à jour l'état des inputs du guest
    console.log('🎯 Host received input:', input);
    
    // Stocker les inputs du guest pour les utiliser dans updateGame()
    this.guestInputs = {
      up: input.up || false,
      down: input.down || false
    };
  }

  // Override des contrôles pour les invités - ne pas envoyer d'événements individuels
  protected handleKeydown(event: KeyboardEvent): void {
    if (this.isHost) {
      // L'hôte utilise les contrôles normaux (mais seulement pour player1)
      // Le parent gère déjà les événements clavier
      return;
    } else {
      // L'invité n'a pas besoin de gérer les événements individuels
      // Ses inputs sont envoyés via sendContinuousInputToHost()
      return;
    }
  }

  protected handleKeyup(event: KeyboardEvent): void {
    if (this.isHost) {
      // Même logique pour keyup
      return;
    } else {
      return;
    }
  }

  private sendContinuousInputToHost(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;

    // Récupérer l'état actuel des inputs depuis le système de contrôle
    const inputs = this.controls.getInputs();
    
    // Envoyer seulement player1 inputs (de l'invité) qui deviendront player2 inputs sur l'hôte
    const input = {
      up: inputs.player1.up,
      down: inputs.player1.down
    };

    // ✅ IMPORTANT: Envoyer TOUJOURS l'état actuel, même si c'est "false"
    // Cela permet de désactiver les mouvements quand on relâche la touche
    this.dataChannel.send(JSON.stringify({
      type: 'player_input',
      input: input
    }));

    // Debug seulement si il y a une action (pour éviter le spam)
    if (input.up || input.down) {
      console.log('📤 Guest sending input to host:', input);
    }
  }

  private sendInputToHost(keyCode: string, pressed: boolean): void {
    // Cette méthode n'est plus utilisée mais on la garde pour compatibilité
    return;
  }

  private handleOpponentDisconnect(): void {
    this.gameState.status = 'paused';
    this.updateGameStatus('Adversaire déconnecté');
    
    // Afficher modal de déconnexion
    this.showDisconnectionModal();
  }

  private handleSignalingDisconnect(): void {
    if (this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
      this.updateGameStatus('Connexion perdue');
    }
  }

  private showDisconnectionModal(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
        <h3 class="text-xl mb-4 text-white">Connexion perdue</h3>
        <p class="mb-6 text-gray-300">L'adversaire s'est déconnecté</p>
        <button id="return-menu" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white">
          Retour au menu
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('return-menu')?.addEventListener('click', () => {
      modal.remove();
      this.destroy();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });
  }

  // Override endGame pour les jeux remote
  protected endGame(winner: 'player1' | 'player2'): void {
    console.log('🏁 Remote game ending via endGame override');
    
    // Appeler la logique du parent pour les stats etc. mais sans le modal/sauvegarde
    const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    
    // Mettre à jour le statut
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    
    // Appeler onGameEnd si défini (pour les callbacks)
    if (this.onGameEnd) {
      this.onGameEnd(winnerName, this.gameState.scores, duration);
    }
    
    // Pour les jeux remote, on gère la fin avec notre méthode custom
    this.handleRemoteGameEnd();
  }

  private async handleRemoteGameEnd(): Promise<void> {
    console.log('🏁 Remote game ended');
    
    // Sauvegarder les données de match remote (seulement une fois par l'host)
    if (this.isHost && this.opponentUserId && !this.isMatchDataSent) {
      try {
        await this.saveRemoteMatchData();
      } catch (error) {
        console.error('❌ Failed to save remote match data:', error);
      }
    }
    
    // Déclencher le modal de fin pour les deux joueurs
    if (this.gameState.winner) {
      const winner = this.gameState.winner;
      const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
      const loserName = winner === 'player1' ? this.settings.player2Name : this.settings.player1Name;
      
      // Déclencher le modal de fin comme dans le parent
      setTimeout(() => {
        this.showGameEndModal(winner, winnerName, loserName);
      }, 500); // Petit délai pour laisser l'UI se mettre à jour
    }
    
    setTimeout(() => {
      this.cleanupConnections();
    }, 3000);
  }

  private async saveRemoteMatchData(): Promise<void> {
    if (!this.opponentUserId) {
      console.error('❌ Cannot save remote match: opponent user ID missing');
      return;
    }

    const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    
    console.log('💾 Attempting to save remote match data:', {
      opponentUserId: this.opponentUserId,
      scores: this.gameState.scores,
      duration: duration
    });
    
    try {
      await matchService.sendRemoteMatchData(
        this.opponentUserId,
        this.gameState.scores.player1,
        this.gameState.scores.player2,
        duration
      );
      
      this.isMatchDataSent = true;
      console.log('✅ Remote match data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save remote match data:', error);
      throw error;
    }
  }

  private cleanupConnections(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingWS) {
      this.signalingWS.send(JSON.stringify({ 
        type: 'leave_matchmaking',
        playerId: this.playerId
      }));
      this.signalingWS.close();
      this.signalingWS = null;
    }
  }

  public destroy(): void {
    this.cleanupConnections();
    super.destroy();
  }

  private startLocalGameAsGuest(): void {
    console.log('👥 Starting game as GUEST');
    
    // Mettre à jour les noms des joueurs
    // Host = player1 (paddle gauche), Guest = player2 (paddle droite)
    this.settings.player1Name = this.opponentUsername; // Host
    this.settings.player2Name = authService.getCurrentUser()?.username || 'Guest'; // Guest
    
    // Pour l'invité : seulement initialiser les contrôles et attendre
    // Ne pas appeler startLocalGame() qui lancerait la physique
    this.updateGameStatus('En attente du host...');
    
    // L'invité doit quand même avoir ses contrôles bindés
    // (normalement fait dans le constructor de Pong3D)
    if (!this.controls) {
      console.warn('⚠️ Controls not initialized for guest');
    }
  }
}
