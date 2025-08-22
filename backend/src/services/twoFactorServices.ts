import { UserTwoFactor, } from "../types/auth";
import nodemailer from 'nodemailer';
import db from "../db/index.js";
import 'dotenv/config';

export class TwoFactorServices
{
    static async getUserById(userId: number): Promise<UserTwoFactor | null>
    {
        try {

            const stmt = db.prepare("SELECT id, email, two_factor_enabled, google_id FROM users where id = ?");
            const user = stmt.get(userId) as any | undefined;
            if (!user)
                return (null);
            console.log(`Getting 2FA user info for userId: ${userId}`);            
            const userData = {
                id: user.id,
                email: user.email,
                twoFactorEnabled: user.two_factor_enabled,
                googleId: user.google_id,
            };
            return (userData as UserTwoFactor);

        }catch (error) {
            throw new Error('Get userinfo 2FA failed request');
        }
    }

    static async sendEmail(email: string, code: string): Promise<boolean>
    {
        const transporter = nodemailer.createTransport({
            auth: {
                user:
            }
        })
    }
}