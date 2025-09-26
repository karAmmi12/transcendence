export interface TokenPayload {
    userId: number;
    username: string;
    iat: number;
    exp?: number;
}

export interface SessionResult {
    valid: boolean;
    userId?: number;
}

export interface PairToken {
    accessToken: string;
    refreshToken: string;
}