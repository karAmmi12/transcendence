export interface FriendsResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface FriendProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  isOnline: boolean;
  lastLogin?: string;
}


export interface FriendSearchResult {
  id: number;
  username: string;
  avatar_url: string | null;
  is_onisOnlineline: boolean;
  isFriend?: boolean;
}