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
            const user = req.user!; //grace au middleware
            const participants = req.body as string[];

            const tournament = await TournamentService.createTournament(participants, user.userId);
            
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
     * Route qui recupere un tournois par son id
     */
    static async getTournament(req: FastifyRequest, reply: FastifyReply)
    {
    }

    /**
     * Route qui demare un match dans un tournoi
     */
    static async startMatch(req: FastifyRequest, reply: FastifyReply)
    {
    }

    /**
     * Route qui creer un tournois
     */
    static async finishMatch(req: FastifyRequest, reply: FastifyReply)
    {
    }
}