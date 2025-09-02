import {FastifyRequest, FastifyReply} from "fastify";
import { TournamentService } from "../services/tournamentServices";

export class TournamentController
{
    /**
     * Route qui creer un tournois
     */
    static async createTournament(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user; //peux etrre vide si personne de co
            const {participants} = req.body as {participants: string[]};

            const tournament = await TournamentService.createTournament(participants, user?.userId);
            
            return (reply.status(201).send({
                success: true,
                message: "Tournament create successfully",
                tournament
            }));

        } catch (error) {
            console.error("Create tournament error:", error);
            return reply.status(500).send({ 
                success: false,
                error: "Failed to create tournament" 
            });
        }
    }

    /**
     * Route qui enrigistre un match et renvoi le prochain
     */
    static async finishTournamentMatch(req: FastifyRequest, reply: FastifyReply)
    {
        try {  
            const user = req.user; // peux etre vide si personne de co
            const { tournamentId, matchNumber, player1, player2, score1, score2, duration } = req.body as {
                tournamentId: number;
                matchNumber: number;
                player1: string;
                player2: string;
                score1: number;
                score2: number;
                duration: number;
            };

            // Validation des paramètres requis
            if (!tournamentId || !matchNumber || !player1 || !player2 || score1 === undefined || score2 === undefined || !duration) {
                return reply.status(400).send({
                    success: false,
                    error: "Missing required parameters"
                });
            }
        
            const nextMatch = await TournamentService.finishTournamentMatch(
                tournamentId, 
                matchNumber, 
                player1, 
                player2, 
                score1, 
                score2, 
                duration, 
                user?.userId
            );

            return (reply.status(200).send({
                success: true,
                message: "Tournament match finished successfully",
                nextMatch
            }));

        } catch (error) {
            console.error("Finish tournament match error:", error);
            return (reply.status(500).send({
                success: false,
                error: "Failed to finish tournament match"
            }));
        }
    }
}