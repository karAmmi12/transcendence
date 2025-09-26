import db from '../db/index.js';
import { HomeStats } from '../types/stats.js';

export class HomeService 
{
    /**
     * Récupère les statistiques générales
     */
    static getHomeStats(): HomeStats 
    {
        try {

            // 1. Nombre total d'utilisateurs
            const totalUsersStmt = db.prepare("SELECT COUNT(*) as count FROM users");
            const totalPlayers = (totalUsersStmt.get() as any).count;

            // 2. Nombre total de matchs (terminés uniquement)
            const totalMatchesStmt = db.prepare("SELECT COUNT(*) as count FROM matches WHERE ended_at IS NOT NULL");
            const totalGames = (totalMatchesStmt.get() as any).count;

            // 3. Nombre d'utilisateurs en ligne
            const onlineUsersStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_online = 1");
            const onlinePlayers = (onlineUsersStmt.get() as any).count;

            return {
                totalPlayers,
                totalGames,
                onlinePlayers
            };

        } catch (error) {
            console.error('Error getting home stats:', error);
            return {
                totalPlayers: 0,
                totalGames: 0,
                onlinePlayers: 0
            };
        }
    }
}