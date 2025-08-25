import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { TwoFactorController } from "../controllers/twoFactorController"

export default async function twoFaRoutes (app: FastifyInstance) {
    app.post('/enabled', TwoFactorController.enableTwoFactor);
    app.post('/verify', TwoFactorController.validateTwoFactor);
    app.post('/disabled', TwoFactorController.disableTwoFactor);

}