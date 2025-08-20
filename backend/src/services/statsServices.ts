import { totalmem } from 'os';
import db from '../db/index.js'
import { UserStats } from '../types/auth';

export class StatsService
{
    /**
     * service stats user
     */
    static getUserStats(userId: number): UserStats
    {
        try {
            const stmt = db.prepare(`
                SELECT 
                  COUNT(DISTINCT mp.match_id) as totalGames,
                  SUM(CASE WHEN mp.is_winner = 1 THEN 1 ELSE 0 END) as wins,
                  SUM(CASE WHEN mp.is_winner = 0 THEN 1 ELSE 0 END) as losses,
                  ROUND(
                    CASE 
                      WHEN COUNT(DISTINCT mp.match_id) > 0 
                      THEN (SUM(CASE WHEN mp.is_winner = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT mp.match_id)
                      ELSE 0 
                    END, 2
                  ) as winRate
                FROM match_participants mp
                JOIN matches m ON mp.match_id = m.id
                WHERE mp.user_id = ? 
                AND m.ended_at IS NOT NULL  -- Seulement les matches terminés
              `);

            const stats = stmt.get(userId) as UserStats;
            if (!stats || stats.totalGames === 0)
                return ({
                wins: 0,
                losses: 0,
                totalGames:0,
                winRate: 0
            });

            return ({
                wins: stats.wins || 0,
                losses: stats.losses || 0,
                totalGames: stats.totalGames || 0,
                winRate: stats.winRate || 0
            });

        } catch (error) {
            console.error('Error calculating stats:', error);
            return ({
                wins: 0,
                losses: 0,
                totalGames: 0,
                winRate: 0
            });
        }

    }

    /**
     * service match history
     */
}