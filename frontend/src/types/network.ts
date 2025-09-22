export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface GameMessage {
  type: 'game_state' | 'player_move' | 'game_end' | 'ping' | 'pong';
  data: any;
  timestamp: number;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  latency?: number;
  lastPing?: number;
}

export interface RemoteGameConfig {
  roomId: string;
  playerId: string;
  isHost: boolean;
  opponentId?: string;
}