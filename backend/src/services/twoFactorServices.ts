
import { UserTwoFactor } from "../types/auth";
import nodemailer from 'nodemailer';
import db from "../db/index.js";
import crypto from "crypto";
import 'dotenv/config';

export class TwoFactorServices {
    private static storeTwoFactor = new Map<number, { code: string, expiresAt: Date }>();

    static async getUserById(userId: number): Promise<UserTwoFactor | null>
    {
        try {
            const stmt = db.prepare("SELECT id, email, two_factor_enabled, google_id FROM users where id = ?");
            const user = stmt.get(userId) as any | undefined;
            if (!user) return null;
            return {
                id: user.id,
                email: user.email,
                twoFactorEnabled: Boolean(user.two_factor_enabled),
                googleId: user.google_id,
            };
        } catch (error) {
            throw new Error('Get userinfo 2FA failed request');
        }
    }

    static generateCode(): string {
        const randomBytes = crypto.randomBytes(3);
        const randomNumber = randomBytes.readUIntBE(0, 3);
        return (100000 + (randomNumber % 900000)).toString();
    }

    static async sendEmail(email: string, code: string): Promise<boolean> {
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.office365.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.MAIL_2FA,
                    pass: process.env.PASS_2FA,
                },
            });
            await transporter.sendMail({
                from: `"Ft_transcendence <${process.env.MAIL_2FA}>`,
                to: email,
                subject: "Code de verification",
                text: `Bonjour,\n\nVotre code de validation est disponible ci-dessous et sera valable pendant 10 minutes :\n\nCODE : ${code}\n\nMerci de ne pas partager ce code avec qui que ce soit.\n\nCordialement,\nL’équipe Ft_transcendence`
            });
            return (true);
        } catch {
            console.error('error: Failed to send mail for 2FA');
            return (false);
        }
    }

    static async sendCode(userId: number): Promise<{ success: boolean, message: string }> {
        const user = await this.getUserById(userId);
        if (!user)
            return { success: false, message: 'User not found' };
        if (user.googleId)
            return { success: false, message: '2FA not available for Google users' };

        const code = this.generateCode();
        this.storeTwoFactor.set(user.id, {
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        const emailValid = await this.sendEmail(user.email, code);
        if (!emailValid)
            return { success: false, message: 'Failed to send email for 2FA' };
        return { success: true, message: '2FA code sent by email' };
    }

    static async verifyCode(userId: number, code: string): Promise<{ success: boolean, message: string }> {
        const stored = this.storeTwoFactor.get(userId);
        if (!stored)
            return { success: false, message: 'No code found for this user' };
        if (stored.expiresAt < new Date()) {
            this.storeTwoFactor.delete(userId);
            return { success: false, message: 'Code expired' };
        }
        if (stored.code !== code)
            return { success: false, message: 'Incorrect code' };

        // Enable 2FA in DB if not already enabled
        const user = await this.getUserById(userId);
        if (user && !user.twoFactorEnabled) {
            const stmt = db.prepare("UPDATE users SET two_factor_enabled = 1 WHERE id = ?");
            stmt.run(userId);
        }
        this.storeTwoFactor.delete(userId);
        return { success: true, message: '2FA validated successfully' };
    }

    static async disableTwoFactor(userId: number, code: string): Promise<{ success: boolean, message: string }> {
        const stored = this.storeTwoFactor.get(userId);
        if (!stored)
            return { success: false, message: 'No code found for this user' };
        if (stored.expiresAt < new Date()) {
            this.storeTwoFactor.delete(userId);
            return { success: false, message: 'Code expired' };
        }
        if (stored.code !== code)
            return { success: false, message: 'Incorrect code' };

        // Disable 2FA in DB
        const stmt = db.prepare("UPDATE users SET two_factor_enabled = 0 WHERE id = ?");
        stmt.run(userId);
        this.storeTwoFactor.delete(userId);
        return { success: true, message: '2FA disabled successfully' };
    }
}