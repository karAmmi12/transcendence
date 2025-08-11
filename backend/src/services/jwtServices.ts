import jwt, { TokenExpiredError } from "jsonwebtoken";
import db from "../db/index.js"
import { SessionResult, TokenPayload } from "../types/jwt.js";

const ACCESS_TOKEN_SECRET =  process.env.ACCESS_TOKEN_SECRET || 'fallback-access-secret';
const REFRESH_TOKEN_SECRET =  process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret'; //as jwt.Secret | jwt.PrivateKey; //siuu bon type?;

export class JWTService 
{
    //Creation et verif des tokens

    /**
     * Genere un access token de 15min 
     */
    static generateAccessToken(payload: {userId: number; username: string}): string
    {
        return (jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: '30s'})); //siuu 30s pour test remttree 15min
    }

    /**
     * Genere un refresh token de 30j 
     */
    static generateRefreshToken(payload: {userId: number}): string
    {
        return (jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: '30d'}));
    }


    /**
     * Verifie le access token 
     */
    static verifyAccessToken(token: string): TokenPayload | null
    {
        try {
            return (jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload);
        } catch (error) {
            console.error('Access token verif failed:', error);
            return (null);
        }
    }

    /**
     * Verifie le refresh token 
     */
    static verifyRefreshToken(token: string): TokenPayload | null
    {
        try {
            return (jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload);
        } catch (error) {
            console.error('Access token verif failed:', error);
            return (null);
        }
    }

    /**
     * Genere une paire de token
     */
    static generateTokenPair(userId: number, username: string)
    {
        const accessToken = this.generateAccessToken({userId, username});
        const refreshToken = this.generateRefreshToken({userId});

        return {accessToken, refreshToken};
    }

    // Gestion des tokens dans la db

    /**
     * Creation d'une sessions en db
     */
    static createSession(userId: number, refreshToken: string): number
    {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); //30j

        const stmt = db.prepare(`
                INSERT INTO sessions (user_id, refresh_token, expires_at)
                VALUES (?, ?, ?)
            `);

        const result = stmt.run(userId,refreshToken, expiresAt.toISOString());

        return (result.lastInsertRowid as number); // return l'id de la session en db ?
    }

    /**
     * Check si sessions existe en db
     */
    static isValidSession(refreshToken: string): SessionResult 
    {
        const stmt = db.prepare(`
            SELECT user_id FROM sessions 
            WHERE refresh_token = ? AND expires_at > CURRENT_TIMESTAMP
        `);

        const session = stmt.get(refreshToken) as {user_id: number} | undefined;
        if (session)
            return ({valid: true, userId: session.user_id});
        return ({valid: false});
    }

    /**
     * Supprime une session
     */
    static deleteSession(refreshToken: string): void {
        const stmt = db.prepare('DELETE FROM sessions WHERE refresh_token = ?');
        stmt.run(refreshToken);
    }

    /**
     * Supprime toutes les sessions d'un utilisateur
     */
    static deleteAllUserSessions(userId: number): void {
        const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
        stmt.run(userId);
    }

    /**
     * Nettoie les sessions expirées //siuu a voir si necessaire a utiliser
     */
    static cleanExpiredSessions(): void {
        const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
        const result = stmt.run();
        console.log(`Cleaned ${result.changes} expired sessions`);
    }
}