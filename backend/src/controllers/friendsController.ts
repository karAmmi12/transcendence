import {FastifyRequest, FastifyReply} from "fastify";

export class FriendsController
{
    /**
     * Route pour demander qlq en amis
     */
    static async sendFriendRequest(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour envoyer une demande d'ami
    }

    /**
     * Route pour accepter une demande d'ami
     */
    static async acceptFriendRequest(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour accepter une demande d'ami
    }

    /**
     * Route pour rejeter une demande d'ami
     */
    static async rejectFriendRequest(req: FastifyRequest, reply: FastifyReply)
    {
        // Logique pour rejeter une demande d'ami
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