import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/authServices.js";
import { CookieService } from "../services/cookieServices.js"; 
import {  GoogleUserData, UserFromDB } from "../types/auth.js";
import 'dotenv/config'

export class OAuthController 
{

    private static exchangeCodeToken = "https://oauth2.googleapis.com/token";
    private static authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private static getUserGoogle = "https://www.googleapis.com/oauth2/v3/userinfo";
    
        // Validation au chargement de la classe
    static {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || 
            !process.env.GOOGLE_REDIRECT_URI || !process.env.API_URL_FRONT) {
                console.error('Missing environnement variable for oauthController Class');
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

            console.log('Redirecting to:', authUrl.toString());

            return (reply.redirect(authUrl.toString()));

        } catch (error) {
            console.error("Google OAuth redirect error:", error);
            return (reply.status(500).send({ error: "Google OAuth redirect failed" }));
        }
    }

    static async oauthCallback (req: FastifyRequest, reply: FastifyReply)
    {

        const { code, error } = req.query as {code?: string, error?: string};
        try {
            if(error) {
                console.log('OAuth error received: ', error);
                return (reply.redirect(`${process.env.API_URL_FRONT}/login?error=${error}`))
            }

            if (!code)
                return (reply.status(400).send('Code required for Google OAuth2'));
    
            const data = await OAuthController.exchangeCodeForToken(code!);
            console.log("data received from exchange code: ", data);
            if (!data.success)
                return (reply.status(400).send(`${data.success}${data.error}`));
            
            const userData = await OAuthController.getUserData(data.token.access_token);
            console.log("userData: ",userData);
            if (!userData.success)
                return (reply.status(401).send(`error: ${userData.error}`));

            const userName = userData.returnUser.email.split('@')[0];
            
            const oData = {
                username: userName,
                email: userData.returnUser.email,
                googleId: userData.returnUser.sub
            }

            const oauth2Data = oData as UserFromDB;
            const res = await AuthService.handleOAuthUser(oauth2Data);
            if (!res.success)
                return (reply.status(401).send({error: res.error}));
            CookieService.replyAuthTokenCookie(reply, res.accessToken!, res.refreshToken!);
            return (reply.status(201).send({sucess: true, username: res.user?.username, email: res.user?.email}));
            
        }catch (error){
            console.error("Code Google generate error:", error);
            return (reply.status(500).send({error: "Google generate code failed"}));
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
            if (!token.ok)
                return {success: false, error: 'Error generate token failed'};
            const tokenSuccess = await token.json();
            return {
                success: true,
                message: "token generate successfully",
                token: tokenSuccess,
            };
        } 
        catch (error){
            console.error(`Error generate token failed: ${error}`);
            return {success: false, error: 'Error get users info'};
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
            if (!userData.ok)
                return {success: false, error: 'Get user profile OAuth failed'};
            const returnUser = await userData.json();
            return {
                success: true,
                returnUser: returnUser
            };
        }
        catch(error) {
            console.log(`Error get users info: ${error}`);
            return {success: false, error: 'Error get users info'};
        }
    }
}