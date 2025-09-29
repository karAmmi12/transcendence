import {FastifyInstance} from "fastify";
import { FriendsController } from "../controllers/friendsController.js";

export default async function friendsRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.get('/list', FriendsController.getFriendsList);
    app.post('/add', FriendsController.addFriend);
    app.delete('/remove/:friendId', FriendsController.removeFriend); // '/:friendId
}