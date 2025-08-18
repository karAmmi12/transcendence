import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/authServices.js";
import { CookieService } from "../services/cookieServices.js"; 
import 'dotenv/config'
import { OAuth2Service } from "../services/oauth2Services.js";

export class OAuthController 
{

    private static exchangeCodeToken = "https://oauth2.googleapis.com/token";
    private static authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private static getUserGoogle = "https://www.googleapis.com/oauth2/v3/userinfo";
    
    static async oauthLogin (req: FastifyRequest, reply: FastifyReply)
    {
        try {

            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

            authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
            authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'profile email');
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
        const { code, error } = req.query as {code?: string, error?: string};
        try {
            if(error) {
                console.log('OAuth error received: ', error);
                return (reply.redirect(`http://localhost:5173/login?error=${error}`))
            }

            if (!code)
                return (reply.status(401).send(error));
    
            const data = await OAuthController.exchangeCodeForToken(code!);
            console.log("data received from exchange code: ", data)
            if (!data)
                return (reply.status(401).send('Error: Required code for OAuth2'));
            
            const userData = await OAuthController.getUserData(data.access_token);
            console.log("userData: ",userData)
            if (!userData)
                return (reply.status(401).send('Error: Required token access for OAuth2'));
            // // si l'utilisateur existe dans la db tu le connect, si non tu le creee et tu le connect
            const res = await OAuth2Service.
            return (reply.redirect(`http://localhost:5173`));
            
        }catch (error){
            console.error("Code generate error:", error);
            return (reply.status(500).send({error: "Google generate coode failed"}));
        }
    }

    static async exchangeCodeForToken(code: string) 
    {
        const params = new URLSearchParams({
            code, 
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
            grant_type: 'authorization_code',
        });

        try {
            const token = await fetch(OAuthController.exchangeCodeToken , {
                method: "POST",
                headers: {
                   "Content-type": "application/x-www-form-urlencoded",
                },
                body: params.toString()
            });
            return (token.json());
        } 
        catch (error){
            console.error(`Error generate token failed: ${error}`);
            return (null);
        }
      
    }

    static async getUserData(accessToken: string) 
    {
        try {
            const userData = await fetch(OAuthController.getUserGoogle, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return (userData.json());
        }
        catch(error) {
            console.log(`Error get users info: ${error}`);
            return (null);
        }
    }
}