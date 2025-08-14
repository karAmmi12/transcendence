import {FastifyRequest, FastifyReply} from "fastify";
import { UserServices } from "../services/userServices";
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
     * Siuuu
     * Route updateProfile - Mise à jour du profil utilisateur
     * Permet de modifier username, email et/ou avatar_url
     * Si une modification échoue, aucune n'est appliquée
     */
    // static async updateProfile(req: FastifyRequest, reply: FastifyReply)
    // {
    //     try {
    //         const user = req.user!; //assurer par le middleware 
    //         const updateData = req.body as UpdateProfileData;

    //         if (!updateData.username && !updateData.email && !updateData.avatar_url)
    //             return (reply.status(400).send({error: "No update element as been given"}));

    //         const result = await userServices.updateUserProfile(user.userId, updateData);
    //         if(!result.success)
    //             return (reply.status(400).send({error: result.error}));

    //         reply.send({
    //             message: "User profile updated",
    //             user: result.user
    //         });

    //     } catch (error) {
    //         console.error("Update profile controller error:", error);
    //         reply.status(500).send({error: "Failed to update profile"});
    //     }
    // }



//SIUUUUUUUU TEST 
/**
 * Routes updateProfile qui peux recevoir des files
 */
static async updateProfile(req: FastifyRequest, reply: FastifyReply)
{
    try {
        console.log('=== UPDATE PROFILE START ===');
        const user = req.user!; // assurer par middleware
        console.log('User ID:', user.userId);
        
        let updateData: UpdateProfileData = {};

        // Vérifier si c'est du multipart/form-data
        if (req.isMultipart()) {
            console.log('Processing multipart data...');
            const parts = req.parts();
            
            for await (const part of parts) {
                console.log('Processing part:', part.fieldname, 'type:', part.type);
                
                if (part.type === 'file' && part.fieldname === 'avatar') {
                    console.log('Processing avatar file...');
                    try {
                        const avatarPath = await UserController.saveAvatarFile(part, user.userId);
                        updateData.avatar_url = avatarPath;
                        console.log('Avatar saved to:', avatarPath);
                    } catch (avatarError) {
                        console.error('Avatar save error:', avatarError);
                        throw avatarError;
                    }
                } else if (part.type === 'field') {
                    const value = part.value as string;
                    console.log(`Field ${part.fieldname}:`, value);
                    
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
        } else {
            console.log('Not multipart data');
        }

        console.log('Final updateData:', updateData);

        // Vérifier qu'au moins un champ est fourni
        if (!updateData.username && !updateData.email && !updateData.avatar_url) {
            console.log('No update data provided');
            return reply.status(400).send({ error: "No update data provided" });
        }

        console.log('Calling UserServices.updateUserProfile...');
        const result = await UserServices.updateUserProfile(user.userId, updateData);
        console.log('Service result:', result);
        
        if (!result.success) {
            console.error('Service error:', result.error);
            return reply.status(400).send({ error: result.error });
        }

        console.log('=== UPDATE PROFILE SUCCESS ===');
        reply.send({
            message: "User profile updated successfully",
            user: result.user
        });

    } catch (error) {
        console.error("=== UPDATE PROFILE ERROR ===");
        console.error("Update profile controller error:", error);
        reply.status(500).send({ error: "Failed to update profile" });
    }
}

/**
 * Sauvegarde le fichier avatar et retourne le chemin
 */
private static async saveAvatarFile(part: any, userId: number): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Validation du fichier
    if (!part.mimetype?.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
    }
    
    // Taille max 5MB
    const maxSize = 5 * 1024 * 1024;
    let fileSize = 0;
    
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


}