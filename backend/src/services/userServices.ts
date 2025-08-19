import db from '../db/index.js'
import {UserData, AuthenticatedUser, UpdateProfileData, UpdateResult} from "../types/auth.js"
import {checkUsernameExists, checkEmailExists} from "./authServices.js"

export class UserServices
{
    /**
     * sous fonction qui recupere les infos du user depuis la db
     */
    static async getUserDataFromDb(userId: number): Promise <UserData | null>
    {
        const stmt = db.prepare(`
                SELECT id, username, email, avatar_url, createdAt, lastLogin, is_online
                FROM users WHERE id = ?
            `);
        const userData = stmt.get(userId) as any | undefined;
        if (!userData)
            return (null);

        const stats = { //siuuu stats temporaire avant de faire les tables matches
                wins: 2,
                losses: 0,
                totalGames: 2,
                winRate: 100 // (wins/ totalGames) * 100
            }
        
        const userProfile: UserData = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar_url: userData.avatar_url,
            isOnline: userData.is_online,
            twoFactorEnabled: userData.twoFactorEnabled,
            createdAt: userData.createdAt,
            stats: stats
        }
        
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
                if (updateData.avatar_url !== undefined) //mettre null/vide 
                {
                    fieldsToUpdate.push("avatar_url = ?");
                    values.push(updateData.avatar_url);
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
                    SELECT id, username, email, avatar_url, createdAt, lastLogin, is_online
                    FROM users WHERE id = ?
                `);

                const updatedUserRaw = selectStmt.get(userId) as any;
                if (!updatedUserRaw)
                    throw new Error("Failed to retrieve updated user data");

                const stats = { // Stats temporaires
                    wins: 2,
                    losses: 0,
                    totalGames: 2,
                    winRate: 100
                };
                const formattedUser: UserData = {
                    id: updatedUserRaw.id,
                    username: updatedUserRaw.username,
                    email: updatedUserRaw.email,
                    avatar_url: updatedUserRaw.avatar_url,
                    isOnline: updatedUserRaw.is_online,
                    twoFactorEnabled: false,
                    createdAt: updatedUserRaw.createdAt,
                    lastLogin: updatedUserRaw.lastLogin,
                    stats: stats
                };

                return {
                    success: true,
                    user: formattedUser
                };
            } catch (error) {
                console.error("Transaction error:", error);
                throw error; //siuu Propager l'erreur pour rollback
            };
        });
        try {
            return (transaction() as UpdateResult);
        } catch (error) {
            console.error("Update profile error:", error);
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
                SELECT id, username, avatar_url,is_online
                FROM users
                WHERE id != ?
                ORDER BY username ASC
            `);
            
            const usersRaw = stmt.all(userId) as any[];
            
            //siuuu pour attacher els stats temporaire a tous les users
            const users: UserData[] = usersRaw.map(userData => {
                const stats = { // Stats temporaires
                    wins: 2,
                    losses: 0,
                    totalGames: 2,
                    winRate: 100
                };
                
                return {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    avatar_url: userData.avatar_url,
                    isOnline: userData.is_online,
                    twoFactorEnabled: false,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin,
                    stats: stats
                };
            });
            
            return users;
            
        } catch (error) {
            console.error("Get all users error:", error);
            return [];
        }
    }

    /**
     * Sous fonction qui recherche les users par nom d'utilisateur
     */
    static async searchUsers(query: string): Promise<UserData[]> {
        try {
            const stmt = db.prepare(`
                SELECT id, username, email, avatar_url, createdAt, lastLogin, is_online
                FROM users
                WHERE username LIKE ? OR email LIKE ?
                ORDER BY username ASC
                LIMIT 20
            `);
            
            const searchPattern = `${query}%`;
            const usersRaw = stmt.all(searchPattern, searchPattern) as any[];
            
            const users: UserData[] = usersRaw.map(userData => {
                const stats = {
                    wins: 2,
                    losses: 0,
                    totalGames: 2,
                    winRate: 100
                };
                
                return {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    avatar_url: userData.avatar_url,
                    isOnline: userData.is_online,
                    twoFactorEnabled: false,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin,
                    stats: stats
                };
            });
            
            return users;
            
        } catch (error) {
            console.error("Search users error:", error);
            return [];
        }
    }
}
