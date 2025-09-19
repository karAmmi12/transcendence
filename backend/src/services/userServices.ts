import db from '../db/index.js'
import bcrypt from "bcrypt";
import {UserData, UpdateProfileData, UpdateResult} from "../types/auth.js"
import { StatsService } from './statsServices.js';
import { serialize } from '../utils/serialize.js';
import { ChangePassword } from "../types/auth.js";
import { Logger } from '../utils/logger.js';

export class UserServices
{
    /**
     * sous fonction qui recupere les infos du user depuis la db
     */
    static async getUserDataFromDb(userId: number): Promise <UserData | null>
    {
        const stmt = db.prepare(`
                SELECT id, username, email, avatar_url, theme, created_at, last_login, is_online, google_id, two_factor_enabled
                FROM users WHERE id = ?
            `);
        const userDataRaw = stmt.get(userId) as any | undefined;
        if (!userDataRaw)
            return (null);

        const userData = serialize(userDataRaw);
        const stats = StatsService.getUserStats(userId);

        const userProfile: UserData = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatarUrl: userData.avatarUrl,
            theme: userData.theme,
            isOnline: userData.isOnline,
            twoFactorEnabled: userData.twoFactorEnabled,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin,
            googleId: userData.googleId,
            stats: stats
        }
        Logger.log("User profile retrieved:", userProfile);
        return (userProfile);
    }

    /**
     * Sous fonction qui gere l'update des infos user
     */
    static async updateUserProfile(userId: number, updateData: UpdateProfileData): Promise<UpdateResult>
    {
        const transaction = db.transaction(() =>
        {
            try {
                // check dans db si deja present (en excluant l'utilisateur actuel)
                if (updateData.username)
                {
                    const stmt = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?");
                    const existingUser = stmt.get(updateData.username, userId);
                    if (existingUser)
                        throw new Error("Username already taken");
                }
                if (updateData.email)
                {
                    const stmt = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                    const existingUser = stmt.get(updateData.email, userId);
                    if (existingUser)
                        throw new Error("Email already taken");
                }

                //Preparation de la maj de la db
                const fieldsToUpdate:string[] = [];
                const values : any[] = [];

                if (updateData.username)
                {
                    fieldsToUpdate.push("username = ?");
                    values.push(updateData.username);
                }
                if (updateData.email)
                {
                    fieldsToUpdate.push("email = ?");
                    values.push(updateData.email);
                }
                if (updateData.avatarUrl !== undefined) //mettre null/vide 
                {
                    fieldsToUpdate.push("avatar_url = ?");
                    values.push(updateData.avatarUrl);
                }
                if (updateData.theme !== undefined) 
                {
                    fieldsToUpdate.push("theme = ?");
                    values.push(updateData.theme);
                }
                if (fieldsToUpdate.length === 0)
                        throw new Error("No fields to update");
                values.push(userId);

                const updateQuery = `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
                const updateStmt = db.prepare(updateQuery);
                const result = updateStmt.run(...values);
                if (result.changes === 0)
                    throw ("User not found");

                // Maj de la db reussi recup les nouvelle donnees
                const selectStmt = db.prepare(`
                    SELECT id, username, email, avatar_url, theme, created_at, last_login, is_online, google_id, two_factor_enabled
                    FROM users WHERE id = ?
                `);

                const updatedUserRaw = selectStmt.get(userId) as any;
                if (!updatedUserRaw)
                    throw new Error("Failed to retrieve updated user data");

                //GRRRRRR
                const updatedUser = serialize(updatedUserRaw);
                const stats = StatsService.getUserStats(userId);

                const formattedUser: UserData = {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    avatarUrl: updatedUser.avatarUrl,
                    theme: updatedUser.theme,
                    isOnline: updatedUser.isOnline,
                    twoFactorEnabled: updatedUser.twoFactorEnabled,
                    createdAt: updatedUser.createdAt,
                    lastLogin: updatedUser.lastLogin,
                    googleId: updatedUser.googleId,
                    stats: stats
                };

                return {
                    success: true,
                    user: formattedUser
                };
            } catch (error) {
                Logger.error("Transaction error:", error);
                throw error; 
            };
        });
        try {
            return (transaction() as UpdateResult);
        } catch (error) {
            Logger.error("Update profile error:", error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Sous fonction qui recupere tous les users
     */
    static async getAllUsernames(userId: number): Promise<UserData[]>
    {
        try {
            const stmt = db.prepare(`
                SELECT id, username, avatar_url, is_online
                FROM users
                WHERE id != ?
                ORDER BY username ASC
            `);
            
            const usersRaw = stmt.all(userId) as any[];
            
            // pour attacher les stats temporaire a tous les users
            const users: UserData[] = usersRaw.map(userRaw => {
                const userData = serialize(userRaw);
                const stats = StatsService.getUserStats(userData.id);
                
                return {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    avatarUrl: userData.avatarUrl,
                    isOnline: userData.isOnline,
                    twoFactorEnabled: false,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin,
                    googleId: userData.googleId,
                    stats: stats
                };
            });
            
            return users;
            
        } catch (error) {
            Logger.error("Get all users error:", error);
            return [];
        }
    }

    /**
     * Sous fonction qui recherche les users par nom d'utilisateur
     */
    static async searchUsers(query: string): Promise<UserData[]> {
        try {
            const stmt = db.prepare(`
                SELECT id, username, email, avatar_url, created_at, last_login, is_online
                FROM users
                WHERE username LIKE ? OR email LIKE ?
                ORDER BY username ASC
                LIMIT 20
            `);
            
            const searchPattern = `${query}%`;
            const usersRaw = stmt.all(searchPattern, searchPattern) as any[];
            
            const users: UserData[] = usersRaw.map(userRaw => {
                const userData = serialize(userRaw);
                const stats = StatsService.getUserStats(userData.id);
                
                return {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    avatarUrl: userData.avatarUrl,
                    isOnline: userData.isOnline,
                    twoFactorEnabled: false,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin,
                    googleId: userData.googleId,
                    stats: stats
                };
            });
            
            return users;
            
        } catch (error) {
            Logger.error("Search users error:", error);
            return [];
        }
    }

    /**
     * Change user password with validation
     */
    static async changePassword(userId: number, changePassword: ChangePassword): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            if (changePassword.currentPassword === changePassword.newPassword) {
                return { success: false, error: "New password need to be different from old password" };
            }

            if (changePassword.newPassword.length < 8) {
                return { success: false, error: "Password must be 8 character long" };
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(changePassword.newPassword)) {
                return { success: false, error: "Password must contain 1 lower case, 1 upper case, 1 number, 1 symbole" };
            }

            const stmt = db.prepare("SELECT password FROM users WHERE id = ?");
            const dbPassword = stmt.get(userId) as { password: string } | undefined;
            if (!dbPassword) {
                return { success: false, error: "User not found" };
            }

            const isCurrentPasswordValid = await bcrypt.compare(changePassword.currentPassword, dbPassword.password);
            if (!isCurrentPasswordValid) {
                return { success: false, error: "Current password incorrect" };
            }

            const hashedNewPassword = await bcrypt.hash(changePassword.newPassword, 10);
            const updateStmt = db.prepare("UPDATE users SET password = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?");
            const result = updateStmt.run(hashedNewPassword, userId);
            if (result.changes === 0) {
                return { success: false, error: "Failed update password" };
            }

            return { success: true, message: "Password update success" };
        } catch (error) {
            Logger.error("Change password service error:", error);
            return { success: false, error: "Internal error" };
        }
    }

    /**
     * Save avatar file and handle old file cleanup
     */
    static async saveAvatarFile(part: any, userId: number): Promise<string> {
        const fs = await import('fs/promises');
        const path = await import('path');

        // Validation du fichier
        if (!part.mimetype?.startsWith('image/')) {
            throw new Error('Invalid file type. Only images are allowed.');
        }

        // Taille max 5MB
        const maxSize = 5 * 1024 * 1024;
        let fileSize = 0;

        // Récupérer et supprimer l'ancien avatar
        try {
            const stmt = db.prepare("SELECT avatar_url FROM users WHERE id = ?");
            const currentUser = stmt.get(userId) as any;

            if (currentUser?.avatar_url) {
                const oldAvatarPath = path.join(process.cwd(), currentUser.avatar_url.replace(/^\//, ''));

                try {
                    await fs.access(oldAvatarPath);
                    await fs.unlink(oldAvatarPath);
                    Logger.log(`Ancien avatar supprimé: ${oldAvatarPath}`);
                } catch (error) {
                    Logger.log(`Ancien avatar non trouvé ou déjà supprimé: ${oldAvatarPath}`);
                }
            }
        } catch (error) {
            Logger.error('Erreur lors de la suppression de l\'ancien avatar:', error);
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
     * Update user theme with validation
     */
    static async updateTheme(userId: number, theme: string): Promise<{ success: boolean; message?: string; error?: string; user?: any }> {
        try {
            const validThemes = ['classic', 'neon', 'retro', 'cyberpunk', 'space', 'italian', 'matrix', 'lava'];
            if (!theme || !validThemes.includes(theme)) {
                return { success: false, error: "Invalid theme. Valid themes are: " + validThemes.join(', ') };
            }

            const stmt = db.prepare("UPDATE users SET theme = ? WHERE id = ?");
            const result = stmt.run(theme, userId);

            if (result.changes === 0) {
                return { success: false, error: "User not found" };
            }

            const userStmt = db.prepare("SELECT id, username, email, avatar_url, theme, is_online, two_factor_enabled, created_at FROM users WHERE id = ?");
            const updatedUser = userStmt.get(userId) as any;

            return {
                success: true,
                message: "Theme updated successfully",
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    avatarUrl: updatedUser.avatar_url,
                    theme: updatedUser.theme,
                    isOnline: Boolean(updatedUser.is_online),
                    twoFactorEnabled: Boolean(updatedUser.two_factor_enabled),
                    createdAt: updatedUser.created_at
                }
            };
        } catch (error) {
            Logger.error("Update theme service error:", error);
            return { success: false, error: "Internal error" };
        }
    }
}
