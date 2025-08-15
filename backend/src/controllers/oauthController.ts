import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/authServices.js";
import { CookieService } from "../services/cookieServices.js"; 
import 'dotenv/config'

export class OAuthController 
{
    static async oauthLogin (req: FastifyRequest, reply: FastifyReply)
    {
        try {

            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

            authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
            authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', ' profile ');
            authUrl.searchParams.set('access_type', 'offline');

            console.log('Redirecting to:', authUrl.toString());

            return (reply.redirect(authUrl.toString()));

        } catch (error) {
            console.error("Google redirect error:", error);
            return (reply.status(500).send({ error: "Google OAuth redirect failed" }));
        }
    }

    static async oauthCallback (req: FastifyRequest, reply: FastifyReply)
    {
       console.log('HELLO: I MAKE A LINK');
        const { code, error } = req.query as {code?: string, error?: string};
        try {
            console.log('siiiiiiiiiiiiiiiiiiiiiiiiiiiu');
            if (!code)
                return (reply.status(401).send(error));
            else
                return (reply.redirect(`http://localhost:5173`));
            
        }catch (error){
            console.error("Code generate error:", error);
            return (reply.status(500).send({error: "Google generate coode failed"}));
        }
    }
}