import db from '../db/index.js';
import {TournamentMatch, TournamentResponse, TournamentParticipant, TournamentBracket} from "../types/tournament.js"

export class TournamentService 
{
    /**
     * service qui creer un tournoi pour 8 participant
     */
    static async createTournament(participants: string[], userId?: number): Promise<TournamentResponse> 
    {
        try {
            let finalParticipants = [...participants];
            const shuffledParticipants = this.shuffleArray(finalParticipants);

            const stmt = db.prepare (`
                INSERT INTO tournaments (status, participants, created_at)
                VALUES ('waiting', ?, datetime('now'))
            `);
    
            const result = stmt.run(JSON.stringify(shuffledParticipants));
            const tournamentId = result.lastInsertRowid as number;
            
            
            
            // creer les participant avec leur type
            const tournamentParticipants: TournamentParticipant[] = shuffledParticipants.map(name =>{
                if (userId)
                {
                    const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
                    const user = userStmt.get(userId) as any;
                    if (user && user.username === name) 
                        return ({
                            name,
                            isUser: true,
                            userId
                        });
                }
                return ({
                    name,
                    isUser: false
                });
            });
    
            // creer le tableau des matchs
            const bracket = this.createBracket(tournamentParticipants);
    
            // Mettre à jour le statut du tournoi à 'in_progress'
            const updateStmt = db.prepare('UPDATE tournaments SET status = ? WHERE id = ?');
            updateStmt.run('in_progress', tournamentId);

            return ({
                success: true,
                message: 'Tournament created successfully',
                tournament: {
                    id: tournamentId,
                    status: 'in_progress',
                    participants: tournamentParticipants,
                    bracket,
                    nextMatch: {
                        id: 1,
                        matchNumber: 1,
                        round: 'Quart de finale 1',
                        player1: bracket.quarterFinals[0].player1!.name,
                        player2: bracket.quarterFinals[0].player2!.name
                    }
                }
            });

        } catch (error) {
            console.error('Error creating tournament:', error);
            throw error;
        }
        

    }

    /**
     * Termine un match de tournoi et avance au suivant
     */
    static async finishTournamentMatch(tournamentId: number, matchNumber: number, player1: string, player2: string, score1: number, score2: number, duration: number, userId?: number): Promise<TournamentResponse>
    {
        // creer match
        const matchStmt = db.prepare(`
            INSERT INTO matches (mode, tournament_id, tournament_match_number, started_at, ended_at)
            VALUES ('tournament', ?, ?, datetime('now', '-' || ? || ' seconds'), datetime('now'))
        `);

        const matchResult = matchStmt.run(tournamentId, matchNumber, duration);
        const matchId = matchResult.lastInsertRowid as number;

        // ajouter participants
        const participantsStmt = db.prepare(`
            INSERT INTO match_participants (match_id, user_id, alias, score, is_winner)
            VALUES (?, ?, ?, ?, ?)    
        `);

        const winner = score1 > score2 ? player1 : player2;

        // player1
        if (userId)
        {
            const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
            const user = userStmt.get(userId) as any;
        
            if (!user || user.username !== player1)
                participantsStmt.run(matchId, null, player1, score1, score1 > score2 ? 1 : 0);
            else
                participantsStmt.run(matchId, userId, null, score1, score1 > score2 ? 1 : 0);
        }

        //player2
        participantsStmt.run(matchId, null, player2, score2, score2 > score1 ? 1 : 0);

        // ✅ Récupérer les informations complètes du tournoi pour le retour unifié
        const tournamentStmt = db.prepare('SELECT participants FROM tournaments WHERE id = ?');
        const tournament = tournamentStmt.get(tournamentId) as any;
        const participants = JSON.parse(tournament.participants) as string[];
        
        const tournamentParticipants: TournamentParticipant[] = participants.map(name => ({
            name,
            isUser: false // Simplification pour l'instant
        }));
        
        const bracket = this.createBracket(tournamentParticipants);

        // Déterminer le prochain match ou fin du tournoi
        if (matchNumber === 7) 
        { // Match final
            const updateTournamentStmt = db.prepare(`
                UPDATE tournaments SET status = 'completed', completed_at = datetime('now') WHERE id = ?
            `);
            updateTournamentStmt.run(tournamentId);
            
            return {
                success: true,
                message: 'Tournament completed!',
                tournament: {
                    id: tournamentId,
                    status: 'completed',
                    participants: tournamentParticipants,
                    bracket,
                    nextMatch: null,
                    winner: winner // ✅ Gagnant final
                }
            };
        }

        // Calculer le prochain match
        const nextMatch = this.calculateNextMatch(tournamentId, matchNumber, winner);
        
        return {
            success: true,
            message: 'Match completed successfully',
            tournament: {
                id: tournamentId,
                status: 'in_progress',
                participants: tournamentParticipants,
                bracket,
                nextMatch
            }
        };
    }

