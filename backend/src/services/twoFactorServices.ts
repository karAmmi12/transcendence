
import { UserTwoFactor, TwoFactorToken } from "../types/auth";
import nodemailer from 'nodemailer';
import db from "../db/index.js";
import crypto from "crypto";
import bcrypt from 'bcrypt'; 
import 'dotenv/config';

export class TwoFactorServices {

    static async getUserById(userId: number): Promise<UserTwoFactor>
    {
            const stmt = db.prepare("SELECT id, email, two_factor_enabled, google_id FROM users where id = ?");
            const user = stmt.get(userId) as any | undefined;
            if (!user)
                throw new Error('Get user infos for 2FA failed');
            return {
                id: user.id,
                email: user.email,
                twoFactorEnabled: user.two_factor_enabled,
                googleId: user.google_id,
            };
    }

    static generateCode(): string {
        const randomBytes = crypto.randomBytes(3);
        const randomNumber = randomBytes.readUIntBE(0, 3);
        return (100000 + (randomNumber % 900000)).toString();

    }

    static async sendEmail(email: string, code: string): Promise<boolean> 
    {
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.MAIL_2FA,
                    pass: process.env.PASS_2FA,
                },
            });
            await transporter.sendMail({
                from: `"Ft_transcendence`,
                to: email,
                subject: "Code de verification",
                text: `Bonjour,\n\nVotre code de validation est disponible ci-dessous et sera valable pendant 10 minutes :\n\nCODE : ${code}\n\nMerci de ne pas partager ce code avec qui que ce soit.\n\nCordialement,\nL’équipe Ft_transcendence`
            });
            return (true);
        } catch (error) {
            console.error('error: Failed to send mail for 2FA', error);
            return (false);
        }
    }

    static async storeTwoFactor(userId: number, code: string): Promise<TwoFactorToken | null>
    {
        try {
            
            const codeHash = await bcrypt.hash(code, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO two_factor_tokens 
                (user_id, token, expires_at)
                VALUES (?, ?, ?)`);
            const res = stmt.run(userId, codeHash, expiresAt.toString());
            const returnUser = {
                id: userId,
                token: codeHash,
                expiresAt: expiresAt
            } as TwoFactorToken;
            console.log("GET userinfo Two Factor: ", returnUser);
            return (returnUser);

        }catch (error){
            console.error("Failed query DB 2FA", error);
            return (null);
        }
    }

    static async sendCode(userId: number): Promise<{ success: boolean, message: string }> 
    {
 
            const user = await this.getUserById(userId);
            if (user.googleId)
                throw new Error('2FA not available for Google users');
            
            const code = this.generateCode();
            if (!code)
                throw new Error('Generate random pass 2FA failed');
            const tokenUser = await this.storeTwoFactor(userId, code);
            const emailValid = await this.sendEmail(user.email, code);

            return { success: true, message: '2FA code sent by email' };

    }

    static async getUserInfo(userId: number): Promise<TwoFactorToken | null>
    {
        try {
            const stmt = db.prepare("SELECT * FROM two_factor_tokens WHERE user_id = ? ");
            const tokenData = stmt.get(userId) as any;
            console.log("OUAIS", tokenData);
            if (!tokenData) 
                return null;
            return {
                id: tokenData.user_id,
                token: tokenData.token,
                expiresAt: new Date(tokenData.expires_at)
            } as TwoFactorToken;

        }catch(error) {
            console.error('Error getting 2FA token:', error);
            return null;
        }
    }

    static async verifyCode(userId: number, code: string): Promise<{ success: boolean, message: string }> 
    {
        const stored = await this.getUserInfo(userId);
        if (!stored)
            return { success: false, message: 'No code found for this user' };
        if (stored.expiresAt < new Date()) {
            console.log("Code expired for 2FA");
            return { success: false, message: 'Code expired' };
        }
        
        // Utiliser bcrypt.compare pour comparer le code
        const isValidCode = await bcrypt.compare(code, stored.token);
        if (!isValidCode)
            return { success: false, message: 'Incorrect code' };

        // Enable 2FA in DB if not already enabled
        const user = await this.getUserById(userId);
        if (user) {
            if (!user.twoFactorEnabled){
                const stmt = db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?");
                stmt.run(user.id);
            }

            // Supprimer le token utilisé
            const deleteStmt = db.prepare("DELETE FROM two_factor_tokens WHERE user_id = ?");
            deleteStmt.run(userId);
            
            console.log(`2FA allowed for user: ${user.email}`);
            return { success: true, message: '2FA validated successfully' };
        } else {
            return {success: false, message: "User not found"};
        }
    }

    static async disableTwoFactor(userId: number, code: string): Promise<{ success: boolean, message: string }> 
    {
        const stored = await this.getUserInfo(userId);
        if (!stored?.token)
            return { success: false, message: 'No code found for this user' };
        if (stored.expiresAt < new Date()) {
            return { success: false, message: 'Code expired' };
        }
        
        // Utiliser bcrypt.compare pour comparer le code
        const isValidCode = await bcrypt.compare(code, stored.token);
        if (!isValidCode)
            return { success: false, message: 'Incorrect code' };

        // Disable 2FA in DB
        const stmt = db.prepare("UPDATE users SET two_factor_enabled = 0 WHERE id = ?");
        stmt.run(userId);
        
        // Supprimer le token utilisé
        const deleteStmt = db.prepare("DELETE FROM two_factor_tokens WHERE user_id = ?");
        deleteStmt.run(userId);
        
        console.log(`2FA disabled`);
        return { success: true, message: '2FA disabled successfully' };
    }
}