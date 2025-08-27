import {FastifyInstance} from "fastify";
import { MatcheController } from "../controllers/matchesController";

export default async function matchesRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.post('/local/create', MatcheController.createLocalMatch);
    app.post('/local/:matchId/finish', MatcheController.finishMatch);

}