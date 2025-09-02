import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import friendsRoutes from "./routes/friends.js";
import homeRoutes from "./routes/home.js";
import twoFaRoutes from "./routes/twoFactorRoute.js";
import tournamentRoutes from "./routes/tournament.js";
import matchRoutes from "./routes/match.js";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { authMiddleware } from "./middleware/middleware.js";
import './utils/cleanupTokens';
// ...existing code...

const app = Fastify({ logger: true });

const start = async () => {
  try {
    // Autoriser CORS pour le dev frontend
    await app.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
      ? ['https://localhost:8443', 'https://localhost', 'http://localhost:8080']
      : [
          'http://localhost:5173',  // Vite dev
         'http://localhost:3000',  // Autres frontends
          'http://localhost:8080',  // Nginx frontend
          'http://localhost:8000'   // Backend direct
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        optionsSuccessStatus: 200
    });

    // PLugin pour les cookies
    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET || "fallback-cookie-secret"
    });

    //siuu Enregistrer le plugin multipart pour gérer les uploads
    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
      }
    });

     //siuu Servir les fichiers statiques (avatars)
    await app.register(fastifyStatic, {
      root: path.join(process.cwd(), 'uploads'),
      prefix: '/uploads/'
    });
    
    // Fastify hook permet de passer par le middleware pour verifier les token a chaque passage
    app.addHook('preHandler', authMiddleware);

    // Routes (apres etre passer dans le Middleware)
    await app.register(authRoutes, {prefix: '/api/auth'});
    await app.register(twoFaRoutes, {prefix: '/api/2fa'});
    await app.register(usersRoutes, {prefix: '/api/user'});
    await app.register(friendsRoutes, {prefix: '/api/friends'});
    await app.register(homeRoutes, {prefix: '/api/home'});
    await app.register(tournamentRoutes, {prefix: '/api/tournament'});
    await app.register(matchRoutes, {prefix: '/api/match'});


    // Démarrer le serveur 
    await app.listen({ port: 8000, host: "0.0.0.0" });
    console.log("✅ Backend running on http://localhost:8000");
    
  } catch (err) {
    console.error("💥 Failed to start server:", err);
    app.log.error(err);
    process.exit(1);
  }
};

start();