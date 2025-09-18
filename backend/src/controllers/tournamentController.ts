import {FastifyRequest, FastifyReply} from "fastify";
import { TournamentService } from "../services/tournamentServices.js";
import { Logger } from '../utils/logger.js';

export class TournamentController
{
    /**
     * Route qui creer un tournois
     */
    static async createTournament(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user; //peux etrre vide si personne de co
            const {participants, gameSettings} = req.body as {
                participants: string[];
                gameSettings?: {
                    ballSpeed: string;
                    winScore: number;
                    theme: string;
                    powerUps: boolean;
                };
            };

            const tournament = await TournamentService.createTournament(participants, user?.userId, gameSettings);
            
            return (reply.status(201).send({
                success: true,
                message: "Tournament create successfully",
                tournament
            }));

        } catch (error) {
            Logger.error("Create tournament error:", error);
            return reply.status(500).send({ 
                success: false,
                error: "Failed to create tournament" 
            });
        }
    }

    /**
     * Route qui enregistre un match et renvoie le prochain
     */
    static async finishTournamentMatch(req: FastifyRequest, reply: FastifyReply)
    {
        Logger.log("🏆 Processing tournament match finish...");
        try {  
            const user = req.user;
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
        
            const result = await TournamentService.finishTournamentMatch(
                tournamentId, 
                matchNumber, 
                player1, 
                player2, 
                score1, 
                score2, 
                duration, 
                user?.userId
            );

            Logger.log('✅ Tournament service result:', JSON.stringify(result, null, 2));

            // ✅ Retourner la structure complète du tournoi
            return reply.status(200).send(result);

        } catch (error) {
            Logger.error("Finish tournament match error:", error);
            return reply.status(500).send({
                success: false,
                error: "Failed to finish tournament match"
            });
        }
    }
}