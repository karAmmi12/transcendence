import {FastifyInstance} from "fastify";
import { FriendsController } from "../controllers/friendsController";

export default async function friendsRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.get('/friends/request', FriendsController.sendFriendRequest);
    app.get('/friends/accept', FriendsController.acceptFriendRequest);
    app.get('/friends/reject', FriendsController.rejectFriendRequest);
    app.get('/friends/list', FriendsController.getFriendsList);
    app.get('/friends/remove', FriendsController.removeFriend);
}