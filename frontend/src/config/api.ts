import { Logger } from '@/utils/logger.js'; 

export class ApiConfig {
  private static getBaseUrl(): string {
    // Simple détection: si c'est HTTPS ou si on est sur un port 443/80, c'est la production
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         window.location.port === '443' || 
                         window.location.port === '80' ||
                         window.location.port === '');
    
    // En production, utiliser l'URL relative (proxy nginx)
    if (isProduction) {
      return '/api';
    }
    
    // En développement, détection automatique de l'environnement
    const currentHost = window.location.hostname;
    
    // Si on accède via une IP spécifique, garder cette IP pour les cookies
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `http://${currentHost}:8000/api`;
    }
    
    // Sinon, utiliser localhost
    return 'http://localhost:8000/api';
  }
  
  private static getWsUrl(): string {
    // Simple détection de la production
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         window.location.port === '443' || 
                         window.location.port === '80' ||
                         window.location.port === '');
    
    // En production, utiliser le proxy nginx
    if (isProduction) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${window.location.host}/ws`;
    }
    
    // En développement, même logique que l'API
    const currentHost = window.location.hostname;
    
    // Si on accède via une IP spécifique, garder cette IP
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      return `ws://${currentHost}:8001`;
    }
    
    // Sinon, utiliser localhost
    return 'ws://localhost:8001';
  }
  
  public static readonly API_URL = ApiConfig.getBaseUrl();
  public static readonly WS_URL = ApiConfig.getWsUrl();
  
  // ✅ Fonction pour débugger les URLs utilisées
  public static logUrls(): void {
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.protocol === 'https:' || 
                         window.location.port === '443' || 
                         window.location.port === '80' ||
                         window.location.port === '');
    
    Logger.log('🔗 API Configuration:');
    Logger.log('  - Current host:', window.location.hostname);
    Logger.log('  - Current port:', window.location.port);
    Logger.log('  - Current protocol:', window.location.protocol);
    Logger.log('  - API URL:', ApiConfig.API_URL);
    Logger.log('  - WebSocket URL:', ApiConfig.WS_URL);
    Logger.log('  - Environment:', isProduction ? 'production' : 'development');
  }
}
