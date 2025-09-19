import { FastifyRequest, FastifyReply } from "fastify";
import { UserServices } from "../services/userServices.js";
import { UpdateProfileData, ChangePassword } from "../types/auth.js";
import { StatsService } from "../services/statsServices.js";
import { Logger } from '../utils/logger.js';

export class UserController {
    /**
     * Route getProfile qui recupere toutes les infos user de la db sauf mdp
     */
    static async getProfile(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // assuré par le middleware

            const profile = await UserServices.getUserDataFromDb(user.userId);
            if (!profile)
                return reply.status(404).send({ error: 'User not found' });

            Logger.log("Profile data:", profile);
            reply.send(profile);

        } catch (error) {
            Logger.error("Get profile error:", error);
            reply.status(500).send({ error: "Failed to get profile" });
        }
    }

    /**
     * Route upadate MDP
     */
    static async changePassword(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // grace au middleware
            const changePassword = req.body as ChangePassword;

            Logger.log("Change password request:", changePassword);

            const result = await UserServices.changePassword(user.userId, changePassword);
            if (!result.success)
                return reply.status(404).send({ error: 'update password error' });

            reply.send({ message: result.message });
        } catch (error) {
            Logger.error("Change password error:", error);
            reply.status(500).send({ error: "Failed to change password" });
        }
    }

    /**
     * Routes updateProfile qui peux recevoir des files
     */
    static async updateProfile(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // assurer par middleware

            let updateData: UpdateProfileData = {};

            // Vérifier si c'est du multipart/form-data
            if (req.isMultipart()) {
                const parts = req.parts();

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            const avatarPath = await UserServices.saveAvatarFile(part, user.userId);
                            updateData.avatarUrl = avatarPath;
                        } catch (avatarError) {
                            throw avatarError;
                        }
                    } else if (part.type === 'field') {
                        const value = part.value as string;

                        if (part.fieldname === 'username' && value.trim()) {
                            // Validation du username
                            const username = value.trim();
                            if (username.length < 3) {
                                return reply.status(400).send({ error: "Username must be at least 3 characters long" });
                            }
                            if (username.length > 20) {
                                return reply.status(400).send({ error: "Username must be at most 20 characters long" });
                            }
                            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                                return reply.status(400).send({ error: "Username can only contain letters, numbers and underscores" });
                            }
                            updateData.username = username;
                        } else if (part.fieldname === 'email' && value.trim()) {
                            // Validation de l'email
                            const email = value.trim();
                            if (email.length > 255) {
                                return reply.status(400).send({ error: "Email is too long" });
                            }
                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                                return reply.status(400).send({ error: "Invalid email format" });
                            }
                            updateData.email = email;
                        }
                    }
                }
            }

            // Vérifier qu'au moins un champ est fourni
            if (!updateData.username && !updateData.email && !updateData.avatarUrl) {
                return reply.status(400).send({ error: "No update data provided" });
            }

            const result = await UserServices.updateUserProfile(user.userId, updateData);

            if (!result.success) {
                return reply.status(400).send({ error: result.error });
            }

            reply.send({
                message: "User profile updated successfully",
                user: result.user
            });

        } catch (error) {
            Logger.error("Update profile controller error:", error);
            reply.status(500).send({ error: "Failed to update profile" });
        }
    }

    /**
     * Récupérer tous les utilisateurs (debug)
     */
    static async getAllUsernames(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // grace au middleware
            const users = await UserServices.getAllUsernames(user.userId);
            reply.send(users);
        } catch (error) {
            Logger.error("Get all users controller error:", error);
            reply.status(500).send({ error: "Failed to get users" });
        }
    }

    /**
     * Recherche d'utilisateurs par nom d'utilisateur
     */
    static async searchUsers(req: FastifyRequest, reply: FastifyReply) {
        try {
            const query = (req.query as any).q;

            if (!query || query.length < 2) {
                return reply.status(400).send({ error: "Query must be at least 2 characters long" });
            }

            const users = await UserServices.searchUsers(query);
            reply.send(users);
        } catch (error) {
            Logger.error("Search users controller error:", error);
            reply.status(500).send({ error: "Failed to search users" });
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    static async getProfileById(req: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = req.params as { id: string };
            const userId = parseInt(id);

            const user = await UserServices.getUserDataFromDb(userId);

            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }

            reply.send(user);
        } catch (error) {
            Logger.error("Get user by ID error:", error);
            reply.status(500).send({ error: "Failed to get user" });
        }
    }

    /**
     * Recupere l'historique des matches d'un user
     */
    static async getMyMatchHistory(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // grace au middleware
            const limit = 10 as number;

            const history = StatsService.getUserMatchHistory(user.userId, limit);

            reply.send(history);

        } catch (error) {
            Logger.error("Get match history error:", error);
            reply.status(500).send({ error: "Failed to get match history" });
        }
    }

    /**
     * Route pour mettre à jour le thème par défaut de l'utilisateur
     */
    static async updateTheme(req: FastifyRequest, reply: FastifyReply) {
        try {
            const user = req.user!; // assuré par le middleware
            const { theme } = req.body as { theme: string };

            const result = await UserServices.updateTheme(user.userId, theme);
            if (!result.success) 
                return reply.status(404).send({ error: 'update theme error' });

            reply.send({
                message: result.message,
                user: result.user
            });

        } catch (error) {
            Logger.error("Update theme error:", error);
            reply.status(500).send({ error: "Failed to update theme" });
        }
    }
}