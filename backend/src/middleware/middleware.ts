import {FastifyRequest, FastifyReply} from 'fastify'
import {JWTService} from "../services/jwtServices.js";
import db from '../db/index.js'
import {serialize} from '../utils/serialize.js';

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
    '/api/home/stats',
    '/api/auth/loginWith2FA',
    '/api/tournament/create',
    'api/tournament'
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

        // ✅ Routes de tournoi : authentification optionnelle
        if (routePath.startsWith('/api/tournament')) 
        {
            const accessToken = req.cookies.accessToken;
            const refreshToken = req.cookies.refreshToken;
            
            // Si des tokens sont présents, essayer de les valider
            if (accessToken)
            {
                const accessPayload = JWTService.verifyAccessToken(accessToken);
                if (accessPayload) 
                {
                    req.user = {
                        userId: accessPayload.userId,
                        username: accessPayload.username
                    };
                    return; // Utilisateur authentifié
                }
            }
            
            // Si accessToken invalide mais refreshToken présent
            if (refreshToken) 
            {
                try {
                    const refreshPayload = JWTService.verifyRefreshToken(refreshToken);
                    if (refreshPayload) 
                    {
                        const sessionCheck = JWTService.isValidSession(refreshToken);
                        if (sessionCheck.valid) 
                        {
                            // Récupérer les infos utilisateur et générer nouveau accessToken
                            const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
                            const userRaw = userStmt.get(sessionCheck.userId!) as {username: string} | undefined;
                            
                            if (userRaw) 
                            {
                                const user = serialize(userRaw);
                                const newAccessToken = JWTService.generateAccessToken({
                                    userId: sessionCheck.userId!,
                                    username: user.username
                                });
                                
                                reply.setCookie('accessToken', newAccessToken, {
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // ✅ Plus permissif en dev
                                    maxAge: 15 * 60 * 1000,
                                    path: '/',
                                    // ✅ Permettre les cookies cross-domain en dev
                                    domain: undefined
                                });
                                
                                req.user = {
                                    userId: sessionCheck.userId!,
                                    username: user.username
                                };
                            }
                        }
                    }
                } catch (error) {
                    console.log('Optional auth failed for tournament route, continuing without user...');
                }
            }
            // Continuer dans tous les cas (avec ou sans req.user)
            return;
        }
        
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
        const userRaw = userStmt.get(sessionCheck.userId!) as {username: string} | undefined;

        if (!userRaw)
            return (reply.status(401).send({error: 'User not found'}));

        //GRRRRRRRRR
        const user = serialize(userRaw);

        const newAccessToken = JWTService.generateAccessToken({
            userId: sessionCheck.userId!,
            username: user.username
        })

        // Enfin maj du cookie
        reply.setCookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // ✅ Plus permissif en dev
            maxAge: 15 * 60 * 1000,
            path: '/',
            // ✅ Permettre les cookies cross-domain en dev
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined
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