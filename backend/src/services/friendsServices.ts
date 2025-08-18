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
                    INSERT INTO friends (user_id, friend_id, status) 
                    VALUES (?, ?, 'accepted')
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
    {}

    /**
     * supprimer un ami
     */
    static async removeFriend(userId: number, friendId: number): Promise<FriendProfile[]>
    {}



}