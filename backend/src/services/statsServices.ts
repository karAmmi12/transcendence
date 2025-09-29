import db from '../db/index.js'
import { UserStats } from '../types/auth';
import { MatchHistory } from '../types/stats.js';
import { serialize } from '../utils/serialize.js';
import { Logger } from '../utils/logger.js';

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
            Logger.error('Error calculating stats:', error);
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
    static getUserMatchHistory(userId: number, limit: number = 10): MatchHistory[]
    {
      try {
        const stmt = db.prepare(`
                SELECT 
                    m.id,
                    m.mode,
                    m.started_at,
                    m.ended_at,
                    m.tournament_id,
                    -- Score de l'utilisateur
                    user_mp.score as user_score,
                    user_mp.is_winner,
                    -- Informations de l'adversaire
                    opponent_mp.score as opponent_score,
                    COALESCE(opponent_user.username, opponent_mp.alias, 'IA') as opponent_name,
                    opponent_user.avatar_url as opponentAvatar
                FROM matches m
                -- Participation de l'utilisateur
                JOIN match_participants user_mp ON m.id = user_mp.match_id AND user_mp.user_id = ?
                -- Participation de l'adversaire
                LEFT JOIN match_participants opponent_mp ON m.id = opponent_mp.match_id 
                    AND opponent_mp.id != user_mp.id
                -- Infos de l'adversaire si c'est un utilisateur connecté
                LEFT JOIN users opponent_user ON opponent_mp.user_id = opponent_user.id
                WHERE m.ended_at IS NOT NULL  -- Seulement les matches terminés
                ORDER BY m.ended_at DESC
                LIMIT ?
            `);
          const matchesRaw = stmt.all(userId, limit) as any[];
          // Transformer les données brutes en format MatchHistory
            const matches: MatchHistory[] = matchesRaw.map(matchRaw => {
                const match = serialize(matchRaw);
                
                const duration = match.startedAt && match.endedAt 
                    ? Math.floor((new Date(match.endedAt).getTime() - new Date(match.startedAt).getTime()) / 1000)
                    : undefined;
                
                return {
                    id: match.id,
                    opponent: match.opponentName,
                    opponentAvatar: match.opponentAvatar,
                    result: match.isWinner === 1 ? 'win' : 'loss',
                    score: {
                        player: match.userScore,
                        opponent: match.opponentScore
                    },
                    date: match.endedAt,     
                    duration,
                    gameMode: match.mode 
                };
            });

        return (matches);

      } catch (error) {
        Logger.error('Error getting match history for user', userId, ':', error);
        return [];
      }
    }
}