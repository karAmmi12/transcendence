import {FastifyInstance} from "fastify";
import { MatchController } from "../controllers/matchController";

export default async function matchRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.post('/local/create', MatchController.createLocalMatch);
    app.put('/local/:matchId/finish', MatchController.finishLocalMatch);
    // app.get('/:id', MatchController.getLocalMatch);

}