import db from '../db/index.js';
import { CreateTournamentBody, FinishMatchBody, TournamentResponse, TournamentParticipant, TournamentBracket} from "../types/tournament.js"

export class TournamentService 
{
    /**
     * service qui creer un tournoi pour 8 participant
     */
    static async createTournament(participants: string[], userId?: number): Promise<TournamentResponse> 
    {
        if (!participants || participants.length !== 8) //siuu a supprimer si gerer dans le back
            throw new Error('Tournament requires exactly 8 participants');

        const stmt = db.prepare (`
            INSERT INTO tournaments (status, created_at)
            VALUES ('waiting', datetime('now'))
        `);

        const result = stmt.run();
        const tournamentId = result.lastInsertRowid as number;
        
        let finalParticipants = [...participants];
        if (userId) // siuu peut etre deja gerer par le front
        {
            const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
            if (user)
                finalParticipants[0] = user.username;
        }

        const shuffledParticipants = this.shuffleArray(finalParticipants);
        
        //siuu a finir
    }

     /**
     * Créer les matchs des quarts de finale
     */
    private static async createQuarterFinals(tournamentId: number, participants: TournamentParticipant[]): Promise<TournamentBracket>
    {

    }

    /**
     * Récupérer un tournoi complet
     */
    static async getTournament(tournamentId: number): Promise<TournamentResponse>
    {

    }

    /**
     * Démarrer un match
     */
    static async startMatch(tournamentId: number, matchId: number): Promise<any>
    {

    }

    /**
     * Terminer un match (logique identique aux matches simples)
     */
    static async finishMatch(tournamentId: number, matchId: number, winner: string, scores: { player1: number; player2: number }): Promise<any> 
    {

    }

    /* ========== MÉTHODES PRIVÉES ========== */

    private static async buildBracketFromDatabase(tournamentId: number): Promise<TournamentBracket>
    {}

    private static formatDatabaseMatch(match: any, index: number): TournamentMatch
    {}

    private static extractParticipantsFromBracket(bracket: TournamentBracket): TournamentParticipant[]
    {}

    private static getCurrentMatch(bracket: TournamentBracket): any
    {}

    private static getTournamentWinner(bracket: TournamentBracket): string | undefined
    {}

    private static async createNextMatchIfNeeded(tournamentId: number, winner: string, winnerId: number | null): Promise<any>
    {}

    private static async createNextRoundMatch(tournamentId: number, completedCount: number, roundType: 'semi-final' | 'final'): Promise<void>
    {}

    private static shuffleArray<T>(array: T[]): T[]
    {}
}
