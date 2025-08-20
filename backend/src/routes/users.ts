import {FastifyInstance} from "fastify";
import { UserController } from "../controllers/userController";

export default async function usersRoutes(app: FastifyInstance)
{
    // routes proterger par le middleware
    app.get('/me', UserController.getProfile);
    app.put('/updateProfile', UserController.updateProfile);
    app.get('/users', UserController.getAllUsernames);
    app.get('/users/search', UserController.searchUsers);
    app.get('/profile/:id', UserController.getProfileById);
    app.put('/change-password', UserController.changePassword);
}