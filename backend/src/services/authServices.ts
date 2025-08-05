import bcrypt from "bcrypt"
import db from "../db/index.js"
import { RegisterData, AuthResult, LoginData, UserFromDB } from "../types/auth"
import { create } from "domain";

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
 * Service pour gerer l'inscription d'un nouveau user
 * Validation du format faite par Fastify grace au schemas
 */
export async function registerUser(userData: RegisterData): Promise<AuthResult>
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

        //siuu a GERer le token JWT

        //Return
        const user = {
            id: result.lastInsertRowid as number,
            username: userData.username,
            email: userData.email,
            createAt: new Date().toISOString()
        };

        return {
            success: true,
            user: user
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
export async function loginUser(loginData: LoginData): Promise<AuthResult> {
    try {
        // chercher le user dans la db via email ou username
        const stmt = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?");
        const user = stmt.get(loginData.identifier, loginData.identifier) as UserFromDB | undefined;

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
        
        //siuu A gerer maj du lastLogin dans la db

        //siuu a gerer gestion du JWT
        
        const userReturn = {
            id: user.id,
            username: user.username,
            email: user.email,
            lastLogin: new Date().toISOString()
        };
        
        // Return
        return {
            success: true,
            user: userReturn
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: "Login failed"
        };
    }
}