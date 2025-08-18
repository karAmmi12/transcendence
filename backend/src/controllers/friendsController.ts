import {FastifyRequest, FastifyReply} from "fastify";
import { FriendsService } from "../services/friendsServices";

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
            const { friendId } = req.body as { friendId: number };
            
            if (!friendId) {
                return reply.status(400).send({ error: "Friend ID required" });
            }
            
            const result = await FriendsService.addFriend(user.userId, friendId);
            
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
    }

    /**
     * Route pour supprimer un ami
     */
    static async removeFriend(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour supprimer un ami
    }
}