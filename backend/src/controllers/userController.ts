import {FastifyRequest, FastifyReply} from "fastify";
import { UserServices } from "../services/userServices";
import { UpdateProfileData, ChangePassword} from "../types/auth";
import db from "../db/index.js"
import bcrypt from "bcrypt"

export class UserController
{
    /**
     * Route getProfile qui recupere toutes les infos user de la db sauf mdp
     */
    static async getProfile(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; //assurer par le middleware 

            const profile = await UserServices.getUserDataFromDb(user.userId);
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
     * Route upadate MDP
     */
    static async changePassword(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; // grace au middleware
            const changePassword = req.body as ChangePassword;

            console.log("Change password request:", changePassword);

            if (changePassword.currentPassword === changePassword.newPassword)
                return (reply.status(400).send({error: "New password need to be different from old password"}));

            if (changePassword.newPassword.length < 8)
                return (reply.status(400).send({error: "Password must be 8 character long"}));

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(changePassword.newPassword))
                return (reply.status(400).send({error: "Password must contain 1 lower case, 1 upper case, 1 number, 1 symbole"}));

            const stmt = db.prepare("SELECT password FROM users WHERE id = ?");
            const dbPassword = stmt.get(user.userId) as {password:string} | undefined;
            if (!dbPassword)
                return (reply.status(400).send({error: "User not found"}));

            const isCurrentPasswordValid = await bcrypt.compare(changePassword.currentPassword, dbPassword.password)
            if (!isCurrentPasswordValid)
                return (reply.status(400).send({error: "Current passWord incorrect"}));
            
            const hashedNewPassword = await bcrypt.hash(changePassword.newPassword, 10);

            const updateStmt = db.prepare("UPDATE users SET password = ?, lastLogin = CURRENT_TIMESTAMP WHERE id = ?");
            const result = updateStmt.run(hashedNewPassword, user.userId);
            if (result.changes === 0)
                return (reply.status(500).send({error: "Failed update password"}));

            reply.send({message: "Password upadte success"});
        } catch (error) {
            console.error("Change password error:", error);
            reply.status(500).send({ error: "Failed to change password" });
        }
    }


    /**
     * Routes updateProfile qui peux recevoir des files
     */
    static async updateProfile(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const user = req.user!; // assurer par middleware

            let updateData: UpdateProfileData = {};

            // Vérifier si c'est du multipart/form-data
            if (req.isMultipart()) {
                const parts = req.parts();

                for await (const part of parts) {

                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            const avatarPath = await UserController.saveAvatarFile(part, user.userId);
                            updateData.avatar_url = avatarPath;
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
            if (!updateData.username && !updateData.email && !updateData.avatar_url) {
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
            console.error("Update profile controller error:", error);
            reply.status(500).send({ error: "Failed to update profile" });
        }
    }

    /**
     * Sauvegarde le fichier avatar et retourne le chemin
     */
    private static async saveAvatarFile(part: any, userId: number): Promise<string> 
    {
        const fs = await import('fs/promises');
        const path = await import('path');

        // Validation du fichier
        if (!part.mimetype?.startsWith('image/')) {
            throw new Error('Invalid file type. Only images are allowed.');
        }

        // Taille max 5MB
        const maxSize = 5 * 1024 * 1024;
        let fileSize = 0;

        // 🗑️ NOUVEAU : Récupérer et supprimer l'ancien avatar
        try {
            const stmt = db.prepare("SELECT avatar_url FROM users WHERE id = ?");
            const currentUser = stmt.get(userId) as any;

            if (currentUser?.avatar_url) {
                const oldAvatarPath = path.join(process.cwd(), currentUser.avatar_url.replace(/^\//, ''));

                // Vérifier que le fichier existe avant de le supprimer
                try {
                    await fs.access(oldAvatarPath);
                    await fs.unlink(oldAvatarPath);
                    console.log(`Ancien avatar supprimé: ${oldAvatarPath}`);
                } catch (error) {
                    console.log(`Ancien avatar non trouvé ou déjà supprimé: ${oldAvatarPath}`);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'ancien avatar:', error);
            // Continue même si la suppression échoue
        }

        // Créer le dossier uploads s'il n'existe pas
        const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Générer un nom de fichier unique
        const fileExtension = part.mimetype.split('/')[1];
        const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Sauvegarder le fichier
        const writeStream = await fs.open(filePath, 'w');

        try {
            for await (const chunk of part.file) {
                fileSize += chunk.length;
                if (fileSize > maxSize) {
                    await writeStream.close();
                    await fs.unlink(filePath);
                    throw new Error('File too large. Maximum size is 5MB.');
                }
                await writeStream.write(chunk);
            }
        } finally {
            await writeStream.close();
        }

        // Retourner le chemin relatif pour la DB
        return `/uploads/avatars/${fileName}`;
    }

    /**
     * Récupérer tous les utilisateurs (debug)
     */
    static async getAllUsernames(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const user = req.user!; //grace au middleware
            const users = await UserServices.getAllUsernames(user.userId);
            reply.send(users);
        } catch (error) {
            console.error("Get all users controller error:", error);
            reply.status(500).send({ error: "Failed to get users" });
        }
    }

    /**
     * Recherche d'utilisateurs par nom d'utilisateur
     */
    static async searchUsers(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const query = (req.query as any).q;
            
            if (!query || query.length < 2) {
                return reply.status(400).send({ error: "Query must be at least 2 characters long" });
            }

            const users = await UserServices.searchUsers(query);
            reply.send(users);
        } catch (error) {
            console.error("Search users controller error:", error);
            reply.status(500).send({ error: "Failed to search users" });
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    static async getProfileById(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const { id } = req.params as { id: string };
            const userId = parseInt(id);

            const user = await UserServices.getUserDataFromDb(userId);

            
            if (!user) {
                return reply.status(404).send({ error: "User not found" });
            }

            reply.send(user);
        } catch (error) {
            console.error("Get user by ID error:", error);
            reply.status(500).send({ error: "Failed to get user" });
        }
    }
}

