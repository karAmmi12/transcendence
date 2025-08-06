import jwt, { TokenExpiredError } from "jsonwebtoken";
import db from "../db/index.js"
import { TokenPayload } from "../types/jwt.js";

const ACCESS_TOKEN_SECRET =  process.env.ACCESS_TOKEN_SECRET || 'fallback-secret';
const REFRESH_TOKEN_SECRET =  process.env.REFRESH_TOKEN_SECRET as jwt.Secret | jwt.PrivateKey; //siuu bon type?;

export class JWTService 
{
    /**
     * Genere un access token de 15min 
     */
    static generateAccessToken(payload: {userId: number; username: string}): string
    {
        return (jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: '15m'}));
    }

    /**
     * Genere un refresh token de 30j 
     */
    static generateRefreshToken(payload: TokenPayload): string
    {
        return (jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: '30d'}));
    }

    static verifyAccessToken(token: string): TokenPayload | null
    {
        try {
            return (jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload);
        } catch (error) {
            console.error('Access token verif failed:', error);
            return (null);
        }
    }
}