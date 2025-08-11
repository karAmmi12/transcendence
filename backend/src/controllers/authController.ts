import { FastifyRequest, FastifyReply } from "fastify";
import { RegisterData, LoginData } from "../types/auth.js";
import { AuthService } from "../services/authServices.js";
import { CookieService } from "../services/cookieServices.js";
import { UserService } from "../services/userServices.js";

export class AuthController
{
    /**
     * Route test
     */
    static async test(req: FastifyRequest, reply: FastifyReply)
    {
        return ({message: 'Auth route works!'});
    }

    /**
     * Route register d'un nouveau user
     */
    static async register(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const userData = req.body as RegisterData;
            
            const result = await AuthService.registerUser(userData);
            if (!result.success) {
                return reply.status(400).send({ error: result.error });
            }

            //🍪 Définir les cookies d'authentification
            CookieService.replyAuthTokenCookie(reply, result.accessToken!, result.refreshToken!);
            
            reply.status(201).send({
                message: "✅ User created successfully",
                user: result.user
            });

        } catch (error) {
            console.error("Register controller error:", error);
            reply.status(500).send({ error: "Registration failed" });
        }
    }

    /**
     * Route login permet au user de ce connecter
     */
    static async login(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const loginData = req.body as LoginData;
            
            const result = await AuthService.loginUser(loginData);
            if (!result.success) 
                return (reply.status(401).send({error: result.error}));
        
            // 🍪 Définir les cookies d'authentification
            CookieService.replyAuthTokenCookie(reply, result.accessToken!, result.refreshToken!);

            reply.send({
                message: "✅ Login successful",
                user: result.user,
            })
            
        } catch (error) {
                console.error("Login controller error:", error);
                reply.status(500).send({ error: "Login failed" });
        }
    };

    /**
     * Siuuu faire le logout
     */

    /**
     * Siuuu faire le getProfile
     */

    /**
     * Siuuu faire le  update profile User
     */

    /**
     * Récupérer tous les utilisateurs (debug)
     */
    static async getAllUsers(req: FastifyRequest, reply: FastifyReply) {
        try {
            const users = await UserService.getAllUsers();
            reply.send(users);
        } catch (error) {
            console.error("Get all users controller error:", error);
            reply.status(500).send({ error: "Failed to get users" });
        }
    }

}