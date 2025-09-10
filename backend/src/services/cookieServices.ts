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
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // ✅ Plus permissif en dev
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
            // ✅ Permettre les cookies cross-domain en dev
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined
        }) 

        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // ✅ Plus permissif en dev
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
            path: '/',
            // ✅ Permettre les cookies cross-domain en dev
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined
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