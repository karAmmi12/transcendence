import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/authServices.js";
import { CookieService } from "../services/cookieServices.js"; 
import { UserFromDB } from "../types/auth.js";
import dotenv from 'dotenv';

export class OAuthController 
{
    private static exchangeCodeToken = "https://oauth2.googleapis.com/token";
    private static authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private static getUserGoogle = "https://www.googleapis.com/oauth2/v3/userinfo";
    // Validation au chargement de la classe
    static {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || 
            !process.env.GOOGLE_REDIRECT_URI || !process.env.API_URL_FRONT) {
                Logger.error('Missing environnement variable for oauthController Class');
                throw new Error("Missing required Google OAuth environment variables");
        }
    }

    static async oauthLogin (req: FastifyRequest, reply: FastifyReply)
    {

        try {

            const authUrl = new URL(OAuthController.authEndpoint);

            authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
            authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'profile email');
            authUrl.searchParams.set('access_type', 'offline');
            authUrl.searchParams.set('prompt', 'select_account');

            Logger.log('Redirecting to:', authUrl.toString());

            return (reply.redirect(authUrl.toString()));

        } catch (error) {
            Logger.error("Google OAuth redirect error:", error);
            return (reply.status(500).send({ error: "Google OAuth redirect failed" }));
        }
    }

    static async oauthCallback (req: FastifyRequest, reply: FastifyReply)
    {

        const { code, error } = req.query as {code?: string, error?: string};
        try {
            if(error) {
                Logger.log('OAuth error received: ', error);
                return (reply.redirect(`${process.env.API_URL_FRONT}login?error=oauth_failed`))
            }

            if (!code)
                return (reply.status(400).send('Code required for Google OAuth2'));
    
            const data = await OAuthController.exchangeCodeForToken(code!);
            Logger.log("data received from exchange code: ", data);
            
            const userData = await OAuthController.getUserData(data.token.access_token);
            Logger.log("userData: ",userData);

            const userName = userData.returnUser.email.split('@')[0];
            
            const oData = {
                username: userName,
                email: userData.returnUser.email,
                googleId: userData.returnUser.sub
            }

            const oauth2Data = oData as UserFromDB;
            const res = await AuthService.handleOAuthUser(oauth2Data);

            CookieService.replyAuthTokenCookie(reply, res.accessToken!, res.refreshToken!);
            return reply.redirect(`${process.env.API_URL_FRONT}`);
            
        }catch (error){
            if (error instanceof Error)
                Logger.error(error.message);
            Logger.error("Google generate error:", error);
            return (reply.redirect(`${process.env.API_URL_FRONT}login?error=oauth_failed`));
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

        const token = await fetch(OAuthController.exchangeCodeToken , {
            method: "POST",
            headers: {
               "Content-type": "application/x-www-form-urlencoded",
            },
            body: params.toString()
        });
        if (!token.ok)
            throw new Error('Error generate token failed');
        const tokenSuccess = await token.json();
        return {
            success: true,
            message: "token generate successfully",
            token: tokenSuccess,
        }; 
    }

    static async getUserData(accessToken: string) 
    {
        
        const userData = await fetch(OAuthController.getUserGoogle, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        if (!userData.ok)
            throw new Error('Get user profile OAuth failed');
        const returnUser = await userData.json();
        return {
            success: true,
            returnUser: returnUser
        };
    }
}