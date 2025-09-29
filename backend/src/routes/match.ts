import {FastifyInstance} from "fastify";
import { MatchController } from "../controllers/matchController.js";

export default async function matchRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.post('/local', MatchController.registerLocalMatch);
    app.post('/remote', MatchController.registerRemoteMatch);
}