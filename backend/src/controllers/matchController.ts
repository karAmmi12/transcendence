import {FastifyRequest, FastifyReply} from "fastify";
import { MatchService } from "../services/matchServices";

export class MatchController
{
    /**
     * route pour en registrer un match local terminer
     */
    static async registerLocalMatch(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user; //pas de ! car peux etre null 
            
            const {player1, player2, score1, score2, duration} = req.body as {player1: string; player2: string, score1: number, score2: number, duration: number};
            if (!player1 || !player2)
            {
                return (reply.status(400).send({
                    success: false,
                    error: "both player required"
                }))
            }
            
            const match = await MatchService.createLocalMatch(player1, player2, score1, score2, duration, user?.userId);

            return (reply.status(200).send({
                success: true,
                message: "local match register",
                match
            }));

        } catch (error) {
            console.error("Register local match error:", error);
            return (reply.status(500).send({
                success: false,
                error: "Failed to register match"
            }));
        }
    }

}