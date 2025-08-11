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

  // Route register afin d'ajouter un nouveau user
  app.post('/register', {schema: registerSchema}, async (req: FastifyRequest, reply: FastifyReply) => {
      
    const userData = req.body as RegisterData;
    console.log("JE SUIS DANS LE BACKEND /REGISTER");
    const result = await registerUser(userData);
    if (!result.success)
      return (reply.status(400).send({error: result.error}));

    // 🍪 ICI ON CRÉE LES COOKIES
    reply.setCookie('accessToken', result.accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
    }) 

    reply.setCookie('refreshToken', result.refreshToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
        path: '/'
    });
      
    reply.status(201).send({
      message: "✅ User created successfully",
      user: result.user
    });
  });
  
  // Route login permet au user de ce connecter
  app.post('/login', {schema: loginSchema}, async (req: FastifyRequest, reply: FastifyReply) => {
    
    console.log("JE SUIS DANS LE BACKENd /LOGIN");

    const loginData = req.body as LoginData;
    
    const result = await loginUser(loginData);
    if (!result.success) 
      return (reply.status(401).send({error: result.error}));

    // 🍪CRÉE LES COOKIES
    reply.setCookie('accessToken', result.accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/'
    })

    reply.setCookie('refreshToken', result.refreshToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
    });
    
    reply.send({
      message: "✅ Login successful",
      user: result.user,
    })
    
  });
  
  // Route Get all users
  app.get("/users", () => {
    const stmt = db.prepare("SELECT id, email, createdAt FROM users");
    return stmt.all();
  });

  //siuu creer route /me qui donne les stats du joeur (renomable)
  app.get('/myProfile', async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user!; // info recuperer dans le middleware

      const stmt = db.prepare(`
        SELECT id, username, email, avatar, createdAt, lastLogin 
        FROM users WHERE id = ?
      `);
      const userData = stmt.get(user.userId);

      if (!userData)
        return (reply.status(404).send({error: 'User not found'}));

      reply.send({
        ...userData,
        stats:{
          wins:1,
          losses:0
        }
      });
  });

  //siuu creer route /logout

}




















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