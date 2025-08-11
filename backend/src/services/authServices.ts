import bcrypt from "bcrypt"
import db from "../db/index.js"
import { RegisterData, AuthResult, LoginData, UserFromDB } from "../types/auth"
import { JWTService } from "./jwtServices.js";

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

//SIUUUU ANCIENNE VERSION AVANT CLASS
// /**
//  * Service pour gerer l'inscription d'un nouveau user
//  * Validation du format faite par Fastify grace au schemas
//  */
// export async function registerUser(userData: RegisterData): Promise<AuthResult>
// {
//     try {
//         // Verif deja dans la db ?
//         if (checkEmailExists(userData.email))
//             return {
//                 success: false,
//                 error: "Email already use" //siuu a changer pour la secu le msg
//             };

//         if (checkUsernameExists(userData.username))
//             return {
//                 success: false,
//                 error: "Username already use" //siuu a changer pour la secu le msg
//             }

//         // Hasher le mdp
//         const hashedPassword = await bcrypt.hash(userData.password, 10);

//         // Creer le user
//         const stmt = db.prepare("INSERT INTO USERS (username, email, password) VALUES (?, ?, ?)");
//         const result = stmt.run(userData.username, userData.email, hashedPassword);
        
//         const userId = result.lastInsertRowid as number;

//         //siuu a GERer le token JWT
//         //Generer les tokens
//         const PairToken = JWTService.generateTokenPair(userId, userData.username)

//         //Creer nouvelle session dans la db
//         JWTService.createSession(userId, PairToken.refreshToken);

//         //Return siuu a rendre complet
//         const user = {
//             id: userId,
//             username: userData.username,
//             email: userData.email,
//             createAt: new Date().toISOString()
//         };

//         return {
//             success: true,
//             user: user,
//             accessToken: PairToken.accessToken,
//             refreshToken: PairToken.refreshToken
//         };
//     } catch (error) {
//         console.error('Register error: ', error);
//         return {
//             success: false,
//             error: "Registration failed"
//         };
//     }
// }

// /**
//  * Service pour gerer la connexion d'un user
//  */
// export async function loginUser(loginData: LoginData): Promise<AuthResult> {
//     try {
//         // chercher le user dans la db via email ou username
//         const stmt = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?");
//         const user = stmt.get(loginData.username, loginData.username) as UserFromDB | undefined;

//         if (!user)
//             return {
//                 success: false,
//                 error: "Invalid identifier" //siuu surment changer les msg pour la secu
//             };
        
//         // Verif mdp
//         const validPassword = await bcrypt.compare(loginData.password, user.password);
        
//         if (!validPassword)
//             return {
//                 success: false,
//                 error: "Invalid password" //siuu surment changer les msg pour la secu
//             }
        
//         //Maj lastLogin dans la db
//         const updateStmt = db.prepare("UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?");
//         updateStmt.run(user.id);

//         //siuu a gerer gestion du JWT
//         //Generer les tokens
//         const PairToken = JWTService.generateTokenPair(user.id, user.username)

//         //Creer nouvelle session dans la db
//         JWTService.createSession(user.id, PairToken.refreshToken);
        
//         const userReturn = {
//             id: user.id,
//             username: user.username,
//             email: user.email,
//             lastLogin: new Date().toISOString()
//         };
        
//         // Return
//         return {
//             success: true,
//             user: userReturn,
//             accessToken: PairToken.accessToken,
//             refreshToken: PairToken.refreshToken
//         };

//     } catch (error) {
//         console.error('Login error:', error);
//         return {
//             success: false,
//             error: "Login failed"
//         };
//     }
// }

export class AuthService 
{
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
                error: "Email already use" //siuu a changer pour la secu le msg
            };

        if (checkUsernameExists(userData.username))
            return {
                success: false,
                error: "Username already use" //siuu a changer pour la secu le msg
            }

        // Hasher le mdp
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Creer le user
        const stmt = db.prepare("INSERT INTO USERS (username, email, password) VALUES (?, ?, ?)");
        const result = stmt.run(userData.username, userData.email, hashedPassword);
        
        const userId = result.lastInsertRowid as number;

        //siuu a GERer le token JWT
        //Generer les tokens
        const PairToken = JWTService.generateTokenPair(userId, userData.username)

        //Creer nouvelle session dans la db
        JWTService.createSession(userId, PairToken.refreshToken);

        //Return siuu a rendre complet
        const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            createAt: new Date().toISOString()
        };

        return {
            success: true,
            user: user,
            accessToken: PairToken.accessToken,
            refreshToken: PairToken.refreshToken
        };
        } catch (error) {
            console.error('Register error: ', error);
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
            const user = stmt.get(loginData.username, loginData.username) as UserFromDB | undefined;

            if (!user)
                return {
                    success: false,
                    error: "Invalid identifier" //siuu surment changer les msg pour la secu
                };
            
            // Verif mdp
            const validPassword = await bcrypt.compare(loginData.password, user.password);
            
            if (!validPassword)
                return {
                    success: false,
                    error: "Invalid password" //siuu surment changer les msg pour la secu
                }
            
            //Maj lastLogin dans la db
            const updateStmt = db.prepare("UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?");
            updateStmt.run(user.id);

            //Generer les tokens JWT
            const PairToken = JWTService.generateTokenPair(user.id, user.username)

            //Creer nouvelle session dans la db
            JWTService.createSession(user.id, PairToken.refreshToken);
            
            const userReturn = {
                id: user.id,
                username: user.username,
                email: user.email,
                lastLogin: new Date().toISOString()
            };

            // Return
            return {
                success: true,
                user: userReturn,
                accessToken: PairToken.accessToken,
                refreshToken: PairToken.refreshToken
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: "Login failed"
            };
        }    
    }

    /**
     * Déconnecter un utilisateur // SIUU VOIR FONCTION LOGOUT
     */
    // static async logout(refreshToken: string): Promise<void> {
    //     try {
    //         // Supprimer la session de la base de données
    //         JWTService.deleteSession(refreshToken);
    //         console.log("🚪 User logged out successfully");
    //     } catch (error) {
    //         console.error("Logout service error:", error);
    //         throw error;
    //     }
    // }
}