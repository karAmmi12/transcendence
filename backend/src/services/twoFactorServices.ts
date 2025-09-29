
import { UserTwoFactor, TwoFactorToken } from "../types/auth.js";
import nodemailer from 'nodemailer';
import db from "../db/index.js";
import crypto from "crypto";
import bcrypt from 'bcrypt'; 
import 'dotenv/config';
import { Logger } from '../utils/logger.js';

export class TwoFactorServices 
{
    static async getUserById(userId: number): Promise<UserTwoFactor>
    {
        const stmt = db.prepare("SELECT id, email, two_factor_enabled, google_id FROM users where id = ?");
        const user = stmt.get(userId) as any | undefined;
        if (!user)
            throw new Error('User infos 2FA not found');
        return {
            id: user.id,
            email: user.email,
            twoFactorEnabled: user.two_factor_enabled,
            googleId: user.google_id,
        };
    }

    static generateCode(): string 
    {
        const randomBytes = crypto.randomBytes(3);
        const randomNumber = randomBytes.readUIntBE(0, 3);
        return (100000 + (randomNumber % 900000)).toString();

    }

    static async sendEmail(email: string, code: string): Promise<void> 
    {
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
            from: `Nodemailer <${process.env.MAIL_2FA}>`,
            to: email,
            subject: "Code de verification",
            text: `Bonjour,\n\nVotre code de validation est disponible ci-dessous et sera valable pendant 10 minutes :\n\nCODE : ${code}\n\nMerci de ne pas partager ce code avec qui que ce soit.\n\nCordialement,\nL’équipe Ft_transcendence`
        });
    }

    static async storeTwoFactor(userId: number, code: string): Promise<void>
    {
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO two_factor_tokens 
            (user_id, token, expires_at, try)
            VALUES (?, ?, ?, 0)`);
        const res = stmt.run(userId, codeHash, expiresAt.toISOString());
        console.log('SIUUUUUUUUUUUUUUUUUUUUUUUUUUU', res);
        if (!res)
            throw new Error("Create Token failed storeTwoFactor");
        Logger.log("GET userinfo Two Factor: ", res);
        
    }

    static async sendCode(userId: number): Promise<{ success: boolean, message: string }> 
    {
        const user = await this.getUserById(userId);
        const code = this.generateCode();
        if (!code)
            throw new Error('Generate random pass 2FA failed');
        await this.storeTwoFactor(user.id, code);
        await this.sendEmail(user.email, code);

        return { success: true, message: '2FA code sent by email' };
    }

    static async getUserInfo(userId: number): Promise<TwoFactorToken>
    {
        const stmt = db.prepare("SELECT * FROM two_factor_tokens WHERE user_id = ? ");
        const tokenData = stmt.get(userId) as any;
        if (!tokenData) 
            throw new Error('Error getUSerInfo query db 2FA');
        return {
            id: tokenData.user_id,
            token: tokenData.token,
            expiresAt: tokenData.expires_at,
            try: tokenData.try
        } as TwoFactorToken;
    }

    static async verifyCode(userId: number, code: string, disabled: boolean): Promise<{ success: boolean, message: string }> 
    {
        const stored = await this.getUserInfo(userId);

        if (stored.expiresAt < new Date(Date.now())) {
            throw new Error("Code expired for 2FA");
        }
        
        if (stored.try >= 2) {
            console.error('ERROR TWOFA', stored.try);
            throw new Error("Too many failed attempts");
        }

        // Utiliser bcrypt.compare pour comparer le code
        const isValidCode = await bcrypt.compare(code, stored.token);
        if (!isValidCode){
            const stmtTry = db.prepare("UPDATE two_factor_tokens SET try = try + 1 WHERE user_id = ?");
            stmtTry.run(stored.id);
            throw new Error('Incorrect code');
        }

        // Enable 2FA in DB if not already enabled
        const user = await this.getUserById(userId);
        if (!user.twoFactorEnabled){
            const stmt = db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?");
            stmt.run(user.id);
        }
        else if (user.twoFactorEnabled && disabled)
        {
            const stmt = db.prepare("UPDATE users SET two_factor_enabled = 0 WHERE id = ?");
            stmt.run(user.id);
        }

        // Supprimer le token utilisé
        const deleteStmt = db.prepare("DELETE FROM two_factor_tokens WHERE user_id = ?");
        deleteStmt.run(userId);
        
        Logger.log(`2FA called for user: ${user.email}`);
        return { success: true, message: disabled ? '2FA disabled successfully' : '2FA validate successfully' };
    }
}