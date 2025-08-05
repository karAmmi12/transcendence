import Fastify from "fastify";
import cors from "@fastify/cors";
import authRoutes from "./routes/auth.js";

const app = Fastify({ logger: true });

// Autoriser CORS pour le dev frontend

await app.register(cors, { origin: "*" });

// Routes
await app.register(authRoutes);

const start = async () => {
  try {
    await app.listen({ port: 8000, host: "0.0.0.0" });
    console.log("✅ Backend running on http://localhost:8000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
