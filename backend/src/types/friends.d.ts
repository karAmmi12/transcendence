export interface FriendRequest {
    id: number;
    user_id: number; 
    friend_id: number;
    status: string; // 'pending', 'accepted', 'blocked'
    createdAt: string;
}