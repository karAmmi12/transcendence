import {FastifyInstance} from "fastify";
import { TournamentController } from "../controllers/tournamentController";
import { createTournamentSchema } from "../schemas/gameSchema";

export default async function tournamentRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.post('/create', {schema: createTournamentSchema}, TournamentController.createTournament);
    app.get('/:id', TournamentController.getTournament);
    app.post('/:tournamentId/matches/:matchId/start',TournamentController.startMatch);
    app.post('/:tournamentId/matches/:matchId/finish',TournamentController.finishMatch);

    // siuuu peut etre ajouter :
    // getActiveTournament
    // getTournamenHistory
    // deleteTournament
}