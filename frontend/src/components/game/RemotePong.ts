import { Pong3D } from './Pong3D/Pong3D.js';
import { i18n } from '@/services/i18nService.js';
import { authService } from '../../services/authService.js';
import { matchService } from '../../services/matchService.js';
import { ApiConfig } from '../../config/api.js';
import { GameEndModal, convertToModalStats } from '../game/GameEndModal.js';
import type { GameSettings, GameEndStats, GameEndCallbacks } from '@/types/index.js';
import { Logger } from '@/utils/logger.js'; 

/**
 * Classe RemotePong - Gestion des parties en ligne via WebRTC
 * 
 * Cette classe étend Pong3D pour ajouter les fonctionnalités de jeu en réseau :
 * - Connexion WebSocket pour le matchmaking
 * - Connexion WebRTC P2P pour le jeu en temps réel
 * - Gestion des rôles hôte/invité
 * - Synchronisation des états de jeu
 * - Gestion des déconnexions et interruptions
 */
export class RemotePong extends Pong3D
{
  // =================================
  // PROPRIÉTÉS
  // =================================
  
  // Connexions réseau
  private signalingWS: WebSocket | null = null; // WebSocket pour le serveur de matchmaking
  private peerConnection: RTCPeerConnection | null = null; // Connexion WebRTC P2P
  private dataChannel: RTCDataChannel | null = null; // Canal de données pour les messages de jeu
  
  // État du joueur
  private isHost: boolean = false; // true si ce joueur est l'hôte du match
  private playerId: string = ''; // ID unique du joueur pour cette session
  private matchId: string = ''; // ID du match en cours
  private opponentId: string = ''; // ID de l'adversaire
  private opponentUsername: string = ''; // Nom d'utilisateur de l'adversaire
  private opponentUserId: number | null = null; // ID utilisateur de l'adversaire (pour la DB)
  
  // Gestion des inputs
  private guestInputs = { up: false, down: false }; // Stockage des inputs du joueur invité
  
  // Flags de contrôle
  private gameEndedByDisconnection = false; // Évite les doubles traitements de déconnexion
  private gameWasInterrupted = false; // Indique si le jeu a été interrompu (refresh/page)
  
  // Gestion des événements de navigation
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private navigationHandler: ((event: CustomEvent) => void) | null = null;

  // =================================
  // CONSTRUCTEUR ET INITIALISATION
  // =================================

  /**
   * Constructeur de RemotePong
   * @param canvasId ID du canvas HTML pour le rendu 3D
   * @param settings Paramètres de jeu (vitesse, score, thème, etc.)
   */
  constructor(canvasId: string, settings: GameSettings)
  {
    // Appel du constructeur parent avec isRemote=true et mode='remote'
    super(canvasId, settings, true, 'remote');
    
    // Génération d'un ID unique pour cette session de jeu
    this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Vérification si on revient d'une interruption de jeu (refresh de page)
    this.checkForGameInterruption();
    
    // Si le jeu a été interrompu, arrêter l'initialisation normale
    if (this.gameWasInterrupted)
    {
      Logger.log('🚫 Game was interrupted, skipping normal initialization');
      return;
    }
    
    // Configuration de la détection de fermeture de page
    this.setupPageLeaveDetection();
    
    Logger.log('🎮 RemotePong created, gameWasInterrupted:', this.gameWasInterrupted);
  }

  // =================================
  // MÉTHODES PRIVÉES D'INTERRUPTION
  // =================================

  /**
   * Vérifie si le joueur revient d'une interruption de jeu
   * (refresh de page, fermeture accidentelle, etc.)
   * 
   * Utilise sessionStorage pour persister l'état du jeu entre les sessions
   */
  private checkForGameInterruption(): void
  {
    const wasInGame = sessionStorage.getItem('remote_game_active');
    const gameData = sessionStorage.getItem('remote_game_data');
    
    if (wasInGame === 'true' && gameData)
    {
      Logger.log('🔄 Detected page refresh during remote game');
      this.gameWasInterrupted = true;
      
      // Masquer immédiatement l'interface de jeu
      this.hideGameInterface();
      
      try
      {
        const data = JSON.parse(gameData);
        Logger.log('📊 Previous game data:', data);
        
        // Vérifier si on est sur la page /game
        const currentPath = window.location.pathname;
        if (currentPath === '/game')
        {
          Logger.log('🏠 On game page - GamePage.ts will handle the forfeit modal');
          return;
        }
        
        // Afficher le modal de défaite par forfait après un court délai
        setTimeout(() =>
        {
          this.showGameInterruptionModal(data.opponentUsername || 'Adversaire');
        }, 100);
        
      } catch (error)
      {
        Logger.error('❌ Failed to parse game data:', error);
        setTimeout(() =>
        {
          this.showGameInterruptionModal('Adversaire');
        }, 100);
      }
    }
  }

