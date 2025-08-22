import { FastifyRequest, FastifyReply } from "fastify";
import { TwoFactorServices } from "../services/twoFactorServices.js";
import { UserFromDB, TwoFactorCode, UserTwoFactor } from "../types/auth.js";
import crypto from "crypto";

export class TwoFactorController {
    private static storeTwoFactor = new Map<number, TwoFactorCode>();


    static generateCode(): string {
        const randomBytes = crypto.randomBytes(3);
        const randomNumber = randomBytes.readUIntBE(0, 3);
        return (100000 + (randomNumber % 900000)).toString();
    }

    static async enableTwoFactor(req: FastifyRequest, reply: FastifyReply)
    {
        const { userId } = req.user as { userId: number };
        
        const user = await TwoFactorServices.getUserById(userId);
        if (!user) return (reply.status(403).send({ error: 'Get userinfo failed for Auth 2FA' }));
        if (user.googleId)
            return (reply.status(404).send({ error: '2FA not available for Google users' }));
        
        const code = this.generateCode();
        if (!code)
            return (reply.status(400).send({ error: 'Generate code 2FA failed' }));

        TwoFactorController.storeTwoFactor.set(user.id, {
            code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
        
        const emailValid = await TwoFactorServices.sendEmail(user.email, code);


    }

    static async disableTwoFactor(req: FastifyRequest, reply: FastifyReply)
    {

    }


}
