import {FastifyInstance} from "fastify";
import { FriendsController } from "../controllers/friendsController";

export default async function friendsRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware

    //gestions des amis simplifiee
    app.get('/list', FriendsController.getFriendsList);
    app.post('/add', FriendsController.addFriend);
    app.delete('/remove', FriendsController.removeFriend); // '/:friendId
    
}