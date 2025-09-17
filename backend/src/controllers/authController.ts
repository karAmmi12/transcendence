import {FastifyRequest, FastifyReply} from "fastify";
import {RegisterData, LoginData} from "../types/auth.js";
import {AuthService} from "../services/authServices.js";
import {CookieService} from "../services/cookieServices.js";
import {UserServices} from "../services/userServices.js"

export class AuthController
{
    /**
     * Route register d'un nouveau user
     */
    static async register(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            console.log("Register controller called");
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
            if (!result.success && result.error === "2FA_REQUIRED") {
                return (reply.status(202).send({
                    message: "2FA code sent to email",
                    requiresTwoFactor: true,
                    userId: result.user?.id
                }));
            }

            if (!result.success) 
                return (reply.status(401).send({error: result.error}));
        
            // 🍪 Définir les cookies d'authentification
            CookieService.replyAuthTokenCookie(reply, result.accessToken!, result.refreshToken!);

            const fullUserData = await UserServices.getUserDataFromDb(result.user!.id);

            reply.send({
                message: "✅ Login successful",
                user: fullUserData,
            })
            
        } catch (error) {
                console.error("Login controller error:", error);
                reply.status(500).send({ error: "Login failed" });
        }
    }

    /**
     * Route login avec 2FA
     */
    static async loginWith2FA(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const { userId, code } = req.body as { userId: number; code: string };

            if (!userId || !code) {
                return (reply.status(400).send({ error: "User ID and code are required" }));
            }

            const result = await AuthService.loginWith2FA(userId, code);

            if (!result.success) {
                return (reply.status(401).send({ error: result.error }));
            }

            CookieService.replyAuthTokenCookie(reply, result.accessToken!, result.refreshToken!);

            reply.send({
                message: "✅ 2FA Login successful",
                user: result.user,
            });

        } catch (error) {
            console.error("2FA Login controller error:", error);
            reply.status(500).send({ error: "2FA login failed" });
        }
    }

    /**
     * Route logout 
     */
    static async logout(req: FastifyRequest, reply: FastifyReply)
    {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken)
                await AuthService.logout(refreshToken);//supp session de la db

            CookieService.clearAuthCookies(reply);
            reply.send({message: "✅ Logout successful"});

        } catch (error) {
            console.error("Logout controller error:", error);
            reply.status(500).send({ error: "Logout failed" });
        }
    }
}