  /**
   * Masque tous les éléments d'interface de jeu lors d'une interruption
   * Évite l'affichage d'éléments visuels indésirables
   */
  private hideGameInterface(): void
  {
    Logger.log('🙈 Hiding game interface due to interruption');
    
    // Liste des éléments à masquer
    const elementsToHide = [
      'game-status', 'connection-status', 'game-overlay',
      'cancel-matchmaking', 'leave-game'
    ];
    
    elementsToHide.forEach(id =>
    {
      const element = document.getElementById(id);
      if (element)
      {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
      }
    });
    
    // Masquer également tous les canvas (éléments de rendu 3D)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas =>
    {
      if (canvas instanceof HTMLCanvasElement)
      {
        canvas.style.display = 'none';
        canvas.style.visibility = 'hidden';
      }
    });
  }

  // =================================
  // MÉTHODES PRIVÉES DE CONNEXION
  // =================================

  /**
   * Point d'entrée principal pour démarrer une partie en ligne
   * Orchestre la séquence complète : connexion → matchmaking → jeu
   */
  public async startRemoteGame(): Promise<void>
  {
    // Bloquer le matchmaking si le jeu a été interrompu
    if (this.gameWasInterrupted)
    {
      Logger.log('🚫 Preventing matchmaking due to game interruption');
      return;
    }
    
    Logger.log('🌐 Starting remote game...');
    this.updateGameStatus(i18n.t('game.status.connecting_server'));
    
    try
    {
      // Étape 1: Connexion au serveur WebSocket
      await this.connectToSignalingServer();
      
      // Étape 2: Rejoindre la file d'attente
      this.joinMatchmaking();
      
    } catch (error)
    {
      Logger.error('❌ Failed to start remote game:', error);
      this.updateGameStatus(i18n.t('game.status.connection_error'));
    }
  }

  /**
   * Établit la connexion WebSocket avec le serveur de matchmaking
   * @returns Promise résolue quand la connexion est établie
   */
  private async connectToSignalingServer(): Promise<void>
  {
    return new Promise((resolve, reject) =>
    {
      const wsUrl = ApiConfig.WS_URL;
      Logger.log('🔗 Connecting to WebSocket:', wsUrl);
      ApiConfig.logUrls();
        
      // Création de la connexion WebSocket
      this.signalingWS = new WebSocket(wsUrl);
      
      // Gestionnaire de connexion établie
      this.signalingWS.onopen = () =>
      {
        Logger.log('✅ Connected to signaling server');
        resolve();
      };

      // Gestionnaire de messages du serveur
      this.signalingWS.onmessage = (event) =>
      {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      // Gestionnaire de déconnexion du serveur
      this.signalingWS.onclose = () =>
      {
        Logger.log('❌ Signaling server disconnected');
        this.handleSignalingDisconnect();
      };

      // Gestionnaire d'erreur de connexion
      this.signalingWS.onerror = (error) =>
      {
        Logger.error('❌ Signaling server error:', error);
        reject(error);
      };

      // Timeout de connexion (10 secondes)
      setTimeout(() =>
      {
        if (this.signalingWS?.readyState !== WebSocket.OPEN)
        {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Rejoint la file d'attente de matchmaking
   * Envoie les informations du joueur et ses paramètres de jeu
   */
  private joinMatchmaking(): void
  {
    if (!this.signalingWS || this.gameWasInterrupted) return;

    // Récupération des informations utilisateur
    const currentUser = authService.getCurrentUser();
    const username = currentUser?.username || 'Guest';
    const userId = currentUser?.id;

    // Affichage des paramètres actuels pendant la recherche
    this.showCurrentGameSettings();

    // Envoi du message de matchmaking au serveur
    this.signalingWS.send(JSON.stringify({
      type: 'join_matchmaking',
      playerId: this.playerId,
      username: username,
      userId: userId,
      gameSettings: {
        ballSpeed: this.settings.ballSpeed,
        winScore: this.settings.winScore,
        powerUps: this.settings.powerUps,
        enableEffects: this.settings.enableEffects
      }
    }));

    this.updateGameStatus(i18n.t('game.status.searching_opponent'));
  }

  /**
   * Affiche les paramètres de jeu actuels pendant la phase de matchmaking
   * Montre à l'utilisateur ce qui sera appliqué en tant qu'hôte
   */
  private showCurrentGameSettings(): void
  {
    const statusEl = document.getElementById('game-status');
    if (statusEl)
    {
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

  // =================================
  // MÉTHODES PRIVÉES DE SIGNALING
  // =================================

  /**
   * Traite tous les messages reçus du serveur de matchmaking
   * @param message Objet message du serveur
   */
  private async handleSignalingMessage(message: any): Promise<void>
  {
    Logger.log('📨 Signaling message:', message.type);

    // Routage des messages selon leur type
    switch (message.type)
    {
      case 'waiting_opponent':
        this.updateGameStatus(i18n.t('game.status.waiting_opponent'));
        break;

      case 'match_found':
        // Match trouvé : établir la connexion WebRTC
        await this.handleMatchFound(message);
        break;

      case 'webrtc_offer':
        // Offre WebRTC reçue : traiter pour établir P2P
        await this.handleWebRTCOffer(message);
        break;

      case 'webrtc_answer':
        // Réponse WebRTC reçue : finaliser la connexion
        await this.handleWebRTCAnswer(message);
        break;

      case 'webrtc_ice_candidate':
        // Candidat ICE reçu : ajouter à la connexion P2P
        await this.handleICECandidate(message);
        break;

      case 'opponent_disconnected':
        // Adversaire déconnecté : gérer la fin de partie
        Logger.log(`❌ Opponent disconnected: ${message.disconnectedPlayer} (${message.reason})`);
        this.updateGameStatus(i18n.t('game.status.opponent_disconnected', { player: message.disconnectedPlayer }));
        this.handleOpponentDisconnection(message.reason || 'unknown');
        break;
    }
  }

  /**
   * Traite la notification de match trouvé
   * Stocke les informations de l'adversaire et initie WebRTC
   * @param message Données du match trouvé
   */
  private async handleMatchFound(message: any): Promise<void>
  {
    // Stockage des informations du match et de l'adversaire
    this.matchId = message.matchId;
    this.isHost = message.role === 'host';
    this.opponentId = message.opponent.id;
    this.opponentUsername = message.opponent.username;
    this.opponentUserId = message.opponent.userId;
    
    Logger.log('🎯 Match found details:', {
      role: message.role,
      opponentUsername: this.opponentUsername,
      opponentUserId: this.opponentUserId
    });
    
    // Sauvegarde immédiate en sessionStorage pour le joueur invité
    if (!this.isHost)
    {
      this.gameState.status = 'playing';
      this.saveGameStateToSession();
    }

    this.updateGameStatus(i18n.t('game.status.opponent_found', { opponent: this.opponentUsername }));

    // Établir la connexion WebRTC P2P
    await this.setupWebRTCConnection();
  }

  /**
   * Gère la déconnexion du serveur de signaling
   * Peut déclencher une attribution de victoire si le jeu est en cours
   */
  private handleSignalingDisconnect(): void
  {
    Logger.log('📡 Signaling server disconnected');
    
    if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection)
    {
      this.updateGameStatus(i18n.t('game.status.signaling_disconnected'));

      // Délai avant d'attribuer la victoire (permet la reconnexion)
      if (!this.dataChannel || this.dataChannel.readyState !== 'open')
      {
        setTimeout(() =>
        {
          if (!this.gameEndedByDisconnection)
          {
            this.handleOpponentDisconnection('signaling_disconnect');
          }
        }, 5000);
      }
    }
  }

  // =================================
  // MÉTHODES PRIVÉES WEBRTC
  // =================================

  /**
   * Configure la connexion WebRTC peer-to-peer
   * L'hôte crée le dataChannel, l'invité l'attend
   */
  private async setupWebRTCConnection(): Promise<void>
  {
    // Configuration des serveurs STUN pour NAT traversal
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Gestionnaire de candidats ICE (pour traverser les NAT/firewalls)
    this.peerConnection.onicecandidate = (event) =>
    {
      if (event.candidate && this.signalingWS)
      {
        // Envoi du candidat ICE via le serveur de signaling
        this.signalingWS.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          candidate: event.candidate
        }));
      }
    };

    if (this.isHost)
    {
      // L'hôte crée le canal de données pour le jeu
      this.dataChannel = this.peerConnection.createDataChannel('gameData', {
        ordered: false, // Pas besoin d'ordre pour les inputs de jeu
        maxRetransmits: 0 // Pas de retransmission pour la performance
      });
      
      // Configuration des gestionnaires du canal de données
      this.setupDataChannelHandlers();

      // Création et envoi de l'offre WebRTC
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Envoi de l'offre via le serveur de signaling
      this.signalingWS?.send(JSON.stringify({
        type: 'webrtc_offer',
        offer: offer
      }));
      
    } else
    {
      // L'invité attend que l'hôte crée le canal de données
      this.peerConnection.ondatachannel = (event) =>
      {
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers();
      };
    }
  }

  /**
   * Configure les gestionnaires d'événements pour le canal de données WebRTC
   * Gère l'ouverture, les messages et les erreurs du canal P2P
   */
  private setupDataChannelHandlers(): void
  {
    if (!this.dataChannel) return;

    // Gestionnaire d'ouverture du canal
    this.dataChannel.onopen = () =>
    {
      Logger.log('🔗 WebRTC P2P connection established');
      
      if (this.isHost)
      {
        // L'hôte envoie immédiatement ses paramètres de jeu
        this.sendGameSettingsToGuest();
        this.updateGameStatus(i18n.t('game.status.starting_as_host'));
        this.startGameAsHost();
      } else
      {
        // L'invité attend les paramètres de l'hôte
        this.updateGameStatus(i18n.t('game.status.starting_as_guest'));
      }
    };

    // Gestionnaire de messages P2P
    this.dataChannel.onmessage = (event) =>
    {
      const data = JSON.parse(event.data);
      this.handleP2PMessage(data);
    };

    // Gestionnaire de fermeture inattendue
    this.dataChannel.onclose = () =>
    {
      Logger.log('❌ P2P connection closed unexpectedly');
      if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection)
      {
        this.handleOpponentDisconnection('connection_lost');
      }
    };

    // Gestionnaire d'erreur de connexion
    this.dataChannel.onerror = (error) =>
    {
      Logger.error('❌ P2P connection error:', error);
      if (this.gameState.status === 'playing' && !this.gameEndedByDisconnection)
      {
        this.handleOpponentDisconnection('connection_error');
      }
    };
  }

  /**
   * Traite une offre WebRTC reçue (côté invité)
   * @param message Message contenant l'offre WebRTC
   */
  private async handleWebRTCOffer(message: any): Promise<void>
  {
    if (!this.peerConnection) return;

    // Application de l'offre distante
    await this.peerConnection.setRemoteDescription(message.offer);
    
    // Création de la réponse
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Envoi de la réponse via le serveur de signaling
    this.signalingWS?.send(JSON.stringify({
      type: 'webrtc_answer',
      answer: answer
    }));
  }

  /**
   * Traite une réponse WebRTC reçue (côté hôte)
   * @param message Message contenant la réponse WebRTC
   */
  private async handleWebRTCAnswer(message: any): Promise<void>
  {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(message.answer);
  }

  /**
   * Traite un candidat ICE reçu
   * Ajoute le candidat à la connexion WebRTC pour établir le P2P
   * @param message Message contenant le candidat ICE
   */
  private async handleICECandidate(message: any): Promise<void>
  {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(message.candidate);
  }

  // =================================
  // MÉTHODES PRIVÉES DE LOGIQUE DE JEU
  // =================================

  /**
   * Démarre le jeu côté hôte
   * Configure les noms des joueurs et lance la boucle de jeu
   */
  private startGameAsHost(): void
  {
    Logger.log('🎮 Starting game as HOST');
    
    // Configuration des noms de joueurs
    this.settings.player1Name = authService.getCurrentUser()?.username || 'Host';
    this.settings.player2Name = this.opponentUsername;
    
    // Démarrage du jeu local
    this.startLocalGame();
    
    // Démarrage de la boucle d'envoi des mises à jour
    this.startGameUpdateLoop();
  }

  /**
   * Boucle principale d'envoi des mises à jour de jeu (côté hôte uniquement)
   * Envoie l'état complet du jeu à l'invité 60 fois par seconde
   */
  private startGameUpdateLoop(): void
  {
    if (!this.isHost) return;

    const sendUpdate = () =>
    {
      if (this.dataChannel?.readyState === 'open')
      {
        // Récupération des positions actuelles depuis la physique
        const positions = this.physics.getPositions();
        
        // Construction de l'objet de mise à jour complet
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
            powerUps: this.powerUpManager ? this.powerUpManager.getActivePowerUps() : [],
            paddleEffects: this.powerUpManager ? this.powerUpManager.getPaddleEffects() : {}
          }
        };

        // Envoi via WebRTC DataChannel
        this.dataChannel.send(JSON.stringify(gameUpdate));
      }
      
      // Continuer la boucle tant que le jeu n'est pas fini
      if (this.gameState.status !== 'finished')
      {
        requestAnimationFrame(sendUpdate);
      }
    };

    // Démarrage de la boucle
    sendUpdate();
  }

  /**
   * Override de la méthode updateGame du parent
   * Différencie la logique selon le rôle (hôte/invité)
   */
  protected updateGame(): void
  {
    if (!this.isHost)
    {
      // Côté invité : envoyer les inputs à l'hôte
      this.sendContinuousInputToHost();
      return;
    }
    
    // Côté hôte : modifier les inputs avant d'appeler le parent
    const hostInputs = this.controls.getInputs();
    const modifiedInputs = {
      player1: hostInputs.player1, // Inputs de l'hôte
      player2: this.guestInputs    // Inputs reçus de l'invité
    };
    
    // Remplacement temporaire des contrôles
    const originalGetInputs = this.controls.getInputs;
    this.controls.getInputs = () => modifiedInputs;
    
    // Appel de la logique de jeu normale avec les inputs modifiés
    super.updateGame();
    
    // Restauration des contrôles originaux
    this.controls.getInputs = originalGetInputs;
  }

  /**
   * Envoie continuellement les inputs du joueur invité à l'hôte
   * Appelé à chaque frame côté invité
   */
  private sendContinuousInputToHost(): void
  {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;

    // Récupération des inputs actuels
    const inputs = this.controls.getInputs();
    const input = {
      up: inputs.player1.up,
      down: inputs.player1.down
    };

    // Envoi via WebRTC (seulement si il y a du mouvement pour optimiser)
    this.dataChannel.send(JSON.stringify({
      type: 'player_input',
      input: input
    }));

    // Log seulement quand il y a du mouvement
    if (input.up || input.down)
    {
      Logger.log('📤 Guest sending input to host:', input);
    }
  }

  // =================================
  // MÉTHODES PRIVÉES P2P
  // =================================

  /**
   * Traite tous les messages reçus via le canal WebRTC P2P
   * @param data Objet message reçu
   */
  private handleP2PMessage(data: any): void
  {
    switch (data.type)
    {
      case 'game_settings':
        // Réception des paramètres de jeu de l'hôte
        Logger.log('📥 Guest received game settings from host:', data.settings);
        this.applyHostGameSettings(data.settings);
        break;

      case 'game_update':
        // Mise à jour de l'état du jeu (côté invité uniquement)
        if (!this.isHost)
        {
          this.applyRemoteGameState(data.state);
        }
        break;

      case 'player_input':
        // Réception des inputs de l'invité (côté hôte uniquement)
        if (this.isHost)
        {
          this.applyRemoteInput(data.input);
        }
        break;

      case 'player_disconnect':
        // Déconnexion volontaire de l'adversaire
        Logger.log('🚪 Opponent disconnected voluntarily:', data.reason);
        if (!this.gameEndedByDisconnection)
        {
          this.handleOpponentQuit(data.reason);
        }
        break;

      case 'voluntary_disconnect':
        // Autre forme de déconnexion volontaire
        Logger.log(`🚪 Opponent quit voluntarily: ${data.reason}`);
        this.handleOpponentQuit(data.reason);
        break;

      case 'match_saved':
        // Confirmation que l'adversaire a sauvegardé les données du match
        Logger.log('💾 Opponent saved the match data');
        this.isMatchDataSent = true;
        break;
    }
  }

  /**
   * Applique l'état du jeu reçu de l'hôte (côté invité)
   * Met à jour toutes les positions, scores, et effets visuels
   * @param state État complet du jeu envoyé par l'hôte
   */
  private applyRemoteGameState(state: any): void
  {
    // Mise à jour des positions 3D
    this.renderer.updatePositions({
      player1Paddle: state.paddles.player1Paddle,
      player2Paddle: state.paddles.player2Paddle,
      ball: state.ball
    });

    // Mise à jour des données de jeu
    this.gameState.scores = state.scores;
    this.gameState.timer = state.timer;
    this.gameState.status = state.status;
    this.gameState.winner = state.winner;
    
    // Synchronisation des power-ups si activés
    if (this.powerUpManager && state.powerUps)
    {
      this.powerUpManager.syncActivePowerUps(state.powerUps);
      if (state.paddleEffects)
      {
        this.powerUpManager.syncPaddleEffects(state.paddleEffects);
        this.applyPhysicsEffects();
      }
    }
    
    // Sauvegarde en sessionStorage pour la reprise en cas d'interruption
    this.saveGameStateToSession();
    
    // Mise à jour de l'interface utilisateur
    this.updateUI();
    this.updateTimerDisplay();

    // Gestion de la fin de partie
    if (state.status === 'finished')
    {
      sessionStorage.removeItem('remote_game_active');
      sessionStorage.removeItem('remote_game_data');
      this.handleRemoteGameEnd();
    }
  }

  /**
   * Applique les inputs reçus de l'invité (côté hôte)
   * @param input Objet contenant les états des touches up/down
   */
  private applyRemoteInput(input: any): void
  {
    Logger.log('🎯 Host received input:', input);
    this.guestInputs = {
      up: input.up || false,
      down: input.down || false
    };
  }

  // =================================
  // MÉTHODES PRIVÉES DE PARAMÈTRES
  // =================================

  /**
   * Envoie les paramètres de jeu à l'invité (côté hôte)
   * Ces paramètres seront appliqués automatiquement côté invité
   */
  private sendGameSettingsToGuest(): void
  {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
    
    const gameSettings = {
      type: 'game_settings',
      settings: {
        ballSpeed: this.settings.ballSpeed,
        winScore: this.settings.winScore,
        powerUps: this.settings.powerUps,
        enableEffects: this.settings.enableEffects
      }
    };
    
    Logger.log('📤 Host sending game settings to guest:', gameSettings.settings);
    this.dataChannel.send(JSON.stringify(gameSettings));
  }

  /**
   * Applique les paramètres de jeu reçus de l'hôte (côté invité)
   * Le thème personnel est préservé côté invité
   * @param hostSettings Paramètres envoyés par l'hôte
   */
  private applyHostGameSettings(hostSettings: any): void
  {
    Logger.log('🔧 Applying host settings:', hostSettings);
    
    // Préservation du thème personnel de l'invité
    const preservedTheme = this.settings.theme;
    
    // Application des paramètres de l'hôte
    this.settings.ballSpeed = hostSettings.ballSpeed;
    this.settings.winScore = hostSettings.winScore;
    this.settings.powerUps = hostSettings.powerUps;
    this.settings.enableEffects = hostSettings.enableEffects;
    this.settings.theme = preservedTheme; // Le thème reste personnel
    
    // Mise à jour du statut de connexion
    this.updateConnectionStatus(i18n.t('game.status.connected_as_guest', { opponent: this.opponentUsername }));
    
    // Affichage des paramètres reçus après un délai
    setTimeout(() =>
    {
      this.addSettingsToStatus(hostSettings, preservedTheme);
    }, 500);
    
    // Démarrage du jeu côté invité après avoir laissé le temps d'afficher les paramètres
    setTimeout(() =>
    {
      this.startLocalGameAsGuest();
    }, 3000);
  }

  /**
   * Démarre le jeu local côté invité
   * Configure les noms des joueurs et initialise le chronomètre
   */
  private startLocalGameAsGuest(): void
  {
    Logger.log('👥 Starting game as GUEST');
    
    // Configuration des noms (inversés côté invité)
    this.settings.player1Name = this.opponentUsername; // L'adversaire (hôte) est player1
    this.settings.player2Name = authService.getCurrentUser()?.username || 'Guest';
    
    // Initialisation du chronomètre de match
    this.matchStartTime = Date.now();
    this.isMatchDataSent = false;
  }

  // =================================
  // MÉTHODES PRIVÉES DE DÉCONNEXION
  // =================================

  /**
   * Gère la déconnexion volontaire de l'adversaire
   * @param reason Raison de la déconnexion
   */
  private handleOpponentQuit(reason: string): void
  {
    if (this.gameState.status === 'finished' || this.gameEndedByDisconnection) return;

    Logger.log(`❌ Opponent quit the game (${reason}) - awarding victory`);
    this.gameEndedByDisconnection = true;
    this.awardVictoryByForfeit('opponent_quit', reason);
  }

  /**
   * Gère la déconnexion involontaire de l'adversaire
   * @param reason Raison de la déconnexion
   */
  private handleOpponentDisconnection(reason: string): void
  {
    if (this.gameState.status === 'finished' || this.gameEndedByDisconnection) return;

    Logger.log(`❌ Opponent disconnected (${reason}) - awarding victory`);
    this.gameEndedByDisconnection = true;
    this.awardVictoryByForfeit('opponent_disconnected', reason);
  }

  /**
   * Attribue la victoire par forfait au joueur local
   * @param type Type de déconnexion (volontaire/involontaire)
   * @param reason Raison détaillée
   */
  private awardVictoryByForfeit(type: 'opponent_quit' | 'opponent_disconnected', reason: string): void
  {
    // Détermination du gagnant selon le rôle
    const currentUser = authService.getCurrentUser();
    let winner: 'player1' | 'player2';
    let winnerName: string;
    let loserName: string;

    if (this.isHost)
    {
      winner = 'player1'; // L'hôte gagne
      winnerName = currentUser?.username || 'Host';
      loserName = this.opponentUsername;
    } else
    {
      winner = 'player2'; // L'invité gagne
      winnerName = currentUser?.username || 'Guest';
      loserName = this.opponentUsername;
    }

    // Mise à jour de l'état du jeu
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    this.gameState.scores.player1 = winner === 'player1' ? 5 : 0;
    this.gameState.scores.player2 = winner === 'player2' ? 5 : 0;

    // Message de statut selon le type de déconnexion
    const statusMessage = type === 'opponent_quit' 
      ? `${loserName} a quitté la partie`
      : `${loserName} s'est déconnecté`;

    this.updateGameStatus(i18n.t('game.status.forfeit_victory', { statusMessage }));

    // Traitement de la victoire par forfait
    this.processForfeitVictory(winner, winnerName, loserName, reason);
  }

  /**
   * Traite la victoire par forfait
   * Sauvegarde les données et affiche le modal de victoire
   * @param winner Joueur gagnant
   * @param winnerName Nom du gagnant
   * @param loserName Nom du perdant
   * @param reason Raison de la déconnexion
   */
  private async processForfeitVictory(winner: 'player1' | 'player2', winnerName: string, loserName: string, reason: string): Promise<void>
  {
    Logger.log(`🏆 Processing forfeit victory: ${winnerName} wins (${reason})`);
    
    // Sauvegarde des données du match si possible
    if (this.opponentUserId && !this.isMatchDataSent)
    {
      try
      {
        await this.saveRemoteMatchDataByWinner(winner);
        Logger.log('✅ Forfeit match data saved by winner');
        this.notifyMatchSaved();
      } catch (error)
      {
        Logger.error('❌ Failed to save forfeit match data:', error);
      }
    }

    // Affichage du modal de victoire après un délai
    setTimeout(() =>
    {
      this.showForfeitVictoryModal(winnerName, loserName, reason);
    }, 1000);

    // Nettoyage des connexions après un délai plus long
    setTimeout(() =>
    {
      this.cleanupConnections();
    }, 3000);
  }

  /**
   * Notifie l'adversaire de la déconnexion volontaire
   * @param reason Raison de la déconnexion
   */
  private notifyVoluntaryDisconnection(reason: string): void
  {
    Logger.log(`📡 Notifying voluntary disconnection: ${reason}`);
    
    // Notification via WebRTC si disponible
    if (this.dataChannel?.readyState === 'open')
    {
      this.dataChannel.send(JSON.stringify({
        type: 'voluntary_disconnect',
        playerId: this.playerId,
        reason: reason,
        timestamp: Date.now()
      }));
    }

    // Notification via WebSocket si disponible
    if (this.signalingWS?.readyState === WebSocket.OPEN)
    {
      this.signalingWS.send(JSON.stringify({
        type: 'player_quit',
        playerId: this.playerId,
        matchId: this.matchId,
        reason: reason,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Notifie que les données du match ont été sauvegardées
   */
  private notifyMatchSaved(): void
  {
    if (this.dataChannel?.readyState === 'open')
    {
      this.dataChannel.send(JSON.stringify({
        type: 'match_saved',
        playerId: this.playerId,
        timestamp: Date.now()
      }));
    }
  }

  // =================================
  // MÉTHODES PRIVÉES DE FIN DE PARTIE
  // =================================

  /**
   * Override de la méthode endGame du parent
   * Gère spécifiquement la fin de partie en mode remote
   * @param winner Joueur gagnant
   */
  protected endGame(winner: 'player1' | 'player2'): void
  {
    Logger.log('🏁 Remote game ending via endGame override');
    
    // Nettoyage du sessionStorage
    sessionStorage.removeItem('remote_game_active');
    sessionStorage.removeItem('remote_game_data');
    
    // Mise à jour de l'état du jeu
    this.gameState.status = 'finished';
    this.gameState.winner = winner;
    
    // Détermination du nom du gagnant
    const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
    
    // Notification du callback si défini
    if (this.onGameEnd)
    {
      const duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
      this.onGameEnd(winnerName, this.gameState.scores, duration);
    }
    
    // Gestion spécifique de la fin de partie remote
    this.handleRemoteGameEnd();
  }

  /**
   * Gère la fin de partie spécifique au mode remote
   * Sauvegarde les données du match et affiche le modal
   */
  private async handleRemoteGameEnd(): Promise<void>
  {
    Logger.log('🏁 Remote game ended');
    
    // Sauvegarde des données du match
    if (this.opponentUserId && !this.isMatchDataSent)
    {
      try
      {
        if (this.isHost)
        {
          // L'hôte sauvegarde en premier
          await this.saveRemoteMatchData();
          this.notifyMatchSaved();
        } else
        {
          // L'invité attend un peu puis sauvegarde si l'hôte n'a pas sauvegardé
          setTimeout(async () =>
          {
            if (!this.isMatchDataSent && this.opponentUserId)
            {
              Logger.log('🔄 Host did not save, guest taking over...');
              await this.saveRemoteMatchDataByWinner(this.gameState.winner!);
            }
          }, 2000);
        }
      } catch (error)
      {
        Logger.error('❌ Failed to save remote match data:', error);
      }
    }
    
    // Affichage du modal de fin si il y a un gagnant
    if (this.gameState.winner)
    {
      const winner = this.gameState.winner;
      const winnerName = winner === 'player1' ? this.settings.player1Name : this.settings.player2Name;
      const loserName = winner === 'player1' ? this.settings.player2Name : this.settings.player1Name;
      
      Logger.log(`🎭 Showing game end modal for ${this.isHost ? 'HOST' : 'GUEST'}: ${winnerName} wins`);
      
      setTimeout(() =>
      {
        this.showGameEndModal(winner, winnerName, loserName);
      }, 500);
    }
    
    // Nettoyage des connexions après un délai
    setTimeout(() =>
    {
      this.cleanupConnections();
    }, 3000);
  }

  /**
   * Affiche le modal de fin de partie
   * @param winner Joueur gagnant
   * @param winnerName Nom du gagnant
   * @param loserName Nom du perdant
   */
  protected showGameEndModal(winner: 'player1' | 'player2', winnerName: string, loserName: string): void
  {
    // Masquage de l'overlay de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay)
    {
      gameOverlay.style.display = 'none';
    }

    // Calcul des statistiques du match
    const matchDuration = Math.floor(this.gameState.timer);
    const totalScore = this.gameState.scores.player1 + this.gameState.scores.player2;
    const winnerScore = this.gameState.scores[winner];
    const loserScore = winner === 'player1' ? this.gameState.scores.player2 : this.gameState.scores.player1;

    // Construction des statistiques pour le modal
    const stats: GameEndStats = {
      winner: winner,
      loser: winner === 'player1' ? 'player2' : 'player1',
      finalScore: { winner: winnerScore, loser: loserScore },
      duration: matchDuration.toString(),
      gameMode: 'remote',
      winnerName,
      loserName,
      winnerScore,
      loserScore,
      matchDuration,
      totalScore,
      winScore: this.settings.winScore
    };

    // Configuration des callbacks du modal
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined, // Pas de rejouer en remote
      onBackToMenu: () =>
      {
        Logger.log('🏠 Going back to menu from remote game...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () =>
      {
        Logger.log('📊 Showing match statistics from remote game...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Création et affichage du modal
    const gameEndModal = new GameEndModal(convertToModalStats(stats), callbacks);
    gameEndModal.show();
  }

  // =================================
  // MÉTHODES PRIVÉES DE SAUVEGARDE
  // =================================

  /**
   * Sauvegarde l'état actuel du jeu en sessionStorage
   * Permet la reprise en cas d'interruption (refresh, etc.)
   */
  private saveGameStateToSession(): void
  {
    Logger.log('💾 saveGameStateToSession called with status:', this.gameState.status, 'isHost:', this.isHost);
    
    if (this.gameState.status === 'playing')
    {
      sessionStorage.setItem('remote_game_active', 'true');
      sessionStorage.setItem('remote_game_data', JSON.stringify({
        opponentUsername: this.opponentUsername,
        opponentUserId: this.opponentUserId,
        isHost: this.isHost,
        matchId: this.matchId,
        scores: this.gameState.scores,
        timer: this.gameState.timer
      }));
      Logger.log('✅ SessionStorage saved successfully for', this.isHost ? 'host' : 'guest');
    }
  }

  /**
   * Sauvegarde les données du match terminé côté hôte
   * Envoie les scores au service de match pour stockage en DB
   */
  private async saveRemoteMatchData(): Promise<void>
  {
    if (!this.opponentUserId)
    {
      Logger.error('❌ Cannot save remote match: opponent user ID missing');
      return;
    }

    // Calcul de la durée du match
    let duration: number;
    if (this.gameState.timer > 0)
    {
      duration = Math.floor(this.gameState.timer);
    } else
    {
      duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    }
    
    try
    {
      // Envoi des données au service de match
      await matchService.sendRemoteMatchData(
        this.opponentUserId,
        this.gameState.scores.player1,
        this.gameState.scores.player2,
        duration
      );
      
      this.isMatchDataSent = true;
      Logger.log('✅ Remote match data saved successfully');
    } catch (error)
    {
      Logger.error('❌ Failed to save remote match data:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde les données du match avec détermination explicite du gagnant
   * Utile pour les victoires par forfait
   * @param winner Joueur déterminé comme gagnant
   */
  private async saveRemoteMatchDataByWinner(winner: 'player1' | 'player2'): Promise<void>
  {
    if (!this.opponentUserId)
    {
      Logger.error('❌ Cannot save remote match: opponent user ID missing');
      return;
    }

    // Calcul de la durée du match
    let duration: number;
    if (this.gameState.timer > 0)
    {
      duration = Math.floor(this.gameState.timer);
    } else
    {
      duration = Math.floor((Date.now() - this.matchStartTime) / 1000);
    }

    // Détermination des scores selon le rôle et le gagnant
    let myScore: number;
    let opponentScore: number;

    if (this.isHost)
    {
      myScore = this.gameState.scores.player1;
      opponentScore = this.gameState.scores.player2;
    } else
    {
      myScore = this.gameState.scores.player2;
      opponentScore = this.gameState.scores.player1;
    }
    
    try
    {
      // Envoi des données avec les scores corrects
      await matchService.sendRemoteMatchData(
        this.opponentUserId,
        myScore,
        opponentScore,
        duration
      );
      
      this.isMatchDataSent = true;
      Logger.log('✅ Forfeit match data saved successfully');
    } catch (error)
    {
      Logger.error('❌ Failed to save forfeit match data:', error);
      throw error;
    }
  }

  // =================================
  // MÉTHODES PRIVÉES DE MODALS
  // =================================

  /**
   * Affiche le modal d'interruption de jeu (défaite par forfait)
   * @param opponentName Nom de l'adversaire qui a gagné
   */
  private showGameInterruptionModal(opponentName: string): void
  {
    this.updateGameStatus('');
    
    const currentUser = authService.getCurrentUser();
    const playerName = currentUser?.username || 'Joueur';
    
    // Construction des statistiques pour le modal
    const stats: GameEndStats = {
      winner: 'player2',
      loser: 'player1',
      finalScore: { winner: 5, loser: 0 },
      duration: '0',
      gameMode: 'remote',
      winnerName: opponentName,
      loserName: playerName,
      winnerScore: 5,
      loserScore: 0,
      matchDuration: 0,
      totalScore: 5,
      winScore: this.settings.winScore
    };

    // Configuration des callbacks
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined,
      onBackToMenu: () =>
      {
        Logger.log('🏠 Going back to menu after game interruption...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () =>
      {
        Logger.log('📊 Showing stats after game interruption...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Création du modal avec personnalisation pour l'interruption
    const gameEndModal = new GameEndModal(convertToModalStats(stats), callbacks);
    
    const originalShow = gameEndModal.show.bind(gameEndModal);
    gameEndModal.show = () =>
    {
      originalShow();
      
      // Personnalisation du contenu après affichage
      setTimeout(() =>
      {
        const titleElement = document.querySelector('.game-end-modal h2');
        if (titleElement)
        {
          titleElement.textContent = 'Défaite par forfait';
          titleElement.className = 'text-2xl font-bold text-red-400 mb-4';
        }
        
        const messageElement = document.querySelector('.game-end-modal .result-message');
        if (messageElement)
        {
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

  /**
   * Affiche le modal de victoire par forfait
   * @param winnerName Nom du gagnant
   * @param loserName Nom du perdant
   * @param reason Raison de la déconnexion
   */
  private showForfeitVictoryModal(winnerName: string, loserName: string, reason: string): void
  {
    // Masquage de l'overlay de jeu
    const gameOverlay = document.getElementById('game-overlay');
    if (gameOverlay)
    {
      gameOverlay.style.display = 'none';
    }

    // Construction des statistiques
    const stats: GameEndStats = {
      winner: 'player1',
      loser: 'player2',
      finalScore: { winner: 5, loser: 0 },
      duration: Math.floor(this.gameState.timer).toString(),
      gameMode: 'remote',
      winnerName,
      loserName,
      winnerScore: 5,
      loserScore: 0,
      matchDuration: Math.floor(this.gameState.timer),
      totalScore: 5,
      winScore: this.settings.winScore
    };

    // Configuration des callbacks
    const callbacks: GameEndCallbacks = {
      onPlayAgain: undefined,
      onBackToMenu: () =>
      {
        Logger.log('🏠 Going back to menu from forfeit...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/game' }));
      },
      onViewStats: () =>
      {
        Logger.log('📊 Showing forfeit statistics...');
        this.destroy();
        window.dispatchEvent(new CustomEvent('navigate', { detail: '/profile' }));
      }
    };

    // Création et affichage du modal
    const gameEndModal = new GameEndModal(convertToModalStats(stats), callbacks);
    gameEndModal.show();
  }

  // =================================
  // MÉTHODES PRIVÉES D'AFFICHAGE
  // =================================

  /**
   * Met à jour le statut de connexion affiché
   * @param message Nouveau message de statut
   */
  private updateConnectionStatus(message: string): void
  {
    const statusEl = document.getElementById('game-status');
    if (statusEl)
    {
      const mainMessage = statusEl.querySelector('.main-status-message');
      if (mainMessage)
      {
        mainMessage.textContent = message;
      } else
      {
        // Reconstruction du HTML si le message principal n'existe pas
        statusEl.innerHTML = `
          <div class="text-center space-y-3">
            <div class="main-status-message text-lg text-blue-400">${message}</div>
            <div class="settings-info" style="display: none;"></div>
          </div>
        `;
      }
    }
  }

  /**
   * Ajoute l'affichage des paramètres reçus dans le statut
   * @param hostSettings Paramètres reçus de l'hôte
   * @param preservedTheme Thème préservé côté invité
   */
  private addSettingsToStatus(hostSettings: any, preservedTheme: string): void
  {
    const statusEl = document.getElementById('game-status');
    const settingsContainer = statusEl?.querySelector('.settings-info');

    if (settingsContainer)
    {
      settingsContainer.innerHTML = `
        <div class="p-3 bg-gray-800/60 rounded-lg border border-green-500/20 mt-3">
          <div class="text-sm text-green-400 font-medium mb-2">
            ${i18n.t('game.status.received_host_settings')} 
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
        </div>
      `;

      (settingsContainer as HTMLElement).style.display = 'block';
    }
  }

  /**
   * Met à jour l'affichage du chronomètre côté invité
   * Synchronise avec les données reçues de l'hôte
   */
  private updateTimerDisplay(): void
  {
    const minutes = Math.floor(this.gameState.timer / 60);
    const seconds = Math.floor(this.gameState.timer % 60);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Mise à jour de tous les éléments de chronomètre
    const timerElements = [
      document.querySelector('#game-timer .text-lg'),
      document.querySelector('#game-timer .text-2xl'),
      document.getElementById('game-timer-display'),
      document.getElementById('game-timer-mobile')
    ];
    
    timerElements.forEach(el =>
    {
      if (el) el.textContent = timeString;
    });
    
    Logger.log('🕐 Guest timer updated:', timeString);
  }

  /**
   * Override de updateGameStatus pour gérer les interruptions
   * Bloque les mises à jour si le jeu a été interrompu
   * @param status Nouveau statut à afficher
   */
  protected updateGameStatus(status: string): void
  {
    if (this.gameWasInterrupted)
    {
      Logger.log('🚫 Blocking status update due to interruption:', status);
      return;
    }
    
    // Appel de la méthode parente
    super.updateGameStatus(status);
  }

  // =================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // =================================

  /**
   * Convertit la vitesse en nom d'affichage
   * @param speed Valeur de vitesse (slow/medium/fast)
   * @returns Nom d'affichage en français
   */
  private getSpeedDisplayName(speed: string): string
  {
    const speedMap: Record<string, string> = {
      slow: 'Lent',
      medium: 'Moyen', 
      fast: 'Rapide'
    };
    return speedMap[speed] || speed;
  }

  /**
   * Convertit le thème en nom d'affichage
   * @param theme Valeur du thème
   * @returns Nom d'affichage en français
   */
  private getThemeDisplayName(theme: string): string
  {
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

  // =================================
  // MÉTHODES PRIVÉES DE NAVIGATION
  // =================================

  /**
   * Configure la détection des événements de navigation
   * Permet de gérer proprement les interruptions de jeu
   */
  private setupPageLeaveDetection(): void
  {
    // Gestionnaire de fermeture/refresh de page
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) =>
    {
      Logger.log('🚪 Page is being closed/refreshed');
      
      if (this.gameState.status === 'playing')
      {
        // Sauvegarde de l'état avant fermeture
        this.saveGameStateToSession();
        this.notifyVoluntaryDisconnection('page_refresh');
        
        // Message d'avertissement pour l'utilisateur
        event.preventDefault();
        event.returnValue = 'Une partie est en cours. Êtes-vous sûr de vouloir quitter ?';
        return event.returnValue;
      }
    };
    
    // Gestionnaire de navigation interne (SPA)
    this.navigationHandler = (event: CustomEvent) =>
    {
      const targetRoute = event.detail;
      if (targetRoute !== '/game' && this.gameState.status === 'playing')
      {
        Logger.log('🚶 User navigating away from game:', targetRoute);
        this.saveGameStateToSession();
        this.notifyVoluntaryDisconnection('page_navigation');
      }
    };
    
    // Gestionnaire de visibilité de page (onglet actif/inactif)
    this.visibilityChangeHandler = () =>
    {
      if (document.hidden && this.gameState.status === 'playing')
      {
        Logger.log('👁️ Page became hidden during game');
        this.saveGameStateToSession();
        
        // Déconnexion automatique après inactivité prolongée
        setTimeout(() =>
        {
          if (document.hidden && this.gameState.status === 'playing')
          {
            Logger.log('⏰ User inactive too long, disconnecting');
            this.saveGameStateToSession();
            this.notifyVoluntaryDisconnection('inactivity');
          }
        }, 60000); // 1 minute
      }
    };
    
    // Enregistrement des gestionnaires d'événements
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    window.addEventListener('beforeNavigate', this.navigationHandler as EventListener);
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Supprime tous les gestionnaires d'événements de navigation
   * Appelé lors de la destruction de l'instance
   */
  private removePageLeaveDetection(): void
  {
    if (this.beforeUnloadHandler)
    {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    
    if (this.visibilityChangeHandler)
    {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    
    if (this.navigationHandler)
    {
      window.removeEventListener('beforeNavigate', this.navigationHandler as EventListener);
      this.navigationHandler = null;
    }
  }

  // =================================
  // MÉTHODES PRIVÉES DE NETTOYAGE
  // =================================

  /**
   * Nettoie toutes les connexions réseau
   * Ferme proprement WebSocket et WebRTC
   */
  private cleanupConnections(): void
  {
    Logger.log('🔌 Cleaning up connections');
    
    // Fermeture du canal de données WebRTC
    if (this.dataChannel)
    {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Fermeture de la connexion WebRTC
    if (this.peerConnection)
    {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Fermeture de la connexion WebSocket
    if (this.signalingWS && this.signalingWS.readyState === WebSocket.OPEN)
    {
      this.signalingWS.send(JSON.stringify({ 
        type: 'leave_matchmaking',
        playerId: this.playerId
      }));
      this.signalingWS.close();
      this.signalingWS = null;
    }
  }

  // =================================
  // MÉTHODES PUBLIQUES
  // =================================

  /**
   * Méthode de destruction complète de l'instance
   * Nettoie toutes les ressources et connexions
   */
  public destroy(): void
  {
    Logger.log('🧹 Destroying RemotePong instance');
    
    // Nettoyage du sessionStorage
    sessionStorage.removeItem('remote_game_active');
    sessionStorage.removeItem('remote_game_data');
    
    // Flag pour éviter les traitements multiples
    this.gameEndedByDisconnection = true;
    
    // Suppression des gestionnaires de navigation
    this.removePageLeaveDetection();
    
    // Nettoyage des connexions
    this.cleanupConnections();
    
    // Appel de la destruction parente
    super.destroy();
  }
}