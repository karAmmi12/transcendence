export interface FriendsResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface FriendProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastLogin?: string;
}


export interface FriendSearchResult {
  id: number;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  isFriend?: boolean;
}