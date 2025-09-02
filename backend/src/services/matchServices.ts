import { create } from 'domain';
import db from '../db/index.js';
import { MatchResponse } from '../types/match.js';

export class MatchService 
{
    static async createLocalMatch(player1: string, player2: string, score1: number, score2: number, duration: number, userId?: number): Promise<MatchResponse>
    {
        // creer match
        const matchStmt = db.prepare(`
            INSERT INTO matches (mode, started_at, ended_at)
            VALUES ('local', datetime('now', '-' || ? || ' seconds'), datetime('now'))
        `);

        const matchResult = matchStmt.run(duration);
        const matchId = matchResult.lastInsertRowid as number;

        // ajouter participants
        const participantsStmt = db.prepare(`
            INSERT INTO match_participants (match_id, user_id, alias, score, is_winner)
            VALUES (?, ?, ?, ?, ?)    
        `);
        
        // player1
        if (userId)
            participantsStmt.run(matchId, userId, null, score1, score1 > score2 ? 1 : 0);
        else
            participantsStmt.run(matchId, null, player1, score1, score1 > score2 ? 1 : 0);

        //player2
        participantsStmt.run(matchId, null, player2, score2, score2 > score1 ? 1 : 0);

        return ({
            success: true,
            message: "Local match register success"
        });
    }

    static async getMatch(matchId: number) 
    {
    }
}