import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import db from "../db/index.js";
import bcrypt from "bcrypt"
import { loginSchema, registerSchema } from "../schemas/auth_schema.js";
import { RegisterData, LoginData } from "../types/auth.js";
import { loginUser, registerUser } from "../services/authServices.js";
import { log } from "console";

export default async function authRoutes(app: FastifyInstance) {
    

    // Route de test
    app.get('/test', async (req: FastifyRequest, reply: FastifyReply) => {
        return { message: 'Auth route works!' };
    });

    // register ANCIENNE VERSION
    // app.post("/register", async (req: FastifyRequest, reply: FastifyReply) => {
    //     const { email, password } = req.body as { email: string; password: string};

    //     if (!email || !password) {
    //         return (reply.status(400).send({error: "Email and password required"}));
    //     }

    //     const hashed = await bcrypt.hash(password, 10);

    //     try {
    //   const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    //   stmt.run(email, hashed);

    //   reply.send({ message: "✅ User created" });
    // } catch (err) {
    //   reply.status(400).send({ error: "Email already exists" });
    // }
  // });


  //route register afin d'ajouter un nouveau user
  app.post('/register', {schema: registerSchema}, async (req: FastifyRequest, reply: FastifyReply) => {

      const userData = req.body as RegisterData;

      const result = await registerUser(userData);
      if (!result.success)
          return (reply.status(400).send({error: result.error}));
      
      reply.status(201).send({
        message: "✅ User created successfully",
        user: result.user
      });
  });

  //route login permet au user de ce connecter
  app.post('/login', {schema: loginSchema}, async (req: FastifyRequest, reply: FastifyReply) => {
    
      const loginData = req.body as LoginData;

      const result = await loginUser(loginData);
      if (!result.success) 
        return (reply.status(401).send({error: result.error}));

      reply.send({
          message: "✅ Login successful",
          user: result.user
      })

  });

  // Get all users
  app.get("/users", () => {
    const stmt = db.prepare("SELECT id, email, createdAt FROM users");
    return stmt.all();
  });
}

