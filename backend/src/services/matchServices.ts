import db from '../db/index.js';

// services/matchService.ts (plus tard)
export class MatchService {
    // Ces méthodes seront identiques à celles du tournoi :
    static async createLocalMatch(player1: string, player2: string, userId?: number) {
        // Même logique que createQuarterFinals mais pour 1 seul match
    }

    static async finishLocalMatch(matchId: number, winner: string, scores: any) {
        // Exactement la même logique que finishMatch du tournoi
        // Juste sans la partie createNextMatchIfNeeded
    }

    static async getMatch(matchId: number) {
        // Même logique que formatDatabaseMatch
    }
}