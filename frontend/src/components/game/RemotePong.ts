import { Pong3D } from './Pong3D/Pong3D.js';
import { GameSettings } from './Pong3D/Pong3D.js';
import { authService } from '../../services/authService.js';
import { matchService } from '../../services/matchService.js';
import { ApiConfig } from '../../config/api.js';
import { GameEndModal, GameEndStats, GameEndCallbacks } from '../game/GameEndModal.js';

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
  
  // ✅ Flag pour empêcher le matchmaking après une interruption
  private gameWasInterrupted = false;
  
  // ✅ Flag pour savoir si le guest a reçu les paramètres de l'hôte
  private hasReceivedHostSettings = false;
  
  // Handler pour la détection de fermeture de page
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private navigationHandler: ((event: CustomEvent) => void) | null = null;

  constructor(canvasId: string, settings: GameSettings) {
    super(canvasId, settings, true, 'remote'); // isRemote = true, mode = 'remote'
    
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ Vérifier si on revient d'une actualisation pendant une partie
    this.checkForGameInterruption();
    
    // ✅ Si le jeu a été interrompu, ne pas initialiser le matchmaking
    if (this.gameWasInterrupted) {
      console.log('🚫 Game was interrupted, skipping normal initialization');
      return; // Arrêter l'initialisation ici
    }
    
    // Détecter la fermeture/actualisation de la page
    this.setupPageLeaveDetection();
    
    // ✅ Log du statut d'interruption pour debug
    console.log('🎮 RemotePong created, gameWasInterrupted:', this.gameWasInterrupted);
  }

  // ✅ Nouvelle méthode pour détecter une interruption de jeu
  private checkForGameInterruption(): void {
    // Vérifier si on était en partie avant l'actualisation
    const wasInGame = sessionStorage.getItem('remote_game_active');
    const gameData = sessionStorage.getItem('remote_game_data');
    
    if (wasInGame === 'true' && gameData) {
      console.log('🔄 Detected page refresh during remote game');
      
      // ✅ Marquer que le jeu a été interrompu pour empêcher le matchmaking
      this.gameWasInterrupted = true;
      
      // ✅ Masquer immédiatement l'interface de jeu
      setTimeout(() => this.hideGameInterface(), 0);
      
      try {
        const data = JSON.parse(gameData);
        console.log('📊 Previous game data:', data);
        
        // ✅ NE PAS nettoyer le sessionStorage ici - laisser GamePage.ts le gérer
        // sessionStorage.removeItem('remote_game_active');
        // sessionStorage.removeItem('remote_game_data');
        
        // ✅ Masquer à nouveau après un court délai pour être sûr
        setTimeout(() => this.hideGameInterface(), 50);
        setTimeout(() => this.hideGameInterface(), 200);
        
        // ✅ Vérifier si on est sur la page /game (GamePage.ts gère déjà le modal)
        const currentPath = window.location.pathname;
        if (currentPath === '/game') {
          console.log('🏠 On game page - GamePage.ts will handle the forfeit modal and cleanup');
          return; // GamePage.ts affichera le modal de défaite et nettoiera
        }
        
        // Afficher le modal de défaite par forfait plus rapidement
        setTimeout(() => {
          this.showGameInterruptionModal(data.opponentUsername || 'Adversaire');
        }, 100); // Réduire le délai à 100ms
        
      } catch (error) {
        console.error('❌ Failed to parse game data:', error);
        // ✅ Masquer à nouveau après un court délai pour être sûr
        setTimeout(() => this.hideGameInterface(), 50);
        setTimeout(() => this.hideGameInterface(), 200);
        
        // ✅ Vérifier si on est sur la page /game (GamePage.ts gère déjà le modal)
        const currentPath = window.location.pathname;
        if (currentPath === '/game') {
          console.log('🏠 On game page - GamePage.ts will handle the forfeit modal');
          return; // GamePage.ts affichera le modal de défaite
        }
        
        // Fallback : afficher un modal générique
        setTimeout(() => {
          this.showGameInterruptionModal('Adversaire');
        }, 100); // Réduire le délai à 100ms
      }
    }
  }

  // ✅ Masquer l'interface de jeu pour éviter les états confus
  private hideGameInterface(): void {
    console.log('🙈 Hiding game interface due to interruption');
    
    // Masquer le statut de connexion/recherche
    const statusElements = [
      document.getElementById('game-status'),
      document.getElementById('connection-status'),
      document.querySelector('.game-status'),
      document.querySelector('.connection-status'),
      document.querySelector('[data-remote-status]'),
      document.querySelector('.remote-status'),
      // Rechercher aussi par texte
      ...Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('Recherche') || 
        el.textContent?.includes('Connexion') ||
        el.textContent?.includes('adversaire')
      )
    ];
    
    statusElements.forEach(el => {
      if (el && el instanceof HTMLElement) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });

    // Masquer les boutons d'action du jeu
    const actionElements = [
      document.getElementById('cancel-matchmaking'),
      document.getElementById('leave-game'),
      document.querySelector('.cancel-button'),
      document.querySelector('.leave-button'),
      document.querySelector('[data-cancel]'),
      document.querySelector('button[class*="cancel"]'),
      // Rechercher les boutons avec du texte spécifique
      ...Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Annuler') || 
        btn.textContent?.includes('Cancel') ||
        btn.textContent?.includes('Quitter')
      )
    ];
    
    actionElements.forEach(el => {
      if (el && el instanceof HTMLElement) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });

    // Masquer le canvas de jeu s'il est visible
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.display = 'none';
        canvas.style.visibility = 'hidden';
      }
    });

    // Masquer tout le contenu de la page de jeu
    const gameContainers = [
      document.getElementById('game-container'),
      document.getElementById('remote-game'),
      document.querySelector('.game-container'),
      document.querySelector('.remote-game'),
      document.querySelector('[data-game-container]')
    ];

    gameContainers.forEach(container => {
      if (container && container instanceof HTMLElement) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
      }
    });
  }

  // ✅ Nouvelle méthode pour corriger l'interface après interruption
  private checkAndFixInterfaceAfterInterruption(): void {
    console.log('🔍 Checking and fixing interface after game interruption');
    
    // Vérifier si des éléments de matchmaking sont visibles
    const problematicElements = [
      document.getElementById('matchmaking-status'),
      document.getElementById('cancel-matchmaking'),
      document.querySelector('.animate-spin'), // Spinner de recherche
      ...Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('Recherche d\'un adversaire') ||
        el.textContent?.includes('En attente') ||
        el.textContent?.includes('Connexion')
      )
    ];

    let hasProblematicInterface = false;
    problematicElements.forEach(el => {
      if (el && el instanceof HTMLElement && 
          el.style.display !== 'none' && 
          el.style.visibility !== 'hidden' &&
          !el.classList.contains('hidden')) {
        hasProblematicInterface = true;
        console.log('🚨 Found problematic interface element:', el);
      }
    });

    if (hasProblematicInterface) {
      console.log('🔧 Fixing interface - showing forfeit modal instead of matchmaking');
      
      // Masquer l'interface problématique
      this.hideGameInterface();
      
      // Afficher le modal de forfait
      const gameData = sessionStorage.getItem('remote_game_data');
      let opponentName = 'Adversaire';
      
      if (gameData) {
        try {
          const data = JSON.parse(gameData);
          opponentName = data.opponentUsername || 'Adversaire';
        } catch (e) {
          console.warn('Failed to parse game data:', e);
        }
      }
      
      this.showGameInterruptionModal(opponentName);
    }
  }

  public async startRemoteGame(): Promise<void> {
    // ✅ Empêcher le matchmaking si le jeu a été interrompu
    if (this.gameWasInterrupted) {
      console.log('🚫 Preventing matchmaking due to game interruption');
      this.hideGameInterface(); // Masquer à nouveau au cas où
      return;
    }
    
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

  // ✅ Override updateGameStatus pour empêcher l'affichage si interrompu
  protected updateGameStatus(status: string): void {
    if (this.gameWasInterrupted) {
      console.log('🚫 Blocking status update due to interruption:', status);
      return; // Ne pas afficher de statut si le jeu a été interrompu
    }
    
    // Appeler la méthode parent normalement
    super.updateGameStatus(status);
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
    
    // ✅ Empêcher le matchmaking si le jeu a été interrompu
    if (this.gameWasInterrupted) {
      console.log('🚫 Preventing joinMatchmaking due to game interruption');
      this.hideGameInterface(); // Masquer à nouveau au cas où
      return;
    }

    const currentUser = authService.getCurrentUser();
    const username = currentUser?.username || 'Guest';
    const userId = currentUser?.id;

    // ✅ Afficher les paramètres pendant la recherche
    this.showCurrentGameSettings();

    this.signalingWS.send(JSON.stringify({
      type: 'join_matchmaking',
      playerId: this.playerId,
      username: username,
      userId: userId,
      // ✅ Envoyer les paramètres pour le matchmaking (sans le thème)
      gameSettings: {
        ballSpeed: this.settings.ballSpeed,
        winScore: this.settings.winScore,
        powerUps: this.settings.powerUps,
        enableEffects: this.settings.enableEffects
        // Le thème reste personnel à chaque joueur
      }
    }));

    this.updateGameStatus('Recherche d\'un adversaire...');
  }

  private setupPageLeaveDetection(): void {
    // 1. Détecter fermeture/rafraîchissement de la page
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      console.log('🚪 Page is being closed/refreshed');
      
      if (this.gameState.status === 'playing') {
        // ✅ Sauvegarder l'état avant de partir
        this.saveGameStateToSession();
        
        // Notifier immédiatement la déconnexion volontaire
        this.notifyVoluntaryDisconnection('page_refresh');
        
        // Demander confirmation
        event.preventDefault();
        event.returnValue = 'Une partie est en cours. Êtes-vous sûr de vouloir quitter ?';
        return event.returnValue;
      }
    };

    // 2. Détecter navigation vers d'autres pages
    this.navigationHandler = (event: CustomEvent) => {
      const targetRoute = event.detail;
      if (targetRoute !== '/game' && this.gameState.status === 'playing') {
        console.log('🚶 User navigating away from game:', targetRoute);
        
        // ✅ Sauvegarder l'état avant de partir
        this.saveGameStateToSession();
        
        this.notifyVoluntaryDisconnection('page_navigation');
      }
    };

    // 3. Détecter inactivité prolongée (onglet en arrière-plan)
    this.visibilityChangeHandler = () => {
      if (document.hidden && this.gameState.status === 'playing') {
        console.log('👁️ Page became hidden during game');
        
        // ✅ Sauvegarder l'état périodiquement
        this.saveGameStateToSession();
        
        // Timer d'inactivité : 60 secondes
        setTimeout(() => {
          if (document.hidden && this.gameState.status === 'playing') {
            console.log('⏰ User inactive too long, disconnecting');
            this.saveGameStateToSession();
            this.notifyVoluntaryDisconnection('inactivity');
          }
        }, 60000); // 60 secondes
      }
    };

    // Attacher les événements
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    window.addEventListener('beforeNavigate', this.navigationHandler as EventListener);
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private notifyVoluntaryDisconnection(reason: string): void {
    console.log(`📡 Notifying voluntary disconnection: ${reason}`);
    
    // 1. Envoyer via P2P en priorité (plus rapide)
    if (this.dataChannel?.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({
          type: 'voluntary_disconnect',
          playerId: this.playerId,
          reason: reason,
          timestamp: Date.now()
        }));
        console.log('✅ Disconnect notification sent via P2P');
      } catch (error) {
        console.error('❌ Failed to send P2P disconnect:', error);
      }
    }

    // 2. Envoyer via signaling comme backup
    if (this.signalingWS?.readyState === WebSocket.OPEN) {
      try {
        this.signalingWS.send(JSON.stringify({
          type: 'player_quit',
          playerId: this.playerId,
          matchId: this.matchId,
          reason: reason,
          timestamp: Date.now()
        }));
        console.log('✅ Disconnect notification sent via signaling');
      } catch (error) {
        console.error('❌ Failed to send signaling disconnect:', error);
      }
    }
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
        
        // ✅ CRITIQUE: Sauvegarder immédiatement pour le guest après match_found
        if (!this.isHost) {
          console.log('👥 Guest received match_found - saving game state immediately');
          this.gameState.status = 'playing'; // Forcer le statut pour permettre la sauvegarde
          this.saveGameStateToSession();
        }
        
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
        this.handleOpponentDisconnection(message.reason || 'unknown');
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
        // ✅ L'hôte envoie ses paramètres au guest (sauf le thème)
        this.sendGameSettingsToGuest();
        
        this.updateGameStatus('🎮 Démarrage du jeu en tant qu\'hôte...');
        this.startGameAsHost();
      } else {
        // ✅ Message simple et traduit pour le guest
        this.updateGameStatus('👥 Connecté en tant qu\'invité - Réception des paramètres...');
      }
    };

    this.dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleP2PMessage(data);
    };

    // 4. Détecter fermeture inattendue du canal P2P
    this.dataChannel.onclose = () => {
      console.log('❌ P2P connection closed unexpectedly');
      
      if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection) {
        // L'autre joueur a perdu la connexion involontairement
        this.handleOpponentDisconnection('connection_lost');
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('❌ P2P connection error:', error);
      
      if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection) {
        this.handleOpponentDisconnection('connection_error');
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
            winner: this.gameState.winner,
            // ✅ Ajouter les power-ups pour le guest
            powerUps: this.powerUpManager ? this.powerUpManager.getActivePowerUps() : [],
            paddleEffects: this.powerUpManager ? this.powerUpManager.getPaddleEffects() : {}
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
      // ✅ Nouveau cas : réception des paramètres du host
      case 'game_settings':
        console.log('📥 Guest received game settings from host:', data.settings);
        this.applyHostGameSettings(data.settings);
        break;

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
          this.handleOpponentQuit(data.reason);
        }
        break;

      // 5. Gérer les déconnexions volontaires
      case 'voluntary_disconnect':
        console.log(`🚪 Opponent quit voluntarily: ${data.reason}`);
        this.handleOpponentQuit(data.reason);
        break;

      // 6. Gérer la notification de sauvegarde
      case 'match_saved':
        console.log('💾 Opponent saved the match data');
        this.isMatchDataSent = true;
        break;
    }
  }

  private notifyMatchSaved(): void {
    console.log('📡 Notifying opponent that match data was saved');
    
    if (this.dataChannel?.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({
          type: 'match_saved',
          playerId: this.playerId,
          timestamp: Date.now()
        }));
        console.log('✅ Match saved notification sent');
      } catch (error) {
        console.error('❌ Failed to send match saved notification:', error);
      }
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
    
    // ✅ Synchroniser les power-ups pour le guest
    if (this.powerUpManager && state.powerUps) {
      // Mettre à jour les power-ups actifs sur la carte
      this.powerUpManager.syncActivePowerUps(state.powerUps);
      
      // Appliquer les effets des paddles (comme l'agrandissement)
      if (state.paddleEffects) {
        this.powerUpManager.syncPaddleEffects(state.paddleEffects);
        
        // ✅ IMPORTANT: Appliquer immédiatement les effets visuels
        this.applyPhysicsEffects();
        
        console.log('🔋 Guest synced paddle effects:', state.paddleEffects);
      }
      
      console.log('🔋 Guest synced power-ups:', state.powerUps);
    }
    
    // ✅ Sauvegarder l'état mis à jour
    this.saveGameStateToSession();
    
    // Mettre à jour l'affichage des scores et du timer pour le guest
    this.updateUI();
    this.updateTimerDisplay(); // nouvelle methode pour forcer la maj

    // Vérifier la fin de partie
    if (state.status === 'finished') {
      console.log('🏁 Remote game ended for guest');
      // ✅ Nettoyer le sessionStorage à la fin
      sessionStorage.removeItem('remote_game_active');
      sessionStorage.removeItem('remote_game_data');
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

  private handleOpponentQuit(reason: string): void {
    if (this.gameState.status === 'finished' || this.gameEndedByDisconnection) {
      return; // Éviter les doubles traitements
    }

    console.log(`❌ Opponent quit the game (${reason}) - awarding victory`);
    this.gameEndedByDisconnection = true;
    
    // Déterminer le gagnant (celui qui reste)
    this.awardVictoryByForfeit('opponent_quit', reason);
  }

  private handleOpponentDisconnection(reason: string): void {
    if (this.gameState.status === 'finished' || this.gameEndedByDisconnection) {
      return;
    }

    console.log(`❌ Opponent disconnected (${reason}) - awarding victory`);
    this.gameEndedByDisconnection = true;
    
    // ✅ Réinitialiser les paramètres partagés pour éviter la persistance
    this.hasReceivedHostSettings = false;
    
    // Déterminer le gagnant (celui qui reste)
    this.awardVictoryByForfeit('opponent_disconnected', reason);
  }

  private awardVictoryByForfeit(type: 'opponent_quit' | 'opponent_disconnected', reason: string): void {
    const currentUser = authService.getCurrentUser();
    let winner: 'player1' | 'player2';
    let winnerName: string;
    let loserName: string;

    // Le joueur qui reste gagne toujours
    if (this.isHost) {
      winner = 'player1'; // Host = player1
      winnerName = currentUser?.username || 'Host';
      loserName = this.opponentUsername;
    } else {
      winner = 'player2'; // Guest = player2  
      winnerName = currentUser?.username || 'Guest';
      loserName = this.opponentUsername;
    }

    // Mettre à jour l'état du jeu
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    // Score automatique 5-0 par forfait
    if (winner === 'player1') {
      this.gameState.scores.player1 = 5;
      this.gameState.scores.player2 = 0;
    } else {
      this.gameState.scores.player1 = 0;
      this.gameState.scores.player2 = 5;
    }

    const statusMessage = type === 'opponent_quit' 
      ? `${loserName} a quitté la partie`
      : `${loserName} s'est déconnecté`;
      
    this.updateGameStatus(`Victoire par forfait ! ${statusMessage}`);
    
    // Sauvegarder et afficher le résultat
    this.processForfeitVictory(winner, winnerName, loserName, reason);
  }

  private async processForfeitVictory(winner: 'player1' | 'player2', winnerName: string, loserName: string, reason: string): Promise<void> {
    console.log(`🏆 Processing forfeit victory: ${winnerName} wins (${reason})`);
    
    // Pour les forfaits, le gagnant (celui qui reste) sauvegarde toujours
    if (this.opponentUserId && !this.isMatchDataSent) {
      try {
        await this.saveRemoteMatchDataByWinner(winner);
        console.log('✅ Forfeit match data saved by winner');
        
        // Notifier l'autre joueur (si encore connecté) que la sauvegarde est faite
        this.notifyMatchSaved();
      } catch (error) {
        console.error('❌ Failed to save forfeit match data:', error);
      }
    }

    // Afficher le modal de victoire
    setTimeout(() => {
      this.showForfeitVictoryModal(winnerName, loserName, reason);
    }, 1000);

    // Nettoyer les connexions
    setTimeout(() => {
      this.cleanupConnections();
    }, 3000);
  }

  private showDisconnectionVictoryModal(winnerName: string, loserName: string): void {
    // Masquer le timer et autres éléments de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay) {
      gameOverlay.style.display = 'none';
    }

    // Créer les statistiques pour le modal de forfait
    const stats: GameEndStats = {
      winnerName,
      loserName,
      winnerScore: 5,
      loserScore: 0,
      matchDuration: Math.floor(this.gameState.timer),
      totalScore: 5,
      gameMode: 'remote',
      winScore: this.settings.winScore
    };

    // Callbacks pour remote : seulement "Retour au menu"
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined, // Pas de "Nouvelle partie" en remote
      onBackToMenu: () => {
        console.log('🏠 Going back to menu from forfeit...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () => {
        console.log('📊 Showing forfeit statistics...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Créer et afficher le modal
    const gameEndModal = new GameEndModal(stats, callbacks);
    gameEndModal.show();
  }

  // ✅ Modal spécifique pour les interruptions de jeu
  private showGameInterruptionModal(opponentName: string): void {
    // ✅ Effacer le statut de recherche
    this.updateGameStatus('');
    
    const currentUser = authService.getCurrentUser();
    const playerName = currentUser?.username || 'Joueur';
    
    const stats: GameEndStats = {
      winnerName: opponentName,
      loserName: playerName,
      winnerScore: 5,
      loserScore: 0,
      matchDuration: 0 // Pas de durée connue
    };

    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined, // Pas de nouvelle partie
      onBackToMenu: () => {
        console.log('🏠 Going back to menu after game interruption...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () => {
        console.log('📊 Showing stats after game interruption...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Personnaliser le titre et le message
    const gameEndModal = new GameEndModal(stats, callbacks);
    
    // ✅ Modifier le contenu pour indiquer une défaite par forfait
    const originalShow = gameEndModal.show.bind(gameEndModal);
    gameEndModal.show = () => {
      originalShow();
      
      // Modifier le titre après affichage
      setTimeout(() => {
        const titleElement = document.querySelector('.game-end-modal h2');
        if (titleElement) {
          titleElement.textContent = 'Défaite par forfait';
          titleElement.className = 'text-2xl font-bold text-red-400 mb-4';
        }
        
        const messageElement = document.querySelector('.game-end-modal .result-message');
        if (messageElement) {
          messageElement.innerHTML = `
            <div class="text-center mb-4">
              <div class="text-6xl mb-4">😔</div>
              <p class="text-lg text-gray-300">Vous avez quitté la partie</p>
              <p class="text-sm text-gray-400 mt-2">${opponentName} remporte la victoire par forfait</p>
            </div>
          `;
        }
      }, 50);
    };
    
    gameEndModal.show();
  }

  private showForfeitVictoryModal(winnerName: string, loserName: string, reason: string): void {
    // Masquer le timer et autres éléments de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay) {
      gameOverlay.style.display = 'none';
    }

    // Créer les statistiques pour le modal de forfait
    const stats: GameEndStats = {
      winnerName,
      loserName,
      winnerScore: 5,
      loserScore: 0,
      matchDuration: Math.floor(this.gameState.timer),
      totalScore: 5,
      gameMode: 'remote',
      winScore: this.settings.winScore
    };

    // Callbacks pour remote : seulement "Retour au menu"
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined, // Pas de "Nouvelle partie" en remote
      onBackToMenu: () => {
        console.log('🏠 Going back to menu from forfeit...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () => {
        console.log('📊 Showing forfeit statistics...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Créer et afficher le modal
    const gameEndModal = new GameEndModal(stats, callbacks);
    gameEndModal.show();
  }

  // ✅ Sauvegarder l'état du jeu dans sessionStorage
  private saveGameStateToSession(): void {
    console.log('💾 saveGameStateToSession called with status:', this.gameState.status, 'isHost:', this.isHost);
    
    if (this.gameState.status === 'playing') {
      sessionStorage.setItem('remote_game_active', 'true');
      sessionStorage.setItem('remote_game_data', JSON.stringify({
        opponentUsername: this.opponentUsername,
        opponentUserId: this.opponentUserId,
        isHost: this.isHost,
        matchId: this.matchId,
        scores: this.gameState.scores,
        timer: this.gameState.timer
      }));
      console.log('✅ SessionStorage saved successfully for', this.isHost ? 'host' : 'guest');
      
      // ✅ VERIFICATION IMMEDIE - test si ça persiste
      const verification = sessionStorage.getItem('remote_game_active');
      console.log('🔍 IMMEDIATE VERIFICATION - remote_game_active after save:', verification);
    } else {
      console.log('❌ NOT saving to sessionStorage - game status is:', this.gameState.status);
    }
  }

  private async saveRemoteMatchData(): Promise<void> {
    if (!this.opponentUserId) {
      console.error('❌ Cannot save remote match: opponent user ID missing');
      return;
    }

    // Utiliser le timer du jeu si disponible, sinon calculer la différence
    let duration: number;
    if (this.gameState.timer > 0) {
      // Le timer du jeu contient le temps écoulé en secondes
      duration = Math.floor(this.gameState.timer);
    } else {
      // Fallback sur le calcul de timestamps
      duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    }
    
    console.log('💾 Attempting to save remote match data:', {
      opponentUserId: this.opponentUserId,
      scores: this.gameState.scores,
      duration: duration,
      gameTimer: this.gameState.timer,
      calculatedFromTime: duration === Math.floor(this.gameState.timer)
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

  private async saveRemoteMatchDataByWinner(winner: 'player1' | 'player2'): Promise<void> {
    if (!this.opponentUserId) {
      console.error('❌ Cannot save remote match: opponent user ID missing');
      return;
    }

    // Utiliser le timer du jeu si disponible, sinon calculer la différence
    let duration: number;
    if (this.gameState.timer > 0) {
      // Le timer du jeu contient le temps écoulé en secondes
      duration = Math.floor(this.gameState.timer);
    } else {
      // Fallback sur le calcul de timestamps
      duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    }

    let myScore: number;
    let opponentScore: number;

    // Déterminer les scores selon qui je suis et qui a gagné
    if (this.isHost) {
      // Je suis l'hôte (player1)
      myScore = this.gameState.scores.player1;
      opponentScore = this.gameState.scores.player2;
    } else {
      // Je suis le guest (player2) - inverser les scores pour l'API
      // L'API attend toujours les scores du point de vue de l'utilisateur actuel
      myScore = this.gameState.scores.player2;
      opponentScore = this.gameState.scores.player1;
    }
    
    console.log('💾 Attempting to save forfeit match data:', {
      opponentUserId: this.opponentUserId,
      myScore: myScore,
      opponentScore: opponentScore,
      duration: duration,
      isHost: this.isHost,
      winner: winner,
      gameTimer: this.gameState.timer,
      calculatedFromTime: duration === Math.floor(this.gameState.timer)
    });
    
    try {
      await matchService.sendRemoteMatchData(
        this.opponentUserId,
        myScore,
        opponentScore,
        duration
      );
      
      this.isMatchDataSent = true;
      console.log('✅ Forfeit match data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save forfeit match data:', error);
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
    
    // ✅ Nettoyer le sessionStorage
    sessionStorage.removeItem('remote_game_active');
    sessionStorage.removeItem('remote_game_data');
    
    // ✅ Réinitialiser les flags de paramètres partagés
    this.hasReceivedHostSettings = false;
    
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
    
    // ✅ IMPORTANT: Initialiser matchStartTime pour le guest aussi
    this.matchStartTime = Date.now();
    this.isMatchDataSent = false;
    
    // Pour l'invité : seulement initialiser les contrôles et attendre
    // Ne pas appeler startLocalGame() qui lancerait la physique
    this.updateGameStatus('En attente du host...');
    
    // L'invité doit quand même avoir ses contrôles bindés
    // (normalement fait dans le constructor de Pong3D)
    if (!this.controls) {
      console.warn('⚠️ Controls not initialized for guest');
    }
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
            this.handleOpponentDisconnection('signaling_disconnect');
          }
        }, 5000); // Délai de grâce de 5 secondes
      }
    }
  }

  // Override endGame pour les jeux remote
  protected endGame(winner: 'player1' | 'player2'): void {
    console.log('🏁 Remote game ending via endGame override');
    
    // ✅ Nettoyer le sessionStorage
    sessionStorage.removeItem('remote_game_active');
    sessionStorage.removeItem('remote_game_data');
    
    // Mettre à jour le statut
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    
    // Appeler onGameEnd si défini (pour les callbacks)
    if (this.onGameEnd) {
      const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
      this.onGameEnd(winnerName, this.gameState.scores, duration);
    }
    
    // Pour les jeux remote, gérer la fin avec notre méthode custom
    this.handleRemoteGameEnd();
  }

  private async handleRemoteGameEnd(): Promise<void> {
    console.log('🏁 Remote game ended');
    
    // Pour les fins de jeu normales, c'est l'hôte qui sauvegarde en priorité
    if (this.opponentUserId && !this.isMatchDataSent) {
      try {
        if (this.isHost) {
          // L'hôte utilise la méthode standard et notifie ensuite
          await this.saveRemoteMatchData();
          this.notifyMatchSaved();
        } else {
          // Le guest attend un peu pour voir si l'hôte sauvegarde
          setTimeout(async () => {
            if (!this.isMatchDataSent && this.opponentUserId) {
              console.log('🔄 Host did not save, guest taking over...');
              await this.saveRemoteMatchDataByWinner(this.gameState.winner!);
            }
          }, 2000); // Attendre 2 secondes
        }
      } catch (error) {
        console.error('❌ Failed to save remote match data:', error);
      }
    }
    
    // Déclencher le modal de fin pour les deux joueurs
    if (this.gameState.winner) {
      const winner = this.gameState.winner;
      const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
      const loserName = winner === 'player1' ? this.settings.player2Name : this.settings.player1Name;
      
      console.log(`🎭 Showing game end modal for ${this.isHost ? 'HOST' : 'GUEST'}: ${winnerName} wins`);
      
      // Déclencher le modal de fin comme dans le parent
      setTimeout(() => {
        this.showGameEndModal(winner, winnerName, loserName);
      }, 500); // Petit délai pour laisser l'UI se mettre à jour
    } else {
      console.warn('⚠️ No winner defined for game end modal');
    }
    
    setTimeout(() => {
      this.cleanupConnections();
    }, 3000);
  }

  // Override showGameEndModal pour personnaliser les boutons en mode remote
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
      gameMode: 'remote',
      winScore: this.settings.winScore
    };

    // ✅ Callbacks personnalisés pour remote : seulement "Retour au menu"
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined, // Pas de "Nouvelle partie" en remote
      onBackToMenu: () => {
        console.log('🏠 Going back to menu from remote game...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () => {
        console.log('📊 Showing match statistics from remote game...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Créer et afficher le modal
    const gameEndModal = new GameEndModal(stats, callbacks);
    gameEndModal.show();
  }

  // ✅ Nouvelle méthode pour envoyer les paramètres (sans le thème)
  private sendGameSettingsToGuest(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
    
    const gameSettings = {
      type: 'game_settings',
      settings: {
        ballSpeed: this.settings.ballSpeed,
        winScore: this.settings.winScore,
        powerUps: this.settings.powerUps,
        enableEffects: this.settings.enableEffects
        // ✅ Pas de thème - chaque joueur garde le sien
      }
    };
    
    console.log('📤 Host sending game settings to guest:', gameSettings.settings);
    this.dataChannel.send(JSON.stringify(gameSettings));
  }

  // ✅ Nouvelle méthode pour appliquer les paramètres de l'hôte (sauf thème)
  private applyHostGameSettings(hostSettings: any): void {
  console.log('🔧 Applying host settings:', hostSettings);
  
  const preservedTheme = this.settings.theme;
  
  // Mettre à jour les paramètres
  this.settings.ballSpeed = hostSettings.ballSpeed;
  this.settings.winScore = hostSettings.winScore;
  this.settings.powerUps = hostSettings.powerUps;
  this.settings.enableEffects = hostSettings.enableEffects;
  this.settings.theme = preservedTheme;
  
  this.reinitializeWithNewSettings();
  
  // ✅ Mettre à jour le message principal sans écraser
  this.updateConnectionStatus('👥 Connecté en tant qu\'invité - Paramètres reçus !');
  
  // ✅ Ajouter les paramètres en dessous
  setTimeout(() => {
    this.addSettingsToStatus(hostSettings, preservedTheme);
  }, 500);
  
  // Le guest peut maintenant démarrer
  setTimeout(() => {
    this.startLocalGameAsGuest();
  }, 3000);
}

  // ✅ Nouvelle méthode pour afficher dans le status
private showSettingsInStatus(hostSettings: any, preservedTheme: string): void {
  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    // ✅ AJOUTER les paramètres au lieu de remplacer complètement
    statusEl.innerHTML = `
      <div class="text-center space-y-4">
        <!-- ✅ Garder le message de connexion en haut -->
        <div class="text-lg text-blue-400">
          👥 Connecté en tant qu'invité - Paramètres reçus !
        </div>
        
        <!-- ✅ Afficher les paramètres en dessous -->
        <div class="p-3 bg-gray-800/60 rounded-lg border border-green-500/20">
          <div class="text-sm text-green-400 font-medium mb-2">
            ✅ Paramètres synchronisés avec l'hôte :
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="bg-gray-700/40 p-2 rounded">
              <span class="text-gray-300">⚡ Vitesse :</span>
              <span class="text-white font-bold ml-1">${this.getSpeedDisplayName(hostSettings.ballSpeed)}</span>
            </div>
            
            <div class="bg-gray-700/40 p-2 rounded">
              <span class="text-gray-300">🏆 Score :</span>
              <span class="text-white font-bold ml-1">${hostSettings.winScore}</span>
            </div>
            
            <div class="bg-gray-700/40 p-2 rounded">
              <span class="text-gray-300">🔋 Power-ups :</span>
              <span class="text-white font-bold ml-1">${hostSettings.powerUps ? '✅' : '❌'}</span>
            </div>
            
            <div class="bg-purple-700/40 p-2 rounded border border-purple-500/20">
              <span class="text-purple-300">🎨 Votre thème :</span>
              <span class="text-purple-200 font-bold text-xs ml-1">${this.getThemeDisplayName(preservedTheme)}</span>
            </div>
          </div>
          
          <div class="text-green-300 text-sm font-medium mt-3">
            🎮 Démarrage dans 3 secondes...
          </div>
        </div>
      </div>
    `;
  }
}

// ✅ Méthode pour ajouter les paramètres sans écraser le message principal
private addSettingsToStatus(hostSettings: any, preservedTheme: string): void {
  const statusEl = document.getElementById('game-status');
  const settingsContainer = statusEl?.querySelector('.settings-info');
  
  if (settingsContainer) {
    settingsContainer.innerHTML = `
      <div class="p-3 bg-gray-800/60 rounded-lg border border-green-500/20 mt-3">
        <div class="text-sm text-green-400 font-medium mb-2">
          ✅ Paramètres reçus de l'hôte :
        </div>
        
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-gray-700/40 p-2 rounded">
            <span class="text-gray-300">⚡</span>
            <span class="text-white font-bold ml-1">${this.getSpeedDisplayName(hostSettings.ballSpeed)}</span>
          </div>
          
          <div class="bg-gray-700/40 p-2 rounded">
            <span class="text-gray-300">🏆</span>
            <span class="text-white font-bold ml-1">${hostSettings.winScore}</span>
          </div>
          
          <div class="bg-gray-700/40 p-2 rounded">
            <span class="text-gray-300">🔋</span>
            <span class="text-white font-bold ml-1">${hostSettings.powerUps ? '✅' : '❌'}</span>
          </div>
          
          <div class="bg-purple-700/40 p-2 rounded">
            <span class="text-purple-300">🎨</span>
            <span class="text-purple-200 font-bold text-xs ml-1">${this.getThemeDisplayName(preservedTheme)}</span>
          </div>
        </div>
        
        <div class="text-green-300 text-sm font-medium mt-2">
          🎮 Démarrage dans 3s...
        </div>
      </div>
    `;
    
    // Afficher le conteneur des paramètres
    (settingsContainer as HTMLElement).style.display = 'block';
  }
}

// ✅ Alternative : Méthode pour mettre à jour SEULEMENT le message principal
private updateConnectionStatus(message: string): void {
  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    // Chercher le message principal et le mettre à jour seulement
    const mainMessage = statusEl.querySelector('.main-status-message');
    if (mainMessage) {
      mainMessage.textContent = message;
    } else {
      // Si pas de structure existante, créer une structure claire
      statusEl.innerHTML = `
        <div class="text-center space-y-3">
          <div class="main-status-message text-lg text-blue-400">${message}</div>
          <div class="settings-info" style="display: none;"></div>
        </div>
      `;
    }
  }
}

// ✅ Méthodes pour les noms d'affichage traduits
private getSpeedDisplayName(speed: string): string {
  const speedMap: Record<string, string> = {
    slow: 'Lent',
    medium: 'Moyen', 
    fast: 'Rapide'
  };
  return speedMap[speed] || speed;
}

private getThemeDisplayName(theme: string): string {
  const themeMap: Record<string, string> = {
    classic: 'Classique',
    neon: 'Néon',
    retro: 'Rétro',
    cyberpunk: 'Cyberpunk',
    space: 'Espace',
    italian: 'Italien',
    matrix: 'Matrix',
    lava: 'Lave'
  };
  return themeMap[theme] || theme;
}

  // ✅ Réinitialiser les composants critiques avec les nouveaux paramètres
  private reinitializeWithNewSettings(): void {
    console.log('🔄 Reinitializing game components with host settings (keeping theme)');
    
    // 1. Le thème reste inchangé (thème personnel du guest)
    console.log('🎨 Theme unchanged:', this.settings.theme);
    
    // 2. Réinitialiser la physique avec la nouvelle vitesse de balle
    if (this.physics) {
      this.physics.updateSettings(this.settings);
      console.log('⚡ Physics updated with new ball speed:', this.settings.ballSpeed);
    }
    
    // 3. Réinitialiser les power-ups
    if (this.powerUpManager) {
      this.powerUpManager.setEnabled(this.settings.powerUps);
      if (this.settings.powerUps) {
        console.log('🔋 Power-ups enabled for guest');
      } else {
        console.log('❌ Power-ups disabled for guest');
        this.powerUpManager.clearAll();
      }
    }
    
    // 4. Mettre à jour l'interface avec le score gagnant
    this.updateWinScoreDisplay();
    
    console.log('✅ Game components reinitialized successfully');
  }

  // ✅ Mettre à jour l'affichage du score gagnant
  private updateWinScoreDisplay(): void {
    // Mettre à jour dans l'interface si les éléments existent
    const winScoreElements = document.querySelectorAll('[data-win-score]');
    winScoreElements.forEach(el => {
      el.textContent = `${this.settings.winScore} points`;
    });
    
    console.log('🏆 Win score display updated to:', this.settings.winScore);
  }

  // ✅ Améliorer showCurrentGameSettings aussi
private showCurrentGameSettings(): void {
  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    // Simple message texte, pas de HTML complexe
    statusEl.innerHTML = `
      <div class="text-center space-y-3">
        <div class="text-lg text-blue-400">🔍 Recherche d'un adversaire...</div>
        
        <div class="text-sm text-gray-300">
          <div class="font-medium text-blue-200 mb-2">Vos paramètres (en tant qu'hôte) :</div>
          <div>⚡ ${this.getSpeedDisplayName(this.settings.ballSpeed)}</div>
          <div>🏆 ${this.settings.winScore} points</div>
          <div>🔋 ${this.settings.powerUps ? 'Power-ups activés' : 'Power-ups désactivés'}</div>
          <div>🎨 ${this.getThemeDisplayName(this.settings.theme)}</div>
        </div>
        
        <div class="text-xs text-gray-400 italic">
          L'adversaire recevra ces paramètres automatiquement
        </div>
      </div>
    `;
  }
}

  // ✅ Obtenir le nom convivial de la vitesse
  private getSpeedName(speed: string): string {
    const speeds: Record<string, string> = { 
      slow: 'Lent', 
      medium: 'Moyen', 
      fast: 'Rapide' 
    };
    return speeds[speed] || speed;
  }

  // ✅ Obtenir le nom convivial du thème
  private getThemeName(theme: string): string {
    const themes: Record<string, string> = {
      classic: 'Classique',
      neon: 'Néon',
      retro: 'Rétro',
      cyberpunk: 'Cyberpunk',
      space: 'Espace',
      italian: 'Italien',
      matrix: 'Matrix',
      lava: 'Lave'
    };
    return themes[theme] || theme;
  }
}
