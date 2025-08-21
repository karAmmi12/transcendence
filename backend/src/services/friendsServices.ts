import db from "../db/index.js"
import {FriendsResult, FriendProfile} from "../types/friends.js";

export class FriendsService
{
    /**
     * ajouter qlq en ami (sans demande) 
     */
    static async addFriend(userId: number, friendId: number): Promise<FriendsResult> 
    {
        const transaction = db.transaction(() => {
            try {
                if (userId === friendId)
                    throw ({error: "Cant add yourself as friend"});

                const friendExists = db.prepare("SELECT id FROM users WHERE id = ?").get(friendId);
                if (!friendExists)
                    throw ({error: "User not found"});

                const existingFriendship = db.prepare(`
                    SELECT * FROM friends 
                    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
                `).get(userId, friendId, friendId, userId);
                if (existingFriendship)
                    throw ({error: "already friends"});

                const stmt = db.prepare(`
                    INSERT INTO friends (user_id, friend_id) 
                    VALUES (?, ?)
                `);

                const result = stmt.run(userId, friendId);

                return ({
                    success: true,
                    data: {friendshipId: result.lastInsertRowid}
                });

            } catch (error) {
                throw (error);
            }
        });

        try {
            return (transaction());
        } catch (error) {
            console.error('Friend add:', error);
            return ({
                success: false,
                error: "Fail add friend"
            });
        }
    };

    /**
     * recup la liste d'amis
     */
    static async getFriendsList(userId: number): Promise<FriendProfile[]>
    {
        try {
            const stmt = db.prepare(`
                SELECT DISTINCT u.id, u.username, u.avatar_url, u.is_online, u.last_login, f.created_at
                FROM users u
                JOIN friends f ON f.friend_id = u.id
                WHERE f.user_id = ?
                ORDER BY u.is_online DESC, u.username ASC
            `);

            const friendsRaw = stmt.all(userId) as any[];
            
            const friends: FriendProfile[] = friendsRaw.map(friend => ({
                id: friend.id,
                username: friend.username,
                avatarUrl: friend.avatarUrl,
                isOnline: Boolean(friend.is_online), 
                lastSeen: friend.lastLogin,
                friendshipDate: friend.createdAt
            }));
            return friends;

        } catch (error) {
            console.error('Error getting friends:', error);
            return [];
        }
    }

    /**
     * supprimer un ami
     */
    static async removeFriend(userId: number, friendId: number): Promise<FriendsResult>
    {
        const transaction = db.transaction(() => {
            try {
                const stmt = db.prepare(`
                    DELETE FROM friends 
                    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
                `);
                
                const result = stmt.run(userId, friendId, friendId, userId);
                if (result.changes === 0)
                    throw ({error: "Friendship not found"});

                return ({ success: true });

            } catch (error) {
                throw error;
            }
        });

        try {
            return (transaction());
        } catch (error) {
            console.error('Friend remove:', error);
            return ({
                success: false,
                error: "Fail remove friend"
            });
        }
    }
}