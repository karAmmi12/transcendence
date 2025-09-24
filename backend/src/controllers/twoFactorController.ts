import { FastifyRequest, FastifyReply } from "fastify";
import { TwoFactorServices } from "../services/twoFactorServices.js";
import { Logger } from '../utils/logger.js';

export class TwoFactorController 
{
    static async sendTwoFactor(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const { userId } = req.user as { userId: number};

            const result = await TwoFactorServices.sendCode(userId);
            return reply.status(200).send({ success: true, message: result.message });
        } catch (error) {
            if (error instanceof Error)
                Logger.error(error.message);
            return reply.status(500).send({ error: "Internal error sending 2FA code" });
        }
    }

    static async validateTwoFactor(req: FastifyRequest, reply: FastifyReply) 
    {
        try {
            const { userId } = req.user as {userId: number};
            const { code, disabled }  = req.body as { code: string, disabled: boolean };

            Logger.log("Code reçu:", code, "Disabled:", disabled);
            const result = await TwoFactorServices.verifyCode(userId, code, disabled);
            if (!result.success)
                return reply.status(400).send({ error: result.message });
            return reply.status(200).send({ success: true, message: result.message });
        } catch (error) {
            if (error instanceof Error)
            {
                Logger.error(error.message);
                const errorMessage = error.message;
                if (errorMessage === "Too many failed attempts") {
                    return reply.status(400).send({ error: 'Too many failed attempts'});
                }
            }
            return reply.status(500).send({ error: "Internal error verifying 2FA code" });
        }
    }
}
