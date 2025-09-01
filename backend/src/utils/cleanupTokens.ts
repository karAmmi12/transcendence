import cron from 'node-cron';
import db from '../db/index.js';

interface TokenRow {
  user_id: number;
  expires_at: string;
}

// Toutes les 10 minutes, supprime les tokens expirés dans le 2FA
cron.schedule('*/10 * * * *', () => {
  const tokens = db.prepare('SELECT user_id, expires_at FROM two_factor_tokens').all() as TokenRow[];
  const now = new Date(Date.now()).toISOString();

  tokens.forEach(token => {
    if (token.expires_at < now) {
      db.prepare('DELETE FROM two_factor_tokens WHERE user_id = ?').run(token.user_id);
      console.log(`Token expiré supprimé pour user_id: ${token.user_id}`);
    }
  });
});