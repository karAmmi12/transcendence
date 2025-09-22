import type { User } from './auth.js';

export interface Friend {
  id: number;
  username: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  lastSeen?: string;
  friendshipDate: string;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface FriendshipStatus {
  isFriend: boolean;
  requestId?: number;
}