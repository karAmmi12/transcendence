import {RegisterData, AuthResult, LoginData, UserFromDB} from "../types/auth.js"
import {JWTService} from "./jwtServices.js";
import { TwoFactorServices } from "./twoFactorServices.js";
import { serialize } from '../utils/serialize.js';
import db from "../db/index.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';

/**
 * Verifie si le mail existe deja dans la db
 */
export function checkEmailExists(email: string): boolean 
{
    const stmt = db.prepare("SELECT id FROM users WHERE email = ?");
    const user = stmt.get(email);
    return (user !== undefined);
}

/**
 * Verifie si le username existe deja dans la db
 */
export function checkUsernameExists(username: string): boolean 
{
    const stmt = db.prepare("SELECT id FROM users WHERE username = ?");
    const user = stmt.get(username);
    return (user !== undefined);
}

/**
 * recupere tout le User via email 
 */
function findUserByEmail(email: string): UserFromDB | null 
{
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const userRaw = stmt.get(email) as any | undefined;
    return userRaw ? serialize<UserFromDB>(userRaw) : null;
}

/**
 * recupere tout le User via email 
 */
function findUserByUsername(username: string): UserFromDB | null 
{
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const userRaw = stmt.get(username) as any | undefined;
    return userRaw ? serialize<UserFromDB>(userRaw) : null;
}

export class AuthService 
{
    /**
     * Service pour gerer la connexion via 2FA
     */
    static async loginWith2FA(userId: number, code: string): Promise<AuthResult>
    {
        try {
            const verifyResult = await TwoFactorServices.verifyCode(userId, code, false);
            if (!verifyResult.success) {
                return {
                    success: false,
                    error: verifyResult.message
                };
            }

            const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
            const user = stmt.get(userId) as UserFromDB | undefined;

            if (!user) {
                return {
                    success: false,
                    error: "User not found"
                };
            }

            const updateStmt = db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP, is_online = 1 WHERE id = ?");
            updateStmt.run(user.id);

            const PairToken = JWTService.generateTokenPair(user.id, user.username);

            JWTService.createSession(user.id, PairToken.refreshToken);

            const userReturn = {
                id: user.id,
                username: user.username,
                email: user.email,
                lastLogin: new Date().toISOString()
            };

            return {
                success: true,
                user: userReturn,
                accessToken: PairToken.accessToken,
                refreshToken: PairToken.refreshToken
            };

        } catch (error) {
            Logger.error('Login with 2FA error:', error);
            return {
                success: false,
                error: "2FA login failed"
            };
        }
    }

