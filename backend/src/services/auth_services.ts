import bcrypt from "bcrypt"
import db from "../db/index"
import { AuthResult, RegisterData } from "../types/auth"
import { validateSignup } from "../utils/validation"
// siuu ANCIENNE VERSION SANS LES SHCEMAS A SUPPRIMER

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
 * Service pour gerer l'inscription utilisateur
 */
export async function registerUser(userData:RegisterData): Promise<AuthResult>
{
    // Validation des formats
    const validation = validateSignup(userData)
    if (!validation.isValid)
        return {
            success: false,
            error: "Validation failed",
            errors: validation.errors    
        };
    
    // Verif dans la db
    const dbErrors: string[] = [];

    if (checkEmailExists(userData.email))
        dbErrors.push("Email already used"); // siuu changer les msg pour pas devoiler de faille

    if (checkUsernameExists(userData.username))
        dbErrors.push("Username already used")

    if (dbErrors.length > 0)
        return {
            success: false,
            error: "Users already exists",
            errors:dbErrors
        };
    
    // Creation du user

}