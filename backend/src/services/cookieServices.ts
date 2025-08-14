import {FastifyReply} from "fastify";

export class CookieService 
{
    /**
     * Reply les tokens dans les cookies
     */
    static replyAuthTokenCookie(reply: FastifyReply, accessToken: string, refreshToken: string)
    {
        // 🍪 ICI ON CRÉE LES COOKIES
        reply.setCookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        }) 

        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
            path: '/'
        });
    }

    //fonction supprime les cookies
    static clearAuthCookies(reply: FastifyReply)
    {
        reply.clearCookie('accessToken', {path: '/'});
        reply.clearCookie('refreshToken', {path: '/'});
    }

    // siuuu ajouter fonction maj de l'access token
}