    /**
     * Service pour gerer l'inscription d'un nouveau user
     * Validation du format faite par Fastify grace au schemas
     */
    static async registerUser(userData: RegisterData): Promise<AuthResult> 
    {
        try {
        // Verif deja dans la db ?
        if (checkEmailExists(userData.email))
            return {
                success: false,
                error: "Email already use"
            };

        if (checkUsernameExists(userData.username))
            return {
                success: false,
                error: "Username already use"
            }

        // Hasher le mdp
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Creer le user
        const stmt = db.prepare("INSERT INTO USERS (username, email, password, is_online, last_login) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)");
        const result = stmt.run(userData.username, userData.email, hashedPassword);
        
        const userId = result.lastInsertRowid as number;

        //Generer les tokens JWT
        const PairToken = JWTService.generateTokenPair(userId, userData.username)

        //Creer nouvelle session dans la db
        JWTService.createSession(userId, PairToken.refreshToken);

        const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            avatar_url: null,
            isOnline: true,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            stats: {
                wins: 0,
                losses: 0,
                totalGames: 0,
                winRate: 0,
            }
        };

        return {
            success: true,
            user: user,
            accessToken: PairToken.accessToken,
            refreshToken: PairToken.refreshToken
        };
        } catch (error) {
            Logger.error('Register error: ', error);
            return {
                success: false,
                error: "Registration failed"
            };
        }
    }

    /**
     * Service pour gerer la connexion d'un user
     */
    static async loginUser(loginData: LoginData): Promise<AuthResult> 
    {
        try {
            // chercher le user dans la db via email ou username
            const stmt = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?");
            const userRaw = stmt.get(loginData.username, loginData.username) as UserFromDB | undefined;

            if (!userRaw)
                return {
                    success: false,
                    error: "Invalid identifier"
                };

            const user = serialize<UserFromDB>(userRaw);
            
            // Verif mdp
            const validPassword = await bcrypt.compare(loginData.password, user.password);
            
            if (!validPassword)
                return {
                    success: false,
                    error: "Invalid password"
                }

            if (user.twoFactorEnabled)
            {
                const getCode = await TwoFactorServices.sendCode(user.id);
                if (!getCode.success)
                    return { success: getCode.success, error: getCode.message}
                return {
                    success: false,
                    error: "2FA_REQUIRED",
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        twoFactorEnabled: user.twoFactorEnabled
                    }
                };
            }

            //Maj lastLogin dans la db
            const updateStmt = db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP, is_online = 1 WHERE id = ?");
            updateStmt.run(user.id);

            //Generer les tokens JWT
            const PairToken = JWTService.generateTokenPair(user.id, user.username)

            //Creer nouvelle session dans la db
            JWTService.createSession(user.id, PairToken.refreshToken);
            
            const userReturn = {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatar,
                isOnline: user.isOnline,
                lastLogin: new Date().toISOString()
            };

            return {
                success: true,
                user: userReturn,
                accessToken: PairToken.accessToken,
                refreshToken: PairToken.refreshToken
            };

        } catch (error) {
            Logger.error('Login error:', error);
            return {
                success: false,
                error: "Login failed"
            };
        }    
    }

    /**
     * Déconnecter un utilisateur
     */
    static async logout(refreshToken: string): Promise<void> 
    {
        try {
            // changer isOnline sur false 
            // Récupérer l'ID utilisateur depuis le refresh token
            const sessionCheck = JWTService.isValidSession(refreshToken);
            
            if (sessionCheck.valid && sessionCheck.userId) {
                // Mettre à jour le statut offline
                const updateStmt = db.prepare("UPDATE users SET is_online = 0 WHERE id = ?");
                updateStmt.run(sessionCheck.userId);
            }

            // Supprimer la session de la base de données
            const delete2FA = db.prepare("DELETE FROM two_factor_tokens where user_id = ?")
            const cleanToken = delete2FA.run(sessionCheck.userId);
            JWTService.deleteSession(refreshToken);

        } catch (error) {
            Logger.error("Logout service error:", error);
            throw error;
        }
    }

    /**
     * google authentification 
     */
    static async handleOAuthUser(userData: UserFromDB): Promise<AuthResult>
    {
        const userExist = findUserByEmail(userData.email); 
        
        if (userExist && userExist.googleId) {
            const serializedUser = serialize(userExist);
            const updateStmt = db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP, is_online = 1 WHERE id = ?");
            updateStmt.run(userExist.id);
            const PairToken = JWTService.generateTokenPair(userExist.id, userExist.username)
            JWTService.createSession(userExist.id, PairToken.refreshToken);
            const userReturn = {
                id: userExist.id,
                username: userExist.username,
                email: userExist.email,
                lastLogin: new Date().toISOString(),
            }
            
            return {
                success: true,
                user: userReturn,
                accessToken: PairToken.accessToken,
                refreshToken: PairToken.refreshToken
            };
        }
        const userName = findUserByUsername(userData.username);
        if (!userName && !userExist?.email){
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const stmt = db.prepare("INSERT INTO USERS (username, email, password, google_id, last_login, is_online) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1) ");
            const res = stmt.run(userData.username, userData.email, hashedPassword, userData.googleId);

            const userId = res.lastInsertRowid as number;
            const PairToken = JWTService.generateTokenPair(userId, userData.username)
            JWTService.createSession(userId, PairToken.refreshToken);

            const userReturn = {
                    id: userId,
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    lastLogin: new Date().toISOString(),
                }
                
                return {
                    success: true,
                    user: userReturn,
                    accessToken: PairToken.accessToken,
                    refreshToken: PairToken.refreshToken
                };
        }
        throw new Error('Error Oauth login');
    }
}