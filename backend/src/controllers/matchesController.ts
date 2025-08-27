import {FastifyRequest, FastifyReply} from "fastify";
import { MatcheService } from "../services/matchesServices";

export class MatcheController
{
    /**
     * Route pour creer un match simple local
     */
    static async createLocalMatche(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user; //pas de ! car peux etre null  

        } catch (error) {

        }
    }
}