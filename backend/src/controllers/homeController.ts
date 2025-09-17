import {FastifyRequest, FastifyReply} from "fastify";
import { HomeService } from "../services/homeServices.js";

export class HomeController
{
    /**
     * Route qui recupere les stats general (nb total de user, de matches, de tournois et nb de joeur online)
     */
    static async getGeneralStats(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const stats = HomeService.getHomeStats();
                        
            reply.send(stats);
        } catch (error) {
            console.error("Get general stats error:", error);
            reply.status(500).send({ error: "Failed to get general stats" });
        }
    }
}