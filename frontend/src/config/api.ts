import { Logger } from '@/utils/logger.js';

export class ApiConfig {
  private static getBaseUrl(): string {
    // Détection plus robuste de l'environnement de production
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         (window.location.hostname !== 'localhost' &&
                          window.location.hostname !== '127.0.0.1' &&
                          window.location.port === '') ||
                         window.location.hostname.includes('kammi.dev'));
    
    if (isProduction) {
      // En production, toujours utiliser le proxy nginx
      return '/api';
    }
    
    // En développement, utiliser l'hôte courant
    const currentHost = window.location.hostname;
    return `http://${currentHost}:8000/api`;
  }
  
  private static getWsUrl(): string {
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         (window.location.hostname !== 'localhost' &&
                          window.location.hostname !== '127.0.0.1' &&
                          window.location.port === '') ||
                         window.location.hostname.includes('kammi.dev'));
    
    if (isProduction) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${window.location.host}/ws`;
    }
    
    const currentHost = window.location.hostname;
    return `ws://${currentHost}:8001`;
  }
  
  public static readonly API_URL = ApiConfig.getBaseUrl();
  public static readonly WS_URL = ApiConfig.getWsUrl();
  
  public static logUrls(): void {
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         (window.location.hostname !== 'localhost' &&
                          window.location.hostname !== '127.0.0.1' &&
                          window.location.port === '') ||
                         window.location.hostname.includes('kammi.dev'));
    
    Logger.log('🔗 API Configuration:');
    Logger.log('  - Current host:', window.location.hostname);
    Logger.log('  - Current protocol:', window.location.protocol);
    Logger.log('  - API URL:', ApiConfig.API_URL);
    Logger.log('  - WebSocket URL:', ApiConfig.WS_URL);
    Logger.log('  - Environment:', isProduction ? 'production' : 'development');
  }
}