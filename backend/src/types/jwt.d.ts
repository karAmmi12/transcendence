export interface TokenPayload {
    userId: number;
    username: string;
    iat: number;
    exp?: number;
}