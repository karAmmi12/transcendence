import {FastifyRequest, FastifyReply} from 'fastify'
import {JWTService} from "../services/jwtServices.js";
import db from '../db/index.js'


// augmentation du detail car pas de user dans FastifyRequest de base 
declare module 'fastify' 
{
    interface FastifyRequest {
        user?: {
            userId: number;
            username: string;
        }
    }
}

// Routes publiques (pas d'auth du middleware nécessaire)
const PUBLIC_ROUTES = [
    '/api/auth/test',
    '/api/auth/register', 
    '/api/auth/login',
    '/api/auth/users',
    '/api/auth/oauth/google',
    '/api/auth/oauth/google/callback',
    '/api/home/stats'
];

/**
 * Fonction Middleware appeler partout pour verifier que la sessions du users
 * est encore valide
 */
export async function authMiddleware(req: FastifyRequest, reply:FastifyReply)
{
    const routePath = req.url.split('?')[0];
    console.log('Checking route:', routePath); // Debug
    try{
        if (PUBLIC_ROUTES.includes(req.url) || PUBLIC_ROUTES.includes(routePath))
            return; //on ignore certaine route voir liste au dessus

        // recupere l'accessToken dans les cookies
        const accessToken = req.cookies.accessToken;

        // check accessToken
        if (accessToken)
        {
            const accessPayload = JWTService.verifyAccessToken(accessToken);
            if (accessPayload)
            {
                // Definir req.user pour des routes securiser
                req.user = {
                    userId: accessPayload.userId,
                    username: accessPayload. username
                }
                return ; // accessToken valide 
            }
        }

        // recupere le refreshToken dans les cookies
        const refreshToken = req.cookies.refreshToken;

        // si pas de refreshToken trouver demander au user de ce reconnecter
        if (!refreshToken)
        {
            console.log('No refresh token found, user needs to login again');
            return (reply.status(401).send({error: 'Authentification required'}));
        }
        
        // sinon verifier le refreshToken
        const refreshPayload = JWTService.verifyRefreshToken(refreshToken);

        // si refreshToken incorrect
        if (!refreshPayload)
            return (reply.status(401).send({error: 'Invalid refresh Token'}));

        // Si refresh correct verifier la session en db
        const sessionCheck = JWTService.isValidSession(refreshToken);

        // si session nn valide return session expirer
        if (!sessionCheck.valid)
            return (reply.status(401).send({error: 'Session expired'}));

        // Sinon recup info user dans la db puis si ok -> generer nouveau accessToken
        const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
        const user = userStmt.get(sessionCheck.userId!) as {username: string} | undefined;

        if (!user)
            return (reply.status(401).send({error: 'User not found'}));

        const newAccessToken = JWTService.generateAccessToken({
            userId: sessionCheck.userId!,
            username: user.username
        })

        // Enfin maj du cookie
        reply.setCookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
            path: '/'
        });

        // Definir req.user pour des routes securiser
        req.user = {
            userId: sessionCheck.userId!,
            username: user. username
        }

    } catch (error) {
        console.error('Middleware error:', error);
        return (reply.status(500).send({error: 'Authentification error'}));
    }
}