    /****************************************** UTILS *************************************************/
    
    private static shuffleArray<T>(array: T[]): T[] 
    {
        if (array.length <= 1) return [...array];
        
        const shuffled = [...array];
        
        // Garder le premier élément en place (l'utilisateur)
        const firstElement = shuffled[0];
        
        //Extraire les 7 autres éléments (indices 1 à 7)
        const restElements = shuffled.slice(1);
        
        // Mélanger seulement les 7 autres
        for (let i = restElements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [restElements[i], restElements[j]] = [restElements[j], restElements[i]];
        }
        
        // Reconstruire le tableau : premier élément + éléments mélangés
        return [firstElement, ...restElements];
    }

    private static createBracket(participants: TournamentParticipant[]): TournamentBracket 
    {
        // Quarts de finale (matches 1-4)
        const quarterFinals: TournamentMatch[] = [
            {
                id: 1, round: 1, position: 1,
                player1: participants[0], player2: participants[1],
                winner: null, status: 'pending'
            },
            {
                id: 2, round: 1, position: 2,
                player1: participants[2], player2: participants[3],
                winner: null, status: 'pending'
            },
            {
                id: 3, round: 1, position: 3,
                player1: participants[4], player2: participants[5],
                winner: null, status: 'pending'
            },
            {
                id: 4, round: 1, position: 4,
                player1: participants[6], player2: participants[7],
                winner: null, status: 'pending'
            }
        ];

        // Demi-finales (matches 5-6)
        const semiFinals: TournamentMatch[] = [
            {
                id: 5, round: 2, position: 1,
                player1: null, player2: null, // Gagnants matches 1 et 2
                winner: null, status: 'pending'
            },
            {
                id: 6, round: 2, position: 2,
                player1: null, player2: null, // Gagnants matches 3 et 4
                winner: null, status: 'pending'
            }
        ];

        // Finale (match 7)
        const final: TournamentMatch = {
            id: 7, round: 3, position: 1,
            player1: null, player2: null, // Gagnants matches 5 et 6
            winner: null, status: 'pending'
        };

        return { quarterFinals, semiFinals, final };
    }

    private static calculateNextMatch(tournamentId: number, currentMatchNumber: number, winner: string): { id: number; matchNumber: number; round: string; player1: string; player2: string } | null 
    {
        let nextMatchNumber: number | null = null;
        
        // Déterminer le numéro du prochain match
        if (currentMatchNumber <= 2) {
            nextMatchNumber = 5; // Demi-finale 1
        } else if (currentMatchNumber <= 4) {
            nextMatchNumber = 6; // Demi-finale 2
        } else if (currentMatchNumber <= 6) {
            nextMatchNumber = 7; // Finale
        }
        
        if (!nextMatchNumber) return null;
        
        // Vérifier si le prochain match peut être joué
        const requiredMatches = this.getRequiredMatches(nextMatchNumber);
        const completedMatches = this.getCompletedMatches(tournamentId, requiredMatches);
        
        if (completedMatches.length === requiredMatches.length) {
            const participants = this.getMatchParticipants(tournamentId, nextMatchNumber);
            
            return {
                id: nextMatchNumber,
                matchNumber: nextMatchNumber,
                round: this.getMatchRoundName(nextMatchNumber),
                player1: participants.player1,
                player2: participants.player2
            };
        }
        
        return null;
    }

