import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { TwoFactorController } from "../controllers/twoFactorController"

export default async function twoFaRoutes (app: FastifyInstance) {
    app.post('/send', TwoFactorController.sendTwoFactor);
    app.post('/verify', TwoFactorController.sendTwoFactor);
    app.post('/disabled', TwoFactorController.sendTwoFactor);

}