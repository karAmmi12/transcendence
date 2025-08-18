export interface FriendshipData {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
}

export interface FriendProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  lastLogin?: string;
}

export interface FriendRequest {
  id: number;
  requesterId: number;
  requesterUsername: string;
  requesterAvatar: string | null;
  createdAt: string;
}

export interface FriendSearchResult {
  id: number;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  friendshipStatus?: 'none' | 'pending' | 'accepted' | 'blocked';
}

export interface FriendsServiceResult {
  success: boolean;
  error?: string;
  data?: any;
}