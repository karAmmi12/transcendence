import {FastifyRequest, FastifyReply} from "fastify";
import { FriendsService } from "../services/friendsService";

export class FriendsController 
{
    /**
     * envoyer une demande d'amis
     */
    static async sendFriendRequest(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; //grace au middleware
            
            const { friendId } = req.body as { friendId: number };
            if (!friendId)
                return (reply.status(400).send({error: "freind id required"}));
            
            const result = await FriendsService.sendFriendRequest(user.userId, friendId);
            if (!result.success)
                return (reply.status(400).send({error: result.error}));

            reply.send({
                message: "Friend request sent successfully",
                data: result.data
            });

        } catch (error) {
            console.error("Send friend request error:", error);
            reply.status(500).send({ error: "Failed to send friend request" });
        }
    }
}