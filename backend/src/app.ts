import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth.js";
import cookie from "@fastify/cookie";
import { authMiddleware } from "./middleware/middleware.js";

const app = Fastify({ logger: true });

// siuu ancienne Version / nouvelle tout dans le start
// // Autoriser CORS pour le dev frontend
// await app.register(cors, {
//   origin: "*", 
//   credentials: true // pour les cookies
// });

// // PLugin pour les cookies
// await app.register(cookie, {
//   secret: process.env.COOKIE_SECRET || "fallback-cookie-secret"
// })

// // Fastify hook permet de passer par le middleware pour verifier les token a chaque passage
// app.addHook('preHandler', authMiddleware);

// // Routes (apres etre passer dans le Middleware)
// await app.register(authRoutes);

// const start = async () => {
//   try {
//     await app.listen({ port: 8000, host: "0.0.0.0" });
//     console.log("✅ Backend running on http://localhost:8000");
//   } catch (err) {
//     app.log.error(err);
//     process.exit(1);
//   }
// };

// start();


const start = async () => {
  try {
    // Autoriser CORS pour le dev frontend
    await app.register(cors, {
      origin: "*", 
      credentials: true // pour les cookies
    });

    // PLugin pour les cookies
    await app.register(cookie, {
      secret: process.env.COOKIE_SECRET || "fallback-cookie-secret"
    });

    // Fastify hook permet de passer par le middleware pour verifier les token a chaque passage
    app.addHook('preHandler', authMiddleware);

    // Routes (apres etre passer dans le Middleware)
    await app.register(authRoutes, {prefix: '/auth'});

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