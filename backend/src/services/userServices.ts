import { FastifyReply } from 'fastify';
import db from '../db/index.js'
import {UserData, AuthenticatedUser} from "../types/auth.js"


export class userServices
{
    /**
     * sous fonction qui recupere les infos du user depuis la db
     */
    static async getUserDataFromDb(user: AuthenticatedUser): Promise <UserData | null>
    {
        const stmt = db.prepare(`
                SELECT id, username, email, avatar_url, createdAt, lastLogin, is_online
                FROM users WHERE id = ?
            `);
        const userData = stmt.get(user.userId) as UserData | undefined;
        if (!userData)
            return (null);

        const stats = { //siuuu stats temporaire avant de faire les tables matches
                wins: 2,
                losses: 0,
                totalGames: 2,
                winRate: 2,
                rank: 0,
                highestScore: 0,
                currentStreak: 2,
                longestStreak: 2
            }
        
        const userProfile: UserData = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            avatar_url: userData.avatar_url, //siuu mettre un avatar par default
            isOnline: userData.isOnline,
            twoFactorEnabled: userData.twoFactorEnabled,
            createdAt: userData.createdAt,
            stats: stats
        }
        
        return (userProfile);
    }
}