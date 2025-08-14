import {FastifyRequest, FastifyReply} from "fastify";
import { userServices } from "../services/userServices";
import { UpdateProfileData } from "../types/auth";

export class UserController
{
    /**
     * Route getProfile qui recupere toutes les infos user de la db sauf mdp
     */
    static async getProfile(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; //assurer par le middleware 

            const profile = await userServices.getUserDataFromDb(user.userId);
            if (!profile)
                return (reply.status(404).send({ error: 'User not found' }));

            console.log("Profile data:", profile);
            reply.send(profile);

        } catch (error) {
            console.error("Get profile error:", error);
            reply.status(500).send({ error: "Failed to get profile" });
        }
    }

    /**
     * Siuuu
     * Route updateProfile - Mise à jour du profil utilisateur
     * Permet de modifier username, email et/ou avatar_url
     * Si une modification échoue, aucune n'est appliquée
     */
    static async updateProfile(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; //assurer par le middleware 
            const updateData = req.body as UpdateProfileData;

            if (!updateData.username && !updateData.email && !updateData.avatar_url)
                return (reply.status(400).send({error: "No update element as been given"}));

            const result = await userServices.updateUserProfile(user.userId, updateData);
            if(!result.success)
                return (reply.status(400).send({error: result.error}));

            reply.send({
                message: "User profile updated",
                user: result.user
            });

        } catch (error) {
            console.error("Update profile controller error:", error);
            reply.status(500).send({error: "Failed to update profile"});
        }
    }

}