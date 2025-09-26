import cron from 'node-cron';
import db from '../db/index.js';

interface TokenRow {
  user_id: number;
  expires_at: string;
}

function cleanupExpiredTokens(): void {
  const tokens = db.prepare('SELECT user_id, expires_at FROM two_factor_tokens').all() as TokenRow[];
  const now = new Date(Date.now()).toISOString();

  tokens.forEach(token => {
    if (token.expires_at < now) {
      db.prepare('DELETE FROM two_factor_tokens WHERE user_id = ?').run(token.user_id);
      console.log(`Token expiré supprimé pour user_id: ${token.user_id}`);
    }
  });
}

// Fonction pour démarrer le cron job
export function startTokenCleanup(): void {
  // Toutes les 24 heures (1440 minutes)
  cron.schedule('0 0 * * *', cleanupExpiredTokens);
  console.log('✅ Token cleanup cron job started');
}

// Fonction pour nettoyer manuellement
export { cleanupExpiredTokens };