import {FastifyInstance} from "fastify";
import { TournamentController } from "../controllers/tournamentController";
import { createTournamentSchema } from "../schemas/gameSchema";

export default async function tournamentRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.post('/create', TournamentController.createTournament);
    app.post('/:tournamentId/matches/:matchId/finish', TournamentController.finishTournamentMatch);
    // app.get('/:id', TournamentController.getTournament);
}