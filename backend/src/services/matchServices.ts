import { create } from 'domain';
import db from '../db/index.js';
import { MatchResponse } from '../types/match.js';

export class MatchService 
{
    static async createLocalMatch(player1: string, player2: string, score1: number, score2: number, duration: number, userId?: number): Promise<MatchResponse>
    {
        // SIUUUUUUUUUU TEST
        const winner = score1 > score2 ? player1 : player2;
        const userWinner = userId && winner === player1 ? userId : null

        // creer match
        const matchStmt = db.prepare(`
            INSERT INTO matches (mode, started_at, ended_at, winner_id)
            VALUES ('local', datetime('now', '-' || ? || ' seconds'), datetime('now'), ?)
        `);

        const matchResult = matchStmt.run(duration, userWinner);
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

    static async createRemoteMatch(player1UserId: number, player2UserId: number, score1: number, score2: number, duration: number): Promise<MatchResponse>
    {
        const winnerId = score1 > score2 ? player1UserId : player2UserId;

        // creer match remote
        const matchStmt = db.prepare(`
            INSERT INTO matches (mode, started_at, ended_at, winner_id)
            VALUES ('remote', datetime('now', '-' || ? || ' seconds'), datetime('now'), ?)
        `);

        const matchResult = matchStmt.run(duration, winnerId);
        const matchId = matchResult.lastInsertRowid as number;

        // ajouter participants - les deux sont des utilisateurs avec ID
        const participantsStmt = db.prepare(`
            INSERT INTO match_participants (match_id, user_id, alias, score, is_winner)
            VALUES (?, ?, ?, ?, ?)    
        `);
        
        // player1
        participantsStmt.run(matchId, player1UserId, null, score1, score1 > score2 ? 1 : 0);
        
        // player2
        participantsStmt.run(matchId, player2UserId, null, score2, score2 > score1 ? 1 : 0);

        return ({
            success: true,
            message: "Remote match register success"
        });
    }

    static async getMatch(matchId: number) 
    {
    }
}