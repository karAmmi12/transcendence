import { Pong3D } from './Pong3D/Pong3D.js';
import { GameSettings } from './Pong3D/Pong3D.js';
import { authService } from '../../services/authService.js';
import { matchService } from '../../services/matchService.js';
import { ApiConfig } from '../../config/api.js';

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
  
  // Flag pour éviter les doubles traitements de déconnexion
  private gameEndedByDisconnection = false;
  
  // Handler pour la détection de fermeture de page
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private navigationHandler: ((event: CustomEvent) => void) | null = null;

  constructor(canvasId: string, settings: GameSettings) {
    super(canvasId, settings, true, 'remote'); // isRemote = true, mode = 'remote'
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Détecter la fermeture/actualisation de la page
    this.setupPageLeaveDetection();
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
      // ✅ Utiliser la configuration dynamique
      const wsUrl = ApiConfig.WS_URL;
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      ApiConfig.logUrls(); // Debug des URLs
        
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

  private setupPageLeaveDetection(): void {
    // Détecter la fermeture/actualisation de la page
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      console.log('🚪 Page is being closed/refreshed');
      this.notifyDisconnection();
      
      // Optionnel : demander confirmation si une partie est en cours
      if (this.gameState.status === 'playing') {
        event.preventDefault();
        event.returnValue = 'Une partie est en cours. Êtes-vous sûr de vouloir quitter ?';
        return event.returnValue;
      }
    };

    // Détecter quand l'onglet devient invisible (changement d'onglet, minimisation, etc.)
    this.visibilityChangeHandler = () => {
      if (document.hidden && this.gameState.status === 'playing') {
        console.log('👁️ Page became hidden during game');
        // Optionnel : pause automatique ou notification
        setTimeout(() => {
          if (document.hidden && this.gameState.status === 'playing') {
            console.log('🔔 User has been away too long, notifying disconnection');
            this.notifyDisconnection();
          }
        }, 30000); // 30 secondes d'absence = déconnexion
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    
    // Détecter la navigation vers d'autres pages
    this.navigationHandler = (event: CustomEvent) => {
      const targetRoute = event.detail;
      if (targetRoute !== '/game' && this.gameState.status === 'playing') {
        console.log('🚶 User navigating away from game during match:', targetRoute);
        this.notifyDisconnection();
      }
    };
    
    window.addEventListener('beforeNavigate', this.navigationHandler as EventListener);
  }

  private notifyDisconnection(): void {
    console.log('📡 Notifying opponent of disconnection');
    
    // Envoyer immédiatement un signal de déconnexion via le canal de données P2P
    if (this.dataChannel?.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({
          type: 'player_disconnect',
          playerId: this.playerId,
          reason: 'page_leave'
        }));
      } catch (error) {
        console.error('❌ Failed to send disconnect via P2P:', error);
      }
    }

    // Envoyer aussi via le serveur de signaling
    if (this.signalingWS?.readyState === WebSocket.OPEN) {
      try {
        this.signalingWS.send(JSON.stringify({
          type: 'voluntary_disconnect',
          playerId: this.playerId,
          matchId: this.matchId,
          reason: 'page_leave'
        }));
      } catch (error) {
        console.error('❌ Failed to send disconnect via signaling:', error);
      }
    }

    // Fermer les connexions immédiatement
    this.quickCleanup();
  }

  private quickCleanup(): void {
    console.log('⚡ Quick cleanup for page leave');
    
    try {
      if (this.dataChannel) {
        this.dataChannel.close();
      }
      if (this.peerConnection) {
        this.peerConnection.close();
      }
      if (this.signalingWS) {
        this.signalingWS.close();
      }
    } catch (error) {
      console.error('❌ Error during quick cleanup:', error);
    }
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
        console.log(`❌ Opponent disconnected: ${message.disconnectedPlayer} (${message.reason})`);
        this.updateGameStatus(`${message.disconnectedPlayer} s'est déconnecté`);
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
      if (!this.gameEndedByDisconnection) {
        this.handleOpponentDisconnect();
      }
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

      case 'player_disconnect':
        console.log('🚪 Opponent disconnected voluntarily:', data.reason);
        if (!this.gameEndedByDisconnection) {
          this.handleOpponentDisconnect();
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
    this.updateTimerDisplay(); // nouvelle methode pour forcer la maj

    // Vérifier la fin de partie
    if (state.status === 'finished') {
      console.log('🏁 Remote game ended for guest');
      this.handleRemoteGameEnd();
    }
  }

  // ✅ Nouvelle méthode pour forcer la mise à jour du timer
  private updateTimerDisplay(): void {
    const minutes = Math.floor(this.gameState.timer / 60);
    const seconds = Math.floor(this.gameState.timer % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Mettre à jour tous les éléments de timer possibles
    const timerElements = [
      document.querySelector('#game-timer .text-lg'),
      document.querySelector('#game-timer .text-2xl'),
      document.getElementById('game-timer-display'),
      document.getElementById('game-timer-mobile')
    ];
    
    timerElements.forEach(el => {
      if (el) el.textContent = timeString;
    });
    
    console.log('🕐 Guest timer updated:', timeString);
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
    if (this.gameState.status === 'finished' || this.gameEndedByDisconnection) {
      return; // Éviter les doubles traitements
    }

    console.log('❌ Opponent disconnected - awarding victory');
    this.gameEndedByDisconnection = true;
    
    // Déterminer qui gagne automatiquement
    const currentUser = authService.getCurrentUser();
    let winner: 'player1' | 'player2';
    let winnerName: string;
    let loserName: string;

    if (this.isHost) {
      // L'hôte gagne car le guest s'est déconnecté
      winner = 'player1'; // Host = player1
      winnerName = currentUser?.username || 'Host';
      loserName = this.opponentUsername;
    } else {
      // Le guest gagne car l'host s'est déconnecté
      winner = 'player2'; // Guest = player2
      winnerName = currentUser?.username || 'Guest';
      loserName = this.opponentUsername;
    }

    // Mettre à jour l'état du jeu
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    // Donner un score automatique (5-0 par forfait)
    if (winner === 'player1') {
      this.gameState.scores.player1 = 5;
      this.gameState.scores.player2 = 0;
    } else {
      this.gameState.scores.player1 = 0;
      this.gameState.scores.player2 = 5;
    }

    this.updateGameStatus(`Victoire par forfait !`);
    
    // Sauvegarder le match avec victoire par forfait
    this.handleDisconnectionVictory(winner, winnerName, loserName);
  }

  private async handleDisconnectionVictory(winner: 'player1' | 'player2', winnerName: string, loserName: string): Promise<void> {
    console.log(`🏆 Victory by forfeit: ${winnerName} wins`);
    
    // Sauvegarder les données de match si on est l'hôte et qu'on a l'ID de l'adversaire
    if (this.isHost && this.opponentUserId && !this.isMatchDataSent) {
      try {
        const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
        await this.saveRemoteMatchData();
        console.log('✅ Forfeit match data saved');
      } catch (error) {
        console.error('❌ Failed to save forfeit match data:', error);
      }
    }

    // Afficher le modal de victoire après un court délai
    setTimeout(() => {
      this.showDisconnectionVictoryModal(winnerName, loserName);
    }, 1000);

    // Nettoyer les connexions
    setTimeout(() => {
      this.cleanupConnections();
    }, 3000);
  }

  private showDisconnectionVictoryModal(winnerName: string, loserName: string): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-8 text-center border border-gray-700 max-w-md">
        <div class="mb-4">
          <div class="text-6xl mb-4">🏆</div>
          <h3 class="text-2xl font-bold mb-2 text-yellow-400">Victoire !</h3>
          <p class="text-lg mb-4 text-white">${winnerName} remporte la partie</p>
        </div>
        
        <div class="bg-gray-700 rounded-lg p-4 mb-6">
          <p class="text-gray-300 mb-2">Victoire par forfait</p>
          <p class="text-sm text-gray-400">${loserName} s'est déconnecté</p>
          <div class="text-xl font-bold mt-2 text-green-400">
            Score final: 5 - 0
          </div>
        </div>

        <div class="flex gap-3 justify-center">
          <button id="play-again-btn" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white transition-colors">
            Nouvelle partie
          </button>
          <button id="return-menu-btn" class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded text-white transition-colors">
            Retour au menu
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Gérer les boutons
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      modal.remove();
      this.restartRemoteGame();
    });

    document.getElementById('return-menu-btn')?.addEventListener('click', () => {
      modal.remove();
      this.destroy();
      window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
    });
  }

  private restartRemoteGame(): void {
    console.log('🔄 Restarting remote game...');
    this.destroy();
    
    // Redémarrer une nouvelle partie remote
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startRemoteGame'));
    }, 500);
  }

  private handleSignalingDisconnect(): void {
    console.log('📡 Signaling server disconnected');
    
    if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection) {
      // Si on est en pleine partie et que le signaling se déconnecte,
      // essayer de continuer avec la connexion P2P existante
      this.updateGameStatus('Connexion serveur perdue - partie en cours...');
      
      // Si la connexion P2P est aussi fermée, traiter comme une déconnexion
      if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
        setTimeout(() => {
          if (!this.gameEndedByDisconnection) {
            this.handleOpponentDisconnect();
          }
        }, 5000); // Délai de grâce de 5 secondes
      }
    }
  }

  private showDisconnectionModal(): void {
    // Remplacer l'ancien modal simple par le nouveau système
    if (!this.gameEndedByDisconnection) {
      this.handleOpponentDisconnect();
    }
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
    console.log('🔌 Cleaning up connections');
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingWS && this.signalingWS.readyState === WebSocket.OPEN) {
      this.signalingWS.send(JSON.stringify({ 
        type: 'leave_matchmaking',
        playerId: this.playerId
      }));
      this.signalingWS.close();
      this.signalingWS = null;
    }
  }

  public destroy(): void {
    console.log('🧹 Destroying RemotePong instance');
    
    // Marquer comme détruit pour éviter les traitements en double
    this.gameEndedByDisconnection = true;
    
    // Retirer les handlers de détection de fermeture de page
    this.removePageLeaveDetection();
    
    this.cleanupConnections();
    super.destroy();
  }

  private removePageLeaveDetection(): void {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    
    if (this.navigationHandler) {
      window.removeEventListener('beforeNavigate', this.navigationHandler as EventListener);
      this.navigationHandler = null;
    }
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
