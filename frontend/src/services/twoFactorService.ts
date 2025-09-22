export class TwoFactorService {
  // ==========================================
  // PROPRIÉTÉS PRIVÉES
  // ==========================================
  private static instance: TwoFactorService;
  private baseURL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : `http://${location.hostname}:8000/api`;

  // ==========================================
  // INITIALISATION ET CONFIGURATION
  // ==========================================

  /**
   * Obtient l'instance unique du service (pattern Singleton)
   */
  public static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================

  /**
   * Activer 2FA - envoie un code par email
   */
  public async enable2FA(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/2fa/enabled`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ disabled: false })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      return data;
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  /**
   * Vérifier le code 2FA
   */
  public async verify2FA(code: string, disabled: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ code, disabled })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify 2FA code');
      }

      return data;
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      throw error;
    }
  }

  /**
   * Désactiver 2FA
   */
  public async disable2FA(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/2fa/disabled`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ disabled: true })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      return data;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }
}

export const twoFactorService = TwoFactorService.getInstance();