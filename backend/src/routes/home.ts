import {FastifyInstance} from "fastify";
import { HomeController } from "../controllers/homeController";

export default async function homeRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.get('/stats', HomeController.getGeneralStats);
}
