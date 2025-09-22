import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginSchema, registerSchema } from "../schemas/auth_schema.js";
import { AuthController } from "../controllers/authController.js";
import { OAuthController } from "../controllers/oauthController.js";
// import { JWTService } from "../services/jwtService.js";

export default async function authRoutes(app: FastifyInstance)
{
  //Route sans middleware
  app.post('/register', {schema: registerSchema}, AuthController.register);
  app.post('/login', {schema: loginSchema}, AuthController.login);
  app.post('/loginWith2FA', AuthController.loginWith2FA);
  app.get('/oauth/google', OAuthController.oauthLogin);
  app.get('/oauth/google/callback', OAuthController.oauthCallback);


  // app.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
  //   try {
  //     // Vérifier si un token est fourni et s'il est valide
  //     const authHeader = request.headers.authorization;
      
  //     if (authHeader && authHeader.startsWith('Bearer ')) {
  //       const token = authHeader.substring(7);
        
  //       try {
  //         const decoded = JWTService.verifyAccessToken(token);
  //         return reply.send({ 
  //           message: 'Token is valid',
  //           user: decoded 
  //         });
  //       } catch (error) {
  //         // Token invalide ou expiré
  //         return reply.status(401).send({ 
  //           error: 'Invalid or expired token' 
  //         });
  //       }
  //     }
      
  //     // Pas de token fourni
  //     return reply.status(401).send({ 
  //       error: 'No token provided' 
  //     });
  //   } catch (error) {
  //     Logger.error('Test endpoint error:', error);
  //     return reply.status(500).send({ 
  //       error: 'Internal server error' 
  //     });
  //   }
  // });
  
  //Routes protege (passe par le middleware)
  app.post('/logout', AuthController.logout);
}
