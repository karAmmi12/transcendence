import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { TwoFactorController } from "../controllers/twoFactorController.js"

export default async function twoFaRoutes (app: FastifyInstance) 
{
    app.post('/enabled', TwoFactorController.sendTwoFactor);
    app.post('/verify', TwoFactorController.validateTwoFactor);
    app.post('/disabled', TwoFactorController.sendTwoFactor);
}