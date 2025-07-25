import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/index.js";
import bcrypt from "bcrypt"

export default async function authRoutes(app: FastifyInstance) {
    

    // Route de test
    app.get('/test', async (req: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Auth route works!' };
    });

    // Route de login (exemple)
    app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Login endpoint' };
    });

    // register
    app.post("/register", async (req: FastifyRequest, reply: FastifyReply) => {
        const { email, password } = req.body as { email: string; password: string};

        if (!email || !password) {
            return (reply.status(400).send({error: "Email and password required"}));
        }

        const hashed = await bcrypt.hash(password, 10);

        try {
      const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
      stmt.run(email, hashed);

      reply.send({ message: "✅ User created" });
    } catch (err) {
      reply.status(400).send({ error: "Email already exists" });
    }
  });

  // Get all users
  app.get("/users", () => {
    const stmt = db.prepare("SELECT id, email, createdAt FROM users");
    return stmt.all();
  });
}

