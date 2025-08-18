import {FastifyInstance} from "fastify";
import { FriendsController } from "../controllers/friendsController.js";

export default async function ufriendsRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware

    app.post('/friends/request', FriendsController.sendFriendRequest)
}