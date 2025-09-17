import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginSchema, registerSchema } from "../schemas/auth_schema.js";
import { AuthController } from "../controllers/authController.js";
import { OAuthController } from "../controllers/oauthController.js";

export default async function authRoutes(app: FastifyInstance)
{
  //Route sans middleware
  app.post('/register', {schema: registerSchema}, AuthController.register);
  app.post('/login', {schema: loginSchema}, AuthController.login);
  app.post('/loginWith2FA', AuthController.loginWith2FA);
  app.get('/oauth/google', OAuthController.oauthLogin);
  app.get('/oauth/google/callback', OAuthController.oauthCallback);
  
  //Routes protege (passe par le middleware)
  app.post('/logout', AuthController.logout);
}
