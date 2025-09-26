import {FastifyRequest, FastifyReply} from "fastify";
import { FriendsService } from "../services/friendsServices.js";

export class FriendsController
{
    /**
     * Route pour ajouter une demande d'ami
     */
    static async addFriend(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour ajouter une demande d'ami
        try {
            const user = req.user!;
            const { userId } = req.body as { userId: number };// friend a ajouter

            if (!userId) {
                return reply.status(400).send({ error: "Friend ID required" });
            }
            
            const result = await FriendsService.addFriend(user.userId, userId);
            
            if (!result.success) {
                return reply.status(400).send({ error: result.error });
            }

            reply.send({
                message: "Friend added successfully",
                data: result.data
            });

        } catch (error) {
            console.error("Add friend error:", error);
            reply.status(500).send({ error: "Failed to add friend" });
        }
    }

    /**
     * Route pour obtenir la liste des amis
     */
    static async getFriendsList(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour obtenir la liste des amis
        try {
            const user = req.user!;
            const friends = await FriendsService.getFriendsList(user.userId);
            reply.send(friends);

        } catch (error) {
            console.error("Get friends list error:", error);
            reply.status(500).send({ error: "Failed to get friends list" });
        }
        
    }

    /**
     * Route pour supprimer un ami
     */
    static async removeFriend(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour supprimer un ami
        try {
            const user = req.user!;
            const { friendId } = req.params as { friendId: string };

            const result = await FriendsService.removeFriend(user.userId, parseInt(friendId));

            if (!result.success) {
                return reply.status(400).send({ error: result.error });
            }

            reply.send({ message: "Friend removed successfully" });

        } catch (error) {
            console.error("Remove friend error:", error);
            reply.status(500).send({ error: "Failed to remove friend" });
        }
    }
}