import Fastify from "fastify";
import { ValidationResult, SignupBody } from "../types/auth";

/**
 * Valide l'adresse mail en utilisant un Regex connue
 */
export function validateEmail(email: string): ValidationResult 
{
    const errors: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        errors.push("Please use a valid email"); //laangue

    if (email.length > 254)
        errors.push("Email adress to long"); //laangue

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valide le mot de passe avec ces regles :1 maj, 1 min, 1 chiffre, 1 caractère spécial, min 8 caractères
 */
export function validatePassword(password: string): ValidationResult
{
    const errors: string[] = [];

    // Regex pour valider: 1 maj, 1 min, 1 chiffre, 1 caractère spécial, min 8 caractères
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordRegex.test(password))
            errors.push("Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character")

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valide toutes les donnees d'un nouvelle utilisateur
 */
export function validateSignup(data: SignupBody) : ValidationResult 
{
    const allErrors: string[] = [];

    const emailValidation = validateEmail(data.email);
    allErrors.push(...emailValidation.errors);

    const passwordValidation = validatePassword(data.password);
    allErrors.push(...passwordValidation.errors);

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    }
}

