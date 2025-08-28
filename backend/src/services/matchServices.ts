import { create } from 'domain';
import db from '../db/index.js';
import { MatchResponse } from '../types/match.js';

export class MatchService 
{
    static async createLocalMatch(player1: string, player2: string, userId?: number): Promise<MatchResponse>
    {
        // creer match
        const matchStmt = db.prepare(`
            INSERT INTO matches (mode, started_at)
            VALUES ('local', datetime('now'))
        `);

        const matchResult = matchStmt.run();
        const matchId = matchResult.lastInsertRowid as number;

        // ajouter participants
        const participantsStmt = db.prepare(`
            INSERT INTO match_participants (match_id, user_id, alias, score, is_winner)
            VALUES (?, ?, ?, 0, 0)    
        `);

        if (userId)
            participantsStmt.run(matchId, userId, null);
        else
            participantsStmt.run(matchId, null, player1); //siuuu voir definition d'un alias ??

        participantsStmt.run(matchId, null, player2);

        return ({
            id: matchId,
            mode: 'local',
            player1: {name: player1, isUser: !!userId},
            player2: {name: player2, isUser: false},
            status: 'in_progress',
            createdAt: new Date().toDateString()
        });
    }

    static async finishLocalMatch(matchId: number, winner: string, scores: any) 
    {
    }

    static async getMatch(matchId: number) 
    {
    }
}