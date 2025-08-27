import { FastifyRequest, FastifyReply } from "fastify";
import { TwoFactorServices } from "../services/twoFactorServices.js";

export class TwoFactorController {
    static async enableTwoFactor(req: FastifyRequest, reply: FastifyReply) 
    {
        
        try {

            // const { userId } = req.body as { userId: number };
            const user = req.user!;
            const userId = user.userId; 

            const result = await TwoFactorServices.sendCode(userId);
            if (!result.success)
                return reply.status(400).send({ error: result.message });
            return reply.status(200).send({ success: true, message: result.message });
        } catch (error) {
            if (error instanceof Error)
                console.error(error.message);
            return reply.status(500).send({ error: error || "Internal error sending 2FA code" });
        }
    }

    static async validateTwoFactor(req: FastifyRequest, reply: FastifyReply) 
    {

        try {
            const { userId } = req.user as {userId: number};
            // const userId = user.userId;
            const { code }  = req.body as { code: string };

            const result = await TwoFactorServices.verifyCode(userId, code);
            if (!result.success)
                return reply.status(400).send({ error: result.message });
            return reply.status(200).send({ success: true, message: result.message });
        } catch (error) {
            return reply.status(500).send({ error: "Internal error verifying 2FA code" });
        }
    }

    static async disableTwoFactor(req: FastifyRequest, reply: FastifyReply) 
    {
        
        try {
            const user = req.user!;
            const userId = user.userId;
            const { code }  = req.body as { code: string };
            const result = await TwoFactorServices.disableTwoFactor(userId, code);
            if (!result.success)
                return reply.status(400).send({ error: result.message });
            return reply.status(200).send({ success: true, message: result.message });
        } catch (error) {
            if (error instanceof Error)
                console.error(error.message);
            return reply.status(500).send({ error: error || "Internal error disabling 2FA" });
        }
    }
}
