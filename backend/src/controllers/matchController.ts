import {FastifyRequest, FastifyReply} from "fastify";
import { MatchService } from "../services/matchServices";

export class MatchController
{
    /**
     * Route pour creer un match simple local
     */
    static async createLocalMatch(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user; //pas de ! car peux etre null 
            
            const {player1, player2}=req.body as {player1: string; player2: string};
            if (!player1 || !player2)
            {
                return (reply.status(400).send({
                    success: false,
                    error: "both player required"
                }))
            }
            
            const match = await MatchService.createLocalMatch(player1, player2, user?.userId);

            return (reply.status(200).send({
                success: true,
                message: "local match create",
                match
            }));

        } catch (error) {
            console.error("Create local match error:", error);
            return (reply.status(500).send({
                success: false,
                error: "Failed to create match"
            }));
        }
    }

    /**
     * ROute pour finir un match simple local 
     */
    static async finishLocalMatch(req: FastifyRequest, reply: FastifyReply)
    {
        //siuu a faire
    }

}