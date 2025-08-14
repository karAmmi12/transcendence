import db from '../db/index.js'
import {UserData, AuthenticatedUser, UpdateProfileData, UpdateResult} from "../types/auth.js"
import {checkUsernameExists, checkEmailExists} from "./authServices.js"

export class userServices
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
            isOnline: userData.isOnline,
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
                // check dans db si deja present
                if (updateData.username)
                {
                    const exist = checkUsernameExists(updateData.username);
                    if (exist)
                        throw new Error("User already exist")//siuu modif msg
                }
                if (updateData.email)
                {
                    const exist = checkEmailExists(updateData.email);
                    if (exist)
                        throw ("Email already exist")//siuu modif msg
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
}
