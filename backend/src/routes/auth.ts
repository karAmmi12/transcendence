import {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {loginSchema, registerSchema,updateProfileSchema} from "../schemas/auth_schema.js";
import {AuthController} from "../controllers/authController.js";
import { UserController } from "../controllers/userController.js";

// NOuvelle version Propre 
export default async function authRoutes(app: FastifyInstance)
{
  
  //Route sans middleware
  app.get('/test', AuthController.test); //siuu test a supprimer
  app.post('/register', {schema: registerSchema}, AuthController.register);
  app.post('/login', {schema: loginSchema}, AuthController.login);
  
  //Routes protege (passe par le middleware)
  app.get('/me', UserController.getProfile);
  app.post('/logout', AuthController.logout);
  app.put('/updateProfile', UserController.updateProfile)

  //Routes de Debug
  // app.get('/users', AuthController.getAllUsers);
}
