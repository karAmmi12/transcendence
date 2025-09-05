import { WebSocket, WebSocketServer } from 'ws';

interface Player {
  id: string;
  username: string;
  userId?: number;
  ws: WebSocket;
  status: 'waiting' | 'in_match';
}

interface Match {
  id: string;
  host: Player;
  guest: Player;
  status: 'connecting' | 'active';
}

export class WebSocketService {
  private wss: WebSocketServer;
  private players: Map<string, Player> = new Map();
  private waitingQueue: Player[] = [];
  private matches: Map<string, Match> = new Map();

  constructor(port: number = 8001) {
    this.wss = new WebSocketServer({ port });
    console.log(`🚀 WebSocket signaling server started on port ${port}`);
    
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });
  }

  private handleConnection(ws: WebSocket): void {
    console.log('🔗 New signaling connection');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ Invalid message format:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'join_matchmaking':
        this.handleJoinMatchmaking(ws, message);
        break;
      
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'webrtc_ice_candidate':
        this.relayWebRTCSignal(ws, message);
        break;
      
      case 'leave_matchmaking':
        this.handleLeaveMatchmaking(ws);
        break;
    }
  }

  private handleJoinMatchmaking(ws: WebSocket, message: any): void {
    const { playerId, username, userId } = message;
    
    const player: Player = {
      id: playerId,
      username,
      userId,
      ws,
      status: 'waiting'
    };

    this.players.set(playerId, player);

    // Chercher un adversaire
    if (this.waitingQueue.length > 0) {
      const host = this.waitingQueue.shift()!;
      const guest = player;

      this.createMatch(host, guest);
    } else {
      this.waitingQueue.push(player);
      
      ws.send(JSON.stringify({
        type: 'waiting_opponent',
        message: 'Recherche d\'un adversaire...'
      }));
    }
  }

  private createMatch(host: Player, guest: Player): void {
    const matchId = `match_${Date.now()}`;
    
    const match: Match = {
      id: matchId,
      host,
      guest,
      status: 'connecting'
    };

    this.matches.set(matchId, match);

    // Notifier l'hôte (celui qui calcule la physique)
    host.ws.send(JSON.stringify({
      type: 'match_found',
      matchId,
      role: 'host',
      opponent: {
        id: guest.id,
        username: guest.username,
        userId: guest.userId
      }
    }));

    // Notifier l'invité (celui qui envoie ses inputs)
    guest.ws.send(JSON.stringify({
      type: 'match_found',
      matchId,
      role: 'guest',
      opponent: {
        id: host.id,
        username: host.username,
        userId: host.userId
      }
    }));
  }

  private relayWebRTCSignal(ws: WebSocket, message: any): void {
    const senderId = this.getPlayerIdFromWS(ws);
    if (!senderId) return;

    // Trouver l'adversaire et lui relayer le signal
    for (const match of this.matches.values()) {
      if (match.host.id === senderId) {
        match.guest.ws.send(JSON.stringify({
          ...message,
          fromId: senderId
        }));
        break;
      } else if (match.guest.id === senderId) {
        match.host.ws.send(JSON.stringify({
          ...message,
          fromId: senderId
        }));
        break;
      }
    }
  }

  private handleDisconnection(ws: WebSocket): void {
    const playerId = this.getPlayerIdFromWS(ws);
    if (!playerId) return;

    console.log(`👋 Player ${playerId} disconnected`);

    // Retirer de la file d'attente
    this.waitingQueue = this.waitingQueue.filter(p => p.id !== playerId);
    
    // Notifier l'adversaire
    this.notifyOpponentDisconnection(playerId);
    
    // Nettoyer
    this.players.delete(playerId);
  }

  private getPlayerIdFromWS(ws: WebSocket): string | null {
    for (const [id, player] of this.players) {
      if (player.ws === ws) return id;
    }
    return null;
  }

  private notifyOpponentDisconnection(playerId: string): void {
    for (const match of this.matches.values()) {
      if (match.host.id === playerId && match.guest.ws.readyState === WebSocket.OPEN) {
        match.guest.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
        this.matches.delete(match.id);
        break;
      } else if (match.guest.id === playerId && match.host.ws.readyState === WebSocket.OPEN) {
        match.host.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
        this.matches.delete(match.id);
        break;
      }
    }
  }

  private handleLeaveMatchmaking(ws: WebSocket): void {
    const playerId = this.getPlayerIdFromWS(ws);
    if (playerId) {
      this.waitingQueue = this.waitingQueue.filter(p => p.id !== playerId);
      this.players.delete(playerId);
    }
  }
}