    private static getRequiredMatches(matchNumber: number): number[] 
    {
        if (matchNumber === 5) return [1, 2];
        if (matchNumber === 6) return [3, 4];
        if (matchNumber === 7) return [5, 6];
        return ([]);
    }

    private static getCompletedMatches(tournamentId: number, matchNumbers: number[]): any[] 
    {
        const placeholders = matchNumbers.map(() => '?').join(',');
        const stmt = db.prepare(`
            SELECT tournament_match_number 
            FROM matches 
            WHERE tournament_id = ? AND tournament_match_number IN (${placeholders})
        `);
        
        return stmt.all(tournamentId, ...matchNumbers) as any[];
    }

    private static getMatchParticipants(tournamentId: number, matchNumber: number): { player1: string; player2: string } 
    {
        if (matchNumber <= 4) 
        {
            const stmt = db.prepare(`
                SELECT participants FROM tournaments WHERE id = ?
            `);
            
            const tournament = stmt.get(tournamentId) as any;
            if (!tournament) {
                console.log('Tournament not found for ID:', tournamentId);
                throw new Error('Tournament not found');
            }

            //Parser les participants shufflés
            const participants = JSON.parse(tournament.participants) as string[];

            // ✅ Calculer les indices pour ce match spécifique
            // Match 1: participants[0] vs participants[1]  (indices 0,1)
            // Match 2: participants[2] vs participants[3]  (indices 2,3)
            // Match 3: participants[4] vs participants[5]  (indices 4,5)
            // Match 4: participants[6] vs participants[7]  (indices 6,7)
            const baseIndex = (matchNumber - 1) * 2;

            return {
                player1: participants[baseIndex] || 'Unknown',
                player2: participants[baseIndex + 1] || 'Unknown'
            };
        } else if (matchNumber === 5) {
            // Demi-finale 1: gagnant match 1 vs gagnant match 2
            return this.getWinners(tournamentId, [1, 2]);
        } else if (matchNumber === 6) {
            // Demi-finale 2: gagnant match 3 vs gagnant match 4
            return this.getWinners(tournamentId, [3, 4]);
        } else if (matchNumber === 7) {
            // Finale: gagnant match 5 vs gagnant match 6
            return this.getWinners(tournamentId, [5, 6]);
        }

        throw new Error(`Invalid match number: ${matchNumber}`);
    }

    private static getWinners(tournamentId: number, matchNumbers: number[]): { player1: string; player2: string } 
    {
        const stmt = db.prepare(`
            SELECT COALESCE(mp.alias, u.username) as name
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.id
            LEFT JOIN users u ON mp.user_id = u.id
            WHERE m.tournament_id = ? AND m.tournament_match_number = ? AND mp.is_winner = 1
        `);
        
        const winner1 = stmt.get(tournamentId, matchNumbers[0]) as any;
        const winner2 = stmt.get(tournamentId, matchNumbers[1]) as any;
        
        return {
            player1: winner1?.name || 'TBD',
            player2: winner2?.name || 'TBD'
        };
    }

    private static getMatchRoundName(matchNumber: number): string 
    {
        if (matchNumber <= 4) return `Quart de finale ${matchNumber}`;
        if (matchNumber === 5) return 'Demi-finale 1';
        if (matchNumber === 6) return 'Demi-finale 2';
        if (matchNumber === 7) return 'Finale';
        return 'Match inconnu';
    }